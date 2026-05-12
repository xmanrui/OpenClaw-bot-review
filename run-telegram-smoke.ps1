$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$secret = [Environment]::GetEnvironmentVariable('INBOUND_SHARED_SECRET', 'Process')
if ([string]::IsNullOrWhiteSpace($secret)) {
  $secret = 'god-plan-demo-secret'
  $env:INBOUND_SHARED_SECRET = $secret
}

$script:StartedStandalonePid = $null
$script:LastSmokeOutput = $null
$script:SmokeDbFile = Join-Path $env:TEMP ("god-plan-smoke-{0}.json" -f ([Guid]::NewGuid().ToString('N')))
$env:GOD_PLAN_DB_FILE = $script:SmokeDbFile

Write-Host "Using isolated GOD_PLAN_DB_FILE: $script:SmokeDbFile"

function Wait-HttpReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastError = $null

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return [pscustomobject]@{
          Ready = $true
          StatusCode = $response.StatusCode
          Error = $null
        }
      }
    } catch {
      $lastError = $_.Exception.Message
      Start-Sleep -Milliseconds 500
    }
  }

  return [pscustomobject]@{
    Ready = $false
    StatusCode = $null
    Error = $lastError
  }
}

function Get-Port3000Diag {
  $conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if (-not $conn) {
    return [pscustomobject]@{
      HasListener = $false
      Pid = $null
      ProcessName = $null
    }
  }

  $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
  return [pscustomobject]@{
    HasListener = $true
    Pid = $conn.OwningProcess
    ProcessName = if ($proc) { $proc.ProcessName } else { $null }
  }
}

function Invoke-SmokeTest {
  $output = & node .\scripts\smoke-telegram-inbound.mjs 2>&1
  $exitCode = $LASTEXITCODE
  $text = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine

  $script:LastSmokeOutput = [pscustomobject]@{
    ExitCode = $exitCode
    Output = $text
  }

  if ($text) {
    Write-Host $text
  }

  return $exitCode
}

function Write-FailureDiagnostics {
  param(
    [string]$Stage,
    [object]$Probe = $null
  )

  Write-Warning "Failure stage: $Stage"

  if ($script:StartedStandalonePid) {
    Write-Host '--- started standalone pid ---'
    [pscustomobject]@{
      StartedPid = $script:StartedStandalonePid
    } | ConvertTo-Json -Depth 3
  }

  $diag = Get-Port3000Diag
  Write-Host '--- port 3000 diag ---'
  $diag | ConvertTo-Json -Depth 3

  if ($Probe) {
    Write-Host '--- readiness probe ---'
    $Probe | ConvertTo-Json -Depth 3
  }

  try {
    $homepage = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 3
    Write-Host '--- homepage probe ---'
    [pscustomobject]@{
      StatusCode = $homepage.StatusCode
      ContentType = $homepage.Headers['Content-Type']
    } | ConvertTo-Json -Depth 3
  } catch {
    Write-Host '--- homepage probe ---'
    [pscustomobject]@{
      StatusCode = $null
      Error = $_.Exception.Message
    } | ConvertTo-Json -Depth 3
  }

  if ($script:LastSmokeOutput) {
    Write-Host '--- last smoke output ---'
    $script:LastSmokeOutput | ConvertTo-Json -Depth 4
  }
}


function Stop-ProcessIfRunning {
  param(
    [int]$ProcessId,
    [string]$Label
  )

  if (-not $ProcessId) {
    return
  }

  $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $proc) {
    return
  }

  Write-Host "Stopping ${Label} PID: $ProcessId"
  try {
    Stop-Process -Id $ProcessId -Force -ErrorAction Stop
  } catch {
    Write-Warning "Failed to stop ${Label} process: $ProcessId"
  }
}

function Stop-StartedStandalone {
  Stop-ProcessIfRunning -ProcessId $script:StartedStandalonePid -Label 'started standalone wrapper'

  $portOwner = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty OwningProcess
  Stop-ProcessIfRunning -ProcessId $portOwner -Label 'port 3000 listener'
}

try {
  Write-Host '[1/3] Building project...'
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-FailureDiagnostics -Stage 'build'
    throw 'Build failed.'
  }

  Write-Host '[2/3] Starting standalone server in background...'
  $existing = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty OwningProcess
  if ($existing) {
    Write-Host "Stopping existing PID on port 3000: $existing"
    try {
      Stop-Process -Id $existing -Force -ErrorAction Stop
      Start-Sleep -Seconds 1
    } catch {
      Write-Warning "Failed to stop existing process on port 3000: $existing"
    }
  }

  $hostname = '127.0.0.1'
  $previousHostname = $env:HOSTNAME
  $env:HOSTNAME = $hostname
  $process = Start-Process -FilePath node -ArgumentList '.next\standalone\server.js' -WorkingDirectory $repoRoot -PassThru -WindowStyle Hidden
  if ($null -eq $previousHostname) {
    Remove-Item Env:\HOSTNAME -ErrorAction SilentlyContinue
  } else {
    $env:HOSTNAME = $previousHostname
  }
  $script:StartedStandalonePid = $process.Id
  Write-Host "Started PID: $($process.Id)"

  $probe = Wait-HttpReady -Url 'http://127.0.0.1:3000/' -TimeoutSeconds 20
  if (-not $probe.Ready) {
    Write-FailureDiagnostics -Stage 'readiness' -Probe $probe
    throw 'Standalone server did not become ready on http://127.0.0.1:3000/ within timeout.'
  }

  Write-Host '[3/3] Running Telegram inbound smoke test...'
  $smokeExitCode = Invoke-SmokeTest
  if ($smokeExitCode -ne 0) {
    Write-FailureDiagnostics -Stage 'smoke' -Probe $probe
    throw 'Smoke test failed.'
  }
} finally {
  Stop-StartedStandalone

  if ($script:SmokeDbFile -and (Test-Path $script:SmokeDbFile)) {
    Remove-Item -Path $script:SmokeDbFile -Force -ErrorAction SilentlyContinue
  }
}

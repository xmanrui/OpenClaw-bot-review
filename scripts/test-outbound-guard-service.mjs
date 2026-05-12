import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import ts from 'typescript'

const repoRoot = process.cwd()
const servicePath = path.join(repoRoot, 'lib/god-plan/services/outbound-guard-service.ts')
const serviceSource = fs.readFileSync(servicePath, 'utf8')

const transpiled = ts.transpileModule(serviceSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
    strict: true,
  },
  fileName: servicePath,
}).outputText

const testModule = new Module(servicePath)
testModule.filename = servicePath
testModule.paths = Module._nodeModulePaths(path.dirname(servicePath))
testModule._compile(transpiled, servicePath)

const { outboundGuardService } = testModule.exports

function withEnv(env, fn) {
  const keys = [
    'GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE',
    'GOD_PLAN_OUTBOUND_SENDER_CONFIGURED',
    'GOD_PLAN_ENABLE_PRODUCTION_OUTBOUND_SEND',
  ]
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))

  for (const key of keys) delete process.env[key]
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) process.env[key] = value
  }

  try {
    fn()
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
}

function evaluate(overrides = {}) {
  return outboundGuardService.evaluate({
    reviewId: 'test_review',
    runtimeId: 'test_runtime',
    actionType: 'dm_suggest',
    humanReviewed: true,
    ...overrides,
  })
}

withEnv({}, () => {
  const result = evaluate({ requestedMode: 'production' })
  assert.equal(result.environmentMode, 'local')
  assert.equal(result.mode, 'dry_run')
  assert.equal(result.decision, 'allow_dry_run')
  assert.equal(result.externalSendAllowed, false)
  assert.deepEqual(result.blockingReasons, ['dry_run_mode_required'])
  assert.ok(result.reasons.includes('local_mode_dry_run_only'))

  const diagnostics = outboundGuardService.getDiagnostics()
  assert.equal(diagnostics.environmentMode, 'local')
  assert.equal(diagnostics.externalSendPossible, false)
  assert.equal(diagnostics.defaultDecision.externalSendAllowed, false)
  assert.ok(diagnostics.nextActions.some((action) => action.key === 'keep_local_dry_run_guard'))
})

withEnv({ GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE: 'staging' }, () => {
  const result = evaluate({ requestedMode: 'staging' })
  assert.equal(result.environmentMode, 'staging')
  assert.equal(result.allowed, false)
  assert.equal(result.decision, 'block')
  assert.equal(result.externalSendAllowed, false)
  assert.deepEqual(result.blockingReasons, ['sender_not_configured'])

  const diagnostics = outboundGuardService.getDiagnostics()
  assert.equal(diagnostics.environmentMode, 'staging')
  assert.equal(diagnostics.externalSendPossible, false)
  assert.ok(diagnostics.nextActions.some((action) => action.key === 'clear_sender_not_configured'))
})

withEnv({
  GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE: 'staging',
  GOD_PLAN_OUTBOUND_SENDER_CONFIGURED: 'true',
}, () => {
  const result = evaluate({ requestedMode: 'staging' })
  assert.equal(result.environmentMode, 'staging')
  assert.equal(result.allowed, true)
  assert.equal(result.decision, 'allow_send')
  assert.equal(result.externalSendAllowed, true)
  assert.deepEqual(result.blockingReasons, [])

  const dryRun = evaluate({ requestedMode: 'dry_run' })
  assert.equal(dryRun.decision, 'allow_dry_run')
  assert.equal(dryRun.externalSendAllowed, false)

  const diagnostics = outboundGuardService.getDiagnostics()
  assert.equal(diagnostics.externalSendPossible, true)
  assert.ok(diagnostics.nextActions.some((action) => action.key === 'run_non_local_guarded_smoke'))
})

withEnv({
  GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE: 'production',
  GOD_PLAN_OUTBOUND_SENDER_CONFIGURED: 'true',
}, () => {
  const result = evaluate({ requestedMode: 'production' })
  assert.equal(result.environmentMode, 'production')
  assert.equal(result.allowed, false)
  assert.equal(result.decision, 'block')
  assert.equal(result.externalSendAllowed, false)
  assert.deepEqual(result.blockingReasons, ['production_send_disabled'])

  const diagnostics = outboundGuardService.getDiagnostics()
  assert.equal(diagnostics.externalSendPossible, false)
  assert.ok(diagnostics.nextActions.some((action) => action.key === 'clear_production_send_disabled'))
})

withEnv({
  GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE: 'production',
  GOD_PLAN_OUTBOUND_SENDER_CONFIGURED: 'true',
  GOD_PLAN_ENABLE_PRODUCTION_OUTBOUND_SEND: 'true',
}, () => {
  const result = evaluate({ requestedMode: 'production' })
  assert.equal(result.environmentMode, 'production')
  assert.equal(result.allowed, true)
  assert.equal(result.decision, 'allow_send')
  assert.equal(result.externalSendAllowed, true)
  assert.deepEqual(result.blockingReasons, [])

  const diagnostics = outboundGuardService.getDiagnostics()
  assert.equal(diagnostics.externalSendPossible, true)
  assert.ok(diagnostics.nextActions.some((action) => action.key === 'run_non_local_guarded_smoke'))
})

console.log(JSON.stringify({
  ok: true,
  coveredModes: ['local', 'staging', 'production'],
  coveredDecisions: ['allow_dry_run', 'block', 'allow_send'],
  productionSendStillRequiresExplicitEnable: true,
}, null, 2))

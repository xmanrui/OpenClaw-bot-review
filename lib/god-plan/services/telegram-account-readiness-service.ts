import { getTelegramSessionReferenceReadiness } from './telegram-session-reference-readiness-service'

export type TelegramReadinessStatus = 'local_only' | 'blocked' | 'ready_for_manual_login_design'

export interface TelegramAccountReadinessCheck {
  key: string
  label: string
  passed: boolean
  severity: 'info' | 'warning' | 'blocking'
  summary: string
}

export interface TelegramAccountReadinessDiagnostics {
  generatedAt: string
  status: TelegramReadinessStatus
  localOnly: boolean
  environmentMode: 'local' | 'staging' | 'production'
  apiIdConfigured: boolean
  apiHashConfigured: boolean
  sessionConfigured: boolean
  botTokenConfigured: boolean
  interactiveLoginImplemented: false
  externalApiCallsAllowed: false
  outboundSendAllowed: false
  rawCredentialStored: false
  sessionReferenceReadiness: {
    configured: boolean
    format: 'missing' | 'local_ref' | 'unsafe_raw_like' | 'unsupported'
    safeForWebDiagnostics: boolean
    rawSessionExposed: false
    telegramApiCalled: false
    summary: string
  }
  handoffPreflight: {
    command: string
    evidenceCommand: string
    evidencePath: string
    evidenceEndpoint: string
    jsonEndpoint: string
    runbookPath: string
    evidenceLocalOnly: true
    valueRedacted: true
    rawCredentialStored: false
    rawSessionStored: false
    telegramApiCalled: false
    outboundSendAttempted: false
    externalSentFinalized: false
  }
  summary: string
  checks: TelegramAccountReadinessCheck[]
  nextActions: {
    key: string
    label: string
    priority: 'low' | 'medium' | 'high'
    summary: string
  }[]
  loginHandoffChecklist: {
    key: string
    label: string
    status: 'not_started' | 'ready' | 'blocked'
    requiredBeforeInteractiveLogin: boolean
    summary: string
  }[]
}

function readEnvironmentMode(): TelegramAccountReadinessDiagnostics['environmentMode'] {
  const value = process.env.GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE
  if (value === 'staging' || value === 'production') return value
  return 'local'
}

function isConfigured(name: string) {
  const value = process.env[name]
  return typeof value === 'string' && value.trim().length > 0
}

export const telegramAccountReadinessService = {
  getDiagnostics(): TelegramAccountReadinessDiagnostics {
    const environmentMode = readEnvironmentMode()
    const apiIdConfigured = isConfigured('GOD_PLAN_TELEGRAM_API_ID')
    const apiHashConfigured = isConfigured('GOD_PLAN_TELEGRAM_API_HASH')
    const sessionConfigured = isConfigured('GOD_PLAN_TELEGRAM_SESSION_REF')
    const botTokenConfigured = isConfigured('GOD_PLAN_TELEGRAM_BOT_TOKEN')
    const localOnly = environmentMode === 'local'
    const sessionReferenceReadiness = getTelegramSessionReferenceReadiness()

    const checks: TelegramAccountReadinessCheck[] = [
      {
        key: 'local_dry_run_guard',
        label: 'Local dry-run guard',
        passed: localOnly,
        severity: localOnly ? 'info' : 'warning',
        summary: localOnly
          ? 'Local mode is active; Telegram login remains a readiness check only.'
          : 'Non-local mode is visible, but this diagnostic still does not log in or call Telegram.',
      },
      {
        key: 'api_id_presence',
        label: 'Telegram API ID presence',
        passed: apiIdConfigured,
        severity: 'warning',
        summary: apiIdConfigured ? 'API ID presence detected without exposing the value.' : 'API ID is not configured; do not enter it into this page.',
      },
      {
        key: 'api_hash_presence',
        label: 'Telegram API hash presence',
        passed: apiHashConfigured,
        severity: 'warning',
        summary: apiHashConfigured ? 'API hash presence detected without exposing the value.' : 'API hash is not configured; do not enter it into this page.',
      },
      {
        key: 'session_ref_presence',
        label: 'Session reference presence',
        passed: sessionConfigured,
        severity: 'warning',
        summary: sessionConfigured ? 'A session reference is present; raw session content is not read or displayed.' : 'No session reference is configured; interactive user login is not implemented here.',
      },
      {
        key: 'interactive_login_runtime',
        label: 'Interactive login runtime',
        passed: false,
        severity: 'blocking',
        summary: 'Interactive Telegram user login is intentionally not implemented in this local readiness diagnostic.',
      },
      {
        key: 'no_external_api_calls',
        label: 'No Telegram API calls',
        passed: true,
        severity: 'info',
        summary: 'This service only reads boolean configuration presence and never calls Telegram or external APIs.',
      },
      {
        key: 'no_raw_credential_storage',
        label: 'No raw credential storage',
        passed: true,
        severity: 'info',
        summary: 'Raw API hash, bot token, session string, phone number, and login codes are not stored or returned.',
      },
    ]

    const blockingChecks = checks.filter((check) => check.severity === 'blocking' && !check.passed)
    const status: TelegramReadinessStatus = localOnly
      ? 'local_only'
      : blockingChecks.length > 0
        ? 'blocked'
        : 'ready_for_manual_login_design'

    return {
      generatedAt: new Date().toISOString(),
      status,
      localOnly,
      environmentMode,
      apiIdConfigured,
      apiHashConfigured,
      sessionConfigured,
      sessionReferenceReadiness,
      botTokenConfigured,
      interactiveLoginImplemented: false,
      externalApiCallsAllowed: false,
      outboundSendAllowed: false,
      rawCredentialStored: false,
      handoffPreflight: {
        command: 'npm run check:telegram-login-handoff-readiness',
        evidenceCommand: 'npm run check:telegram-login-handoff-readiness:evidence',
        evidencePath: 'logs/telegram-login-handoff/readiness-preflight.json',
        evidenceEndpoint: '/api/telegram-login-handoff-evidence',
        jsonEndpoint: '/api/telegram-account-readiness',
        runbookPath: '/docs/telegram-manual-login-handoff.md',
        evidenceLocalOnly: true,
        valueRedacted: true,
        rawCredentialStored: false,
        rawSessionStored: false,
        telegramApiCalled: false,
        outboundSendAttempted: false,
        externalSentFinalized: false,
      },
      summary: localOnly
        ? 'Telegram account login remains local readiness only. No login, no Telegram API call, and no outbound send is performed.'
        : 'Telegram account readiness is visible, but interactive login and sender runtime are still blocked until explicitly designed and guarded.',
      checks,
      loginHandoffChecklist: [
        {
          key: 'secure_local_device_handoff',
          label: 'Secure local device handoff',
          status: 'not_started',
          requiredBeforeInteractiveLogin: true,
          summary: 'A future login flow must run outside the web UI on a trusted local device and must not collect phone numbers or codes in this page.',
        },
        {
          key: 'session_reference_only',
          label: 'Session reference only',
          status: sessionConfigured ? 'ready' : 'not_started',
          requiredBeforeInteractiveLogin: true,
          summary: sessionConfigured
            ? 'Only a session reference is visible here; raw session material is not read or returned.'
            : 'Prepare a safe session reference mechanism before any interactive login design is attempted. Session reference readiness must use local:<name> or file:<local-path-reference> without raw session content.',
        },
        {
          key: 'credential_presence_only',
          label: 'Credential presence-only checks',
          status: apiIdConfigured && apiHashConfigured ? 'ready' : 'not_started',
          requiredBeforeInteractiveLogin: true,
          summary: 'Readiness may check whether credentials exist, but must never expose API hash, bot token, login code, phone number, or raw session content.',
        },
        {
          key: 'outbound_guard_before_sender',
          label: 'Outbound guard before sender',
          status: localOnly ? 'blocked' : 'not_started',
          requiredBeforeInteractiveLogin: true,
          summary: 'Even after account login exists, outbound send remains blocked until human review, outbound guard, sender ledger, and finalization checks are implemented.',
        },
      ],
      nextActions: [
        {
          key: 'keep_credentials_out_of_ui',
          label: 'Keep credentials out of UI',
          priority: 'high',
          summary: 'Do not paste API hash, bot token, phone number, login code, or raw session content into the web UI or repository.',
        },
        {
          key: 'design_manual_login_handoff',
          label: 'Design manual login handoff',
          priority: 'medium',
          summary: 'Future work should define a separate guarded local CLI/device handoff before any interactive Telegram login is attempted.',
        },
        {
          key: 'keep_outbound_guard_first',
          label: 'Keep outbound guard first',
          priority: 'medium',
          summary: 'Even after login readiness improves, outbound jobs must still pass human review, guard, sender ledger, and finalization checks.',
        },
      ],
    }
  },
}

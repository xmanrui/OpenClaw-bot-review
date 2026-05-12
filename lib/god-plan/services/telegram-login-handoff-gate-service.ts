export interface TelegramLoginHandoffGateSummary {
  status: 'blocked' | 'ready_for_user_manual_login' | 'session_reference_ready'
  localOnly: true
  userMustPerformLogin: true
  webLoginImplemented: false
  phoneOrCodeCollected: false
  rawSessionStored: false
  telegramApiCalled: false
  outboundSendAttempted: false
  sendAuthorized: false
  requiredBeforeLogin: string[]
  instructions: string[]
  summary: string
}

function envPresent(name: string) {
  const value = process.env[name]
  return typeof value === 'string' && value.trim().length > 0
}

function sessionRef() {
  const value = process.env.GOD_PLAN_TELEGRAM_SESSION_REF
  return typeof value === 'string' ? value.trim() : ''
}

function safeSessionReference(value: string) {
  return value.startsWith('local:') || value.startsWith('file:')
}

export function getTelegramLoginHandoffGateSummary(): TelegramLoginHandoffGateSummary {
  const apiId = envPresent('GOD_PLAN_TELEGRAM_API_ID')
  const apiHash = envPresent('GOD_PLAN_TELEGRAM_API_HASH')
  const sessionReference = sessionRef()
  const sessionReferenceReady = safeSessionReference(sessionReference)

  const requiredBeforeLogin = [
    !apiId ? 'Configure GOD_PLAN_TELEGRAM_API_ID outside the web UI.' : null,
    !apiHash ? 'Configure GOD_PLAN_TELEGRAM_API_HASH outside the web UI.' : null,
    !sessionReference ? 'Prepare GOD_PLAN_TELEGRAM_SESSION_REF as a non-secret local reference.' : null,
    sessionReference && !sessionReferenceReady ? 'Replace GOD_PLAN_TELEGRAM_SESSION_REF with local:<name> or file:<local-path-reference>; do not use raw session material.' : null,
  ].filter((item): item is string => Boolean(item))

  const status: TelegramLoginHandoffGateSummary['status'] = sessionReferenceReady
    ? 'session_reference_ready'
    : requiredBeforeLogin.length === 0
      ? 'ready_for_user_manual_login'
      : 'blocked'

  return {
    status,
    localOnly: true,
    userMustPerformLogin: true,
    webLoginImplemented: false,
    phoneOrCodeCollected: false,
    rawSessionStored: false,
    telegramApiCalled: false,
    outboundSendAttempted: false,
    sendAuthorized: false,
    requiredBeforeLogin,
    instructions: [
      'Use a trusted local device or future local CLI for Telegram login; do not use the web UI for phone numbers or login codes.',
      'Store any raw Telegram session material outside the repository, logs, UI, diagnostics, and artifacts.',
      'Expose only a non-secret GOD_PLAN_TELEGRAM_SESSION_REF such as local:<name> or file:<local-path-reference>.',
      'After login handoff, verify the handoff status and send authorization pages; login still does not authorize sending.',
    ],
    summary: status === 'session_reference_ready'
      ? 'A non-secret session reference is ready for local-only diagnostics. User login remains outside the web UI and sending remains unauthorized.'
      : status === 'ready_for_user_manual_login'
        ? 'Configuration presence is ready for a future user-controlled local login handoff design, but this app still does not implement login.'
        : 'Manual Telegram login handoff is blocked until required local-only configuration and safe session reference prerequisites are present.',
  }
}

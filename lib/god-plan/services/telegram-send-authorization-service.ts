export interface TelegramSendAuthorizationSummary {
  status: 'local_dry_run_only' | 'blocked' | 'requires_runtime_sender_design'
  localOnly: boolean
  productionSendEnabled: boolean
  loginDoesNotAuthorizeSend: true
  humanReviewRequired: true
  outboundGuardRequired: true
  senderLedgerRequired: true
  platformMessageIdRequired: true
  externalSentFinalizationAllowed: false
  telegramApiCalled: false
  outboundSendAttempted: false
  summary: string
  blockers: string[]
}

function envValue(name: string) {
  return process.env[name]
}

export function getTelegramSendAuthorizationSummary(): TelegramSendAuthorizationSummary {
  const mode = envValue('GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE') || 'local'
  const productionSendEnabled = envValue('GOD_PLAN_ENABLE_PRODUCTION_OUTBOUND_SEND') === 'true'
  const localOnly = mode === 'local'

  const blockers = [
    'Telegram account login does not authorize sending.',
    'Human review must approve final content before any future sender can run.',
    'Outbound guard must allow_send in a non-local environment.',
    'Sender ledger must record a successful sender attempt with platform response fingerprint.',
    'platform_message_id is required before externalSent finalization.',
    'Current web app has no Telegram sender runtime and must not call Telegram.',
  ]

  const status: TelegramSendAuthorizationSummary['status'] = localOnly
    ? 'local_dry_run_only'
    : productionSendEnabled
      ? 'requires_runtime_sender_design'
      : 'blocked'


  return {
    status,
    localOnly,
    productionSendEnabled,
    loginDoesNotAuthorizeSend: true,
    humanReviewRequired: true,
    outboundGuardRequired: true,
    senderLedgerRequired: true,
    platformMessageIdRequired: true,
    externalSentFinalizationAllowed: false,
    telegramApiCalled: false,
    outboundSendAttempted: false,
    summary: 'Send authorization remains separated from Telegram login readiness. This diagnostic never sends and never finalizes externalSent=true.',
    blockers,
  }
}

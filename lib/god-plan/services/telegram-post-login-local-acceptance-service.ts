export interface TelegramPostLoginLocalAcceptanceSummary {
  status: 'not_ready' | 'ready_for_user_check'
  localOnly: true
  telegramApiCalled: false
  outboundSendAttempted: false
  externalSentFinalized: false
  checks: {
    key: string
    label: string
    required: boolean
    summary: string
  }[]
  summary: string
}

export function getTelegramPostLoginLocalAcceptanceSummary(): TelegramPostLoginLocalAcceptanceSummary {
  return {
    status: 'ready_for_user_check',
    localOnly: true,
    telegramApiCalled: false,
    outboundSendAttempted: false,
    externalSentFinalized: false,
    checks: [
      {
        key: 'session_reference_visible',
        label: 'Non-secret session reference visible',
        required: true,
        summary: 'GOD_PLAN_TELEGRAM_SESSION_REF should contain only a local reference, not raw session material.',
      },
      {
        key: 'readiness_evidence_redacted',
        label: 'Readiness evidence remains redacted',
        required: true,
        summary: 'Evidence file and pages must show presence/status only, never API hash, login code, phone number, bot token, or raw session.',
      },
      {
        key: 'send_authorization_false',
        label: 'Send authorization remains false',
        required: true,
        summary: 'After login handoff, send authorization must still require human review, outbound guard, sender ledger, and platform_message_id.',
      },
      {
        key: 'no_external_sent_finalization',
        label: 'No externalSent finalization',
        required: true,
        summary: 'No local acceptance step may set externalSent=true or create platform send evidence.',
      },
    ],
    summary: 'Post-login local acceptance is a checklist only. It does not call Telegram, does not verify live account state, and does not authorize outbound sending.',
  }
}

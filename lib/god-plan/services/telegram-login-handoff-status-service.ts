import { telegramAccountReadinessService } from './telegram-account-readiness-service'
import { getTelegramLoginHandoffEvidenceSummary } from './telegram-login-handoff-evidence-service'

export interface TelegramLoginHandoffStatusSummary {
  status: 'blocked' | 'ready_for_local_handoff' | 'local_reference_present'
  localOnly: true
  accountReadinessStatus: string
  sessionReferenceFormat: string
  sessionReferenceSafe: boolean
  evidenceExists: boolean
  evidenceOk: boolean
  missingRequired: string[]
  rawCredentialStored: false
  rawSessionStored: false
  telegramApiCalled: false
  outboundSendAttempted: false
  externalSentFinalized: false
  summary: string
}

export function getTelegramLoginHandoffStatusSummary(): TelegramLoginHandoffStatusSummary {
  const readiness = telegramAccountReadinessService.getDiagnostics()
  const evidence = getTelegramLoginHandoffEvidenceSummary()
  const sessionReference = readiness.sessionReferenceReadiness

  const sessionReferenceSafe = sessionReference.safeForWebDiagnostics === true
  const evidenceOk = evidence.exists && !evidence.parseError && evidence.valueRedacted && evidence.localOnly
  const missingRequired = evidence.missingRequired

  const status: TelegramLoginHandoffStatusSummary['status'] = sessionReferenceSafe
    ? 'local_reference_present'
    : evidenceOk && missingRequired.length === 0
      ? 'ready_for_local_handoff'
      : 'blocked'

  return {
    status,
    localOnly: true,
    accountReadinessStatus: readiness.status,
    sessionReferenceFormat: sessionReference.format,
    sessionReferenceSafe,
    evidenceExists: evidence.exists,
    evidenceOk,
    missingRequired,
    rawCredentialStored: false,
    rawSessionStored: false,
    telegramApiCalled: false,
    outboundSendAttempted: false,
    externalSentFinalized: false,
    summary: status === 'local_reference_present'
      ? 'A non-secret local Telegram session reference is present. Login is still outside the web app and outbound send remains disabled.'
      : status === 'ready_for_local_handoff'
        ? 'Presence-only local evidence is complete enough to proceed with a separate trusted local handoff design. This does not implement login.'
        : 'Telegram login handoff is blocked until local preflight evidence and a safe non-secret session reference are ready.',
  }
}

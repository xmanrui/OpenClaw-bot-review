import { telegramAccountReadinessService } from './telegram-account-readiness-service'
import { getTelegramLoginHandoffStatusSummary } from './telegram-login-handoff-status-service'
import { getTelegramLoginHandoffGateSummary } from './telegram-login-handoff-gate-service'
import { getTelegramPostLoginLocalAcceptanceSummary } from './telegram-post-login-local-acceptance-service'
import { getTelegramSendAuthorizationSummary } from './telegram-send-authorization-service'

export interface TelegramAcquisitionLocalControlStep {
  key: string
  label: string
  href: string
  status: string
  summary: string
  readyForNextStep: boolean
}

export interface TelegramAcquisitionLocalControlSummary {
  status: 'local_setup_blocked' | 'handoff_ready_no_send' | 'session_reference_ready_no_send'
  localOnly: true
  dryRunOnly: true
  userLoginRequired: true
  webLoginImplemented: false
  telegramApiCalled: false
  outboundSendAttempted: false
  externalSentFinalized: false
  sendAuthorized: false
  completionEstimate: {
    localWorkbench: string
    productionTelegramRobot: string
    remainingBlockers: string[]
  }
  steps: TelegramAcquisitionLocalControlStep[]
  summary: string
}

export function getTelegramAcquisitionLocalControlSummary(): TelegramAcquisitionLocalControlSummary {
  const readiness = telegramAccountReadinessService.getDiagnostics()
  const handoffStatus = getTelegramLoginHandoffStatusSummary()
  const loginGate = getTelegramLoginHandoffGateSummary()
  const postLoginAcceptance = getTelegramPostLoginLocalAcceptanceSummary()
  const sendAuthorization = getTelegramSendAuthorizationSummary()

  const sessionReferenceReady = handoffStatus.status === 'local_reference_present' || loginGate.status === 'session_reference_ready'
  const handoffReady = sessionReferenceReady || handoffStatus.status === 'ready_for_local_handoff' || loginGate.status === 'ready_for_user_manual_login'

  const status: TelegramAcquisitionLocalControlSummary['status'] = sessionReferenceReady
    ? 'session_reference_ready_no_send'
    : handoffReady
      ? 'handoff_ready_no_send'
      : 'local_setup_blocked'

  return {
    status,
    localOnly: true,
    dryRunOnly: true,
    userLoginRequired: true,
    webLoginImplemented: false,
    telegramApiCalled: false,
    outboundSendAttempted: false,
    externalSentFinalized: false,
    sendAuthorized: false,
    completionEstimate: {
      localWorkbench: 'high: guarded dry-run workbench, diagnostics, handoff gates, and local acceptance are present',
      productionTelegramRobot: 'not complete: real Telegram connector, trusted local login CLI, sender runtime, durable production queue, vault, monitoring, and rollout gates remain outside this web app',
      remainingBlockers: [
        'User-controlled Telegram login must happen outside the web UI on a trusted local device or future local CLI.',
        'Only a non-secret session reference may enter diagnostics; raw session material must stay out of repo, logs, UI, and artifacts.',
        'Send authorization remains false until human review, outbound guard, sender ledger, platform_message_id, and platform response evidence all pass in a non-local sender design.',
        'No Telegram API call or outbound sender is implemented in the current local control surface.',
      ],
    },
    steps: [
      {
        key: 'account_readiness',
        label: 'Telegram account readiness',
        href: '/telegram-account-readiness',
        status: readiness.status,
        summary: readiness.summary,
        readyForNextStep: readiness.apiIdConfigured && readiness.apiHashConfigured,
      },
      {
        key: 'handoff_status',
        label: 'Login handoff status',
        href: '/telegram-login-handoff-status',
        status: handoffStatus.status,
        summary: handoffStatus.summary,
        readyForNextStep: handoffStatus.status !== 'blocked',
      },
      {
        key: 'login_gate',
        label: 'User manual login gate',
        href: '/telegram-login-handoff-gate',
        status: loginGate.status,
        summary: loginGate.summary,
        readyForNextStep: loginGate.status !== 'blocked',
      },
      {
        key: 'post_login_acceptance',
        label: 'Post-login local acceptance',
        href: '/telegram-post-login-local-acceptance',
        status: postLoginAcceptance.status,
        summary: postLoginAcceptance.summary,
        readyForNextStep: postLoginAcceptance.status === 'ready_for_user_check',
      },
      {
        key: 'send_authorization',
        label: 'Send authorization diagnostics',
        href: '/telegram-send-authorization',
        status: sendAuthorization.status,
        summary: sendAuthorization.summary,
        readyForNextStep: false,
      },
    ],
    summary: status === 'session_reference_ready_no_send'
      ? 'Local handoff diagnostics can see a safe session reference. Telegram sending is still unauthorized and unavailable.'
      : status === 'handoff_ready_no_send'
        ? 'Local handoff preparation is visible, but Telegram login still stays outside the web app and sending remains unauthorized.'
        : 'Local Telegram acquisition setup is still blocked by missing presence-only prerequisites. Continue with local readiness before any user login handoff.',
  }
}

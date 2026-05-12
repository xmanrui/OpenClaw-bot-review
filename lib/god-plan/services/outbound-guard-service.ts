import type { OutboundEnvironmentMode, OutboundGuardDiagnostics, OutboundGuardResult, OutboundGuardReason, ReviewActionType } from '@/lib/god-plan/types'

export interface OutboundGuardEvaluationInput {
  reviewId: string
  runtimeId: string
  actionType: ReviewActionType
  requestedMode?: 'dry_run' | 'staging' | 'production'
  humanReviewed: boolean
}

function readEnvironmentMode(): OutboundEnvironmentMode {
  const value = process.env.GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE
  if (value === 'staging' || value === 'production') return value
  return 'local'
}

function isSenderConfigured() {
  return process.env.GOD_PLAN_OUTBOUND_SENDER_CONFIGURED === 'true'
}

function isProductionSendEnabled() {
  return process.env.GOD_PLAN_ENABLE_PRODUCTION_OUTBOUND_SEND === 'true'
}

function buildNextActions(diagnostics: Pick<OutboundGuardDiagnostics, 'environmentMode' | 'senderConfigured' | 'productionOutboundEnabled' | 'externalSendPossible' | 'blockingReasons'>): OutboundGuardDiagnostics['nextActions'] {
  if (diagnostics.environmentMode === 'local') {
    return [
      {
        key: 'keep_local_dry_run_guard',
        label: 'Keep local dry-run guard',
        priority: 'low',
        summary: 'Local mode should keep externalSendAllowed=false and continue validating outbound jobs through dry-run smoke tests.',
      },
      {
        key: 'inspect_outbound_jobs_queue',
        label: 'Inspect outbound jobs queue',
        priority: 'medium',
        summary: 'Review guarded dry-run jobs before designing any staging sender integration.',
      },
    ]
  }

  if (!diagnostics.externalSendPossible) {
    return diagnostics.blockingReasons.map((reason) => ({
      key: `clear_${reason}`,
      label: `Clear ${reason}`,
      priority: 'high',
      summary: 'Resolve this outbound guard blocker before any non-local sender can be considered.',
    }))
  }

  return [
    {
      key: 'run_non_local_guarded_smoke',
      label: 'Run guarded non-local smoke',
      priority: 'medium',
      summary: 'Only proceed with a controlled guarded smoke after confirming sender configuration and production enablement policy.',
    },
  ]
}

export const outboundGuardService = {
  getDiagnostics(): OutboundGuardDiagnostics {
    const environmentMode = readEnvironmentMode()
    const senderConfigured = isSenderConfigured()
    const productionOutboundEnabled = isProductionSendEnabled()
    const defaultDecision = this.evaluate({
      reviewId: 'diagnostic_review',
      runtimeId: 'diagnostic_runtime',
      actionType: 'dm_suggest',
      requestedMode: 'dry_run',
      humanReviewed: false,
    })
    const blockingReasons = defaultDecision.blockingReasons
    const externalSendPossible = environmentMode !== 'local' && senderConfigured && (environmentMode !== 'production' || productionOutboundEnabled)
    const diagnostics: OutboundGuardDiagnostics = {
      environmentMode,
      senderConfigured,
      productionOutboundEnabled,
      externalSendPossible,
      defaultDecision,
      blockingReasons,
      safetySummary: externalSendPossible
        ? 'Outbound guard reports that non-local external send prerequisites are satisfied; sender execution still requires explicit implementation.'
        : 'Outbound guard does not permit external sending in the current environment; local work remains dry-run only.',
      nextActions: [],
    }
    diagnostics.nextActions = buildNextActions(diagnostics)
    return diagnostics
  },

  evaluate(input: OutboundGuardEvaluationInput): OutboundGuardResult {
    const environmentMode = readEnvironmentMode()
    const requestedMode = input.requestedMode ?? 'dry_run'
    const reasons: OutboundGuardReason[] = []
    const blockingReasons: OutboundGuardReason[] = []

    if (input.humanReviewed) reasons.push('human_review_approved')

    if (environmentMode === 'local') {
      reasons.push('local_mode_dry_run_only', 'external_send_guarded')
      if (requestedMode !== 'dry_run') blockingReasons.push('dry_run_mode_required')
      return {
        allowed: true,
        mode: 'dry_run',
        environmentMode,
        decision: 'allow_dry_run',
        externalSendAllowed: false,
        reasons,
        blockingReasons,
        summary: 'Local environment only permits guarded dry-run outbound jobs; no external sender may run.',
        evaluatedAt: new Date().toISOString(),
      }
    }

    if (!isSenderConfigured()) blockingReasons.push('sender_not_configured')
    if (environmentMode === 'production' && !isProductionSendEnabled()) blockingReasons.push('production_send_disabled')

    reasons.push('external_send_guarded')

    if (blockingReasons.length > 0) {
      return {
        allowed: false,
        mode: requestedMode,
        environmentMode,
        decision: 'block',
        externalSendAllowed: false,
        reasons,
        blockingReasons,
        summary: 'Outbound guard blocked external sending because required sender or production enablement checks are not satisfied.',
        evaluatedAt: new Date().toISOString(),
      }
    }

    return {
      allowed: true,
      mode: requestedMode,
      environmentMode,
      decision: requestedMode === 'dry_run' ? 'allow_dry_run' : 'allow_send',
      externalSendAllowed: requestedMode !== 'dry_run',
      reasons,
      blockingReasons,
      summary: requestedMode === 'dry_run'
        ? 'Dry-run outbound job is allowed; external send remains disabled.'
        : 'Outbound guard conditions are satisfied for a configured non-local sender.',
      evaluatedAt: new Date().toISOString(),
    }
  },
}

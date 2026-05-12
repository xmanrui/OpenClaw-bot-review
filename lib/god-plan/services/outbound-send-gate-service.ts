import type { OutboundJob } from '@/lib/god-plan/types'

export type OutboundSendGateDecision = 'dry_run_only' | 'blocked' | 'eligible_for_sender'
export type OutboundSendGateReason =
  | 'job_not_found'
  | 'job_already_terminal'
  | 'job_not_guarded'
  | 'local_mode_dry_run_only'
  | 'dry_run_job_only'
  | 'guard_not_allow_send'
  | 'guard_external_send_disabled'
  | 'missing_platform_message_id'
  | 'missing_sender_attempt_ref'
  | 'sender_success_required'
  | 'no_runtime_sender_implemented'

export interface OutboundSendGateInput {
  job?: OutboundJob | null
  hasRuntimeSenderImplementation?: boolean
  platformMessageId?: string | null
  senderAttemptRef?: string | null
  senderReportedSuccess?: boolean
}

export interface OutboundSendGateResult {
  decision: OutboundSendGateDecision
  allowedToMarkExternalSent: boolean
  dryRunOnly: boolean
  reasons: OutboundSendGateReason[]
  summary: string
  evaluatedAt: string
}

function uniqueReasons(reasons: OutboundSendGateReason[]) {
  return [...new Set(reasons)]
}

export const outboundSendGateService = {
  evaluate(input: OutboundSendGateInput): OutboundSendGateResult {
    const reasons: OutboundSendGateReason[] = []
    const job = input.job ?? null

    if (!job) {
      return {
        decision: 'blocked',
        allowedToMarkExternalSent: false,
        dryRunOnly: false,
        reasons: ['job_not_found'],
        summary: 'Outbound send gate blocked because the outbound job does not exist.',
        evaluatedAt: new Date().toISOString(),
      }
    }

    if (job.status === 'sent' || job.status === 'failed' || job.status === 'cancelled') {
      reasons.push('job_already_terminal')
    }

    if (job.status !== 'guarded') {
      reasons.push('job_not_guarded')
    }

    if (job.guardResult.environmentMode === 'local') {
      reasons.push('local_mode_dry_run_only')
    }

    if (job.mode === 'dry_run') {
      reasons.push('dry_run_job_only')
    }

    if (job.guardResult.decision !== 'allow_send') {
      reasons.push('guard_not_allow_send')
    }

    if (!job.guardResult.externalSendAllowed) {
      reasons.push('guard_external_send_disabled')
    }

    if (!input.hasRuntimeSenderImplementation) {
      reasons.push('no_runtime_sender_implemented')
    }

    if (!input.senderReportedSuccess) {
      reasons.push('sender_success_required')
    }

    if (!input.platformMessageId) {
      reasons.push('missing_platform_message_id')
    }

    if (!input.senderAttemptRef) {
      reasons.push('missing_sender_attempt_ref')
    }

    const normalizedReasons = uniqueReasons(reasons)
    const dryRunOnly = normalizedReasons.includes('local_mode_dry_run_only') || normalizedReasons.includes('dry_run_job_only')
    const allowedToMarkExternalSent = normalizedReasons.length === 0

    return {
      decision: allowedToMarkExternalSent ? 'eligible_for_sender' : dryRunOnly ? 'dry_run_only' : 'blocked',
      allowedToMarkExternalSent,
      dryRunOnly,
      reasons: normalizedReasons,
      summary: allowedToMarkExternalSent
        ? 'Outbound send gate conditions are satisfied for a future runtime sender-owned finalization step.'
        : dryRunOnly
          ? 'Outbound send gate keeps this job dry-run only; externalSent must remain false.'
          : 'Outbound send gate blocked external sent finalization until sender-owned success evidence is available.',
      evaluatedAt: new Date().toISOString(),
    }
  },
}

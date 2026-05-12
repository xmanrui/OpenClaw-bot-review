import { analyticsService } from '@/lib/god-plan/services/analytics-service'
import { outboundGuardService } from '@/lib/god-plan/services/outbound-guard-service'
import { outboundSendGateService } from '@/lib/god-plan/services/outbound-send-gate-service'
import { updateState } from '@/lib/god-plan/storage/db'
import type { DecisionItem, DraftItem, LeadDetailViewModel, LeadListItem, MessageContext, MessageEvent, OutboundJob, ReviewDetailViewModel, TraceEvent } from '@/lib/god-plan/types'

export interface FirstVersionLocalDryRunLoopInput {
  message: MessageEvent
  now?: string
  humanReviewer?: {
    actorId?: string | null
    actorName?: string | null
  }
}

export interface FirstVersionLocalDryRunLoopResult {
  mode: 'local_dry_run'
  externalNetworkUsed: false
  realTelegramSenderUsed: false
  message: MessageEvent
  context: MessageContext
  lead: LeadDetailViewModel
  decision: DecisionItem
  draft: DraftItem
  review: ReviewDetailViewModel
  trace: TraceEvent
  outboundJob: OutboundJob
  sendGate: ReturnType<typeof outboundSendGateService.evaluate>
  analytics: Awaited<ReturnType<typeof analyticsService.getSummary>>
}

function uniqueId(prefix: string, sourceId: string) {
  return `${prefix}_${sourceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function hasExplicitHumanReviewer(input: FirstVersionLocalDryRunLoopInput) {
  return Boolean(input.humanReviewer?.actorId || input.humanReviewer?.actorName)
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const withoutExisting = items.filter((existing) => existing.id !== item.id)
  return [...withoutExisting, item]
}

function upsertMessageContext(items: MessageContext[], item: MessageContext) {
  const withoutExisting = items.filter((existing) => existing.messageId !== item.messageId)
  return [...withoutExisting, item]
}

function buildLead(message: MessageEvent, now: string): LeadDetailViewModel {
  return {
    id: uniqueId('lead', message.senderId),
    runtimeId: message.runtimeId ?? 'runtime_unknown',
    displayName: message.senderName ?? message.senderUsername ?? message.senderId,
    summary: `Detected authorized visible group lead from ${message.groupId}: ${message.text.slice(0, 96)}`,
    stage: 'detected',
    riskLevel: 'medium',
    priority: 'high',
    ownerId: null,
    ownerName: null,
    lastInteractionSummary: message.text.slice(0, 120),
    updatedAt: now,
    suggestion: {
      action: 'dm_suggest',
      title: 'Prepare human-reviewed proposal draft',
      reason: 'Commercial intent and contact intent are present; first version must keep this human-reviewed and dry-run only.',
      requiresReview: true,
    },
    sourceGroupName: message.groupId,
    sourceAccountName: message.accountId ?? null,
    sourcePersonaName: null,
    nextActionSummary: 'Human reviewer can inspect a dry-run proposal; no real sender is allowed in local mode.',
    tags: ['first_version_loop', 'authorized_visible_group', 'dry_run_only'],
  }
}

export const firstVersionLoopService = {
  async runLocalDryRunLoop(input: FirstVersionLocalDryRunLoopInput): Promise<FirstVersionLocalDryRunLoopResult> {
    const now = input.now ?? new Date().toISOString()
    const humanReviewed = hasExplicitHumanReviewer(input)
    const message = { ...input.message, rawPayload: null }
    const lead = buildLead(message, now)
    const context: MessageContext = {
      messageId: message.id,
      groupId: message.groupId,
      runtimeId: message.runtimeId ?? 'runtime_unknown',
      intelligence: {
        intentLevel: 'high',
        intentScore: 92,
        riskScore: 35,
        temperature: 'hot',
        summary: 'Potential lead asked for a Telegram community lead-acquisition automation demo and pricing.',
        recommendedNextStep: 'Create a proposal draft for human review; keep outbound dry-run only.',
      },
      recentMessages: [
        {
          id: message.id,
          senderId: message.senderId,
          senderName: message.senderName ?? null,
          text: message.text,
          sentAt: message.sentAt,
        },
      ],
      topicSummary: 'Lead asked for a compliant Telegram acquisition automation demo and pricing.',
      candidateTargets: [
        {
          userId: message.senderId,
          userName: message.senderName ?? message.senderUsername ?? null,
          reason: 'Message contains need, commercial intent, pricing, and contact intent signals.',
        },
      ],
      recentLeadIds: [lead.id],
      recentRiskFlags: [],
    }
    const decision: DecisionItem = {
      id: uniqueId('decision', message.id),
      sourceMessageId: message.id,
      groupId: message.groupId,
      runtimeId: message.runtimeId ?? 'runtime_unknown',
      decision: 'dm_suggest',
      reason: 'High-intent lead should receive a human-reviewed proposal draft, not an automatic message.',
      confidence: 0.91,
      relatedSignals: message.signals ?? ['need', 'commercial_intent', 'contact_intent'],
      requiresReview: true,
      riskFlags: ['human_review_required', 'local_dry_run_only'],
      engine: {
        engineVersion: 'first-version-loop-v1',
        selectedRule: 'high_intent_human_review_dm_suggest',
        score: 91,
        reviewGate: 'human_review',
        rationale: ['High commercial intent', 'Contact/pricing signal', 'Local first version forbids automatic send'],
      },
      strategy: {
        engineVersion: 'first-version-loop-v1',
        matchedRuleIds: ['first_version_high_intent_human_review'],
        appliedRuleId: 'first_version_high_intent_human_review',
        appliedRuleName: 'First version high-intent human review',
        reviewGate: 'human_review',
        rationale: ['Generate draft only', 'Require human review', 'Outbound remains dry-run guarded'],
      },
      personaId: null,
      accountId: message.accountId ?? null,
      createdAt: now,
    }
    const draft: DraftItem = {
      id: uniqueId('draft', decision.id),
      decisionId: decision.id,
      sourceMessageId: message.id,
      runtimeId: message.runtimeId ?? 'runtime_unknown',
      draftType: 'dm_suggest',
      draftText: '可以，我可以先整理一个合规的 Telegram 群聊获客工作台 demo：只处理账号可见消息，先做人审和 dry-run，不做自动群发。你方便给我你的目标群类型和报价区间吗？',
      personaId: null,
      styleNotes: 'Concise, transparent, no spam claim, no pressure CTA.',
      riskNotes: 'Human review required; local mode dry-run only; do not send externally.',
      ctaType: 'soft_question',
      engine: {
        engineVersion: 'first-version-loop-v1',
        selectedTemplate: 'human_reviewed_dm_suggest_soft_question',
        tone: 'helpful_direct',
        ctaType: 'soft_question',
        rationale: ['Responds to requested demo/pricing', 'Avoids aggressive CTA', 'Keeps human review boundary'],
      },
      strategy: decision.strategy,
      alternatives: [],
      createdAt: now,
    }
    const review: ReviewDetailViewModel = {
      id: `review_${decision.id}`,
      runtimeId: message.runtimeId ?? 'runtime_unknown',
      leadId: lead.id,
      targetName: lead.displayName,
      actionType: 'dm_suggest',
      status: humanReviewed ? 'approved' : 'pending',
      riskLevel: 'medium',
      draftSummary: humanReviewed
        ? 'Human-approved dry-run proposal draft for a high-intent lead.'
        : 'Pending human review; dry-run proposal draft only.',
      submittedAt: now,
      draftText: draft.draftText,
      rewrittenDraftText: null,
      reviewComment: humanReviewed
        ? 'Approved for local dry-run outbound job only; no real sender.'
        : 'Awaiting human review; no real sender and no external send.',
      suggestion: lead.suggestion,
      accountId: message.accountId ?? null,
      accountName: null,
      personaId: null,
      personaName: null,
      styleNotes: draft.styleNotes,
    }
    const guardResult = outboundGuardService.evaluate({
      reviewId: review.id,
      runtimeId: review.runtimeId,
      actionType: review.actionType,
      requestedMode: 'dry_run',
      humanReviewed,
    })
    const outboundJob: OutboundJob = {
      id: uniqueId('outbound_job', review.id),
      reviewId: review.id,
      runtimeId: review.runtimeId,
      actionType: review.actionType,
      status: humanReviewed ? 'guarded' : 'blocked',
      mode: 'dry_run',
      accountId: review.accountId ?? null,
      personaId: review.personaId ?? null,
      targetName: review.targetName,
      finalActionText: review.rewrittenDraftText ?? review.draftText,
      externalSent: false,
      guardResult,
      createdAt: now,
      updatedAt: now,
    }
    const sendGate = outboundSendGateService.evaluate({ job: outboundJob })
    const trace: TraceEvent = {
      id: uniqueId('trace_action', review.id),
      type: 'action_executed',
      entityType: 'review_item',
      entityId: review.id,
      entityName: review.targetName,
      actorId: input.humanReviewer?.actorId ?? null,
      actorType: 'human',
      actorName: input.humanReviewer?.actorName ?? null,
      before: { status: 'pending', externalSent: false },
      after: { status: review.status, externalSent: false, outboundJobId: outboundJob.id, sendGateDecision: sendGate.decision },
      reason: humanReviewed
        ? 'First-version local loop records a reviewed dry-run trace only; no external send.'
        : 'First-version local loop records a pending human-review trace only; no external send.',
      summary: humanReviewed
        ? 'Human-reviewed draft was converted into a guarded dry-run outbound job; externalSent remains false.'
        : 'Draft remains pending human review; dry-run job stays blocked from execution and externalSent remains false.',
      happenedAt: now,
    }

    updateState((state) => {
      state.messageEvents = upsertById(state.messageEvents, message)
      state.messageContexts = upsertMessageContext(state.messageContexts, context)
      state.leads = upsertById(state.leads, lead as LeadListItem)
      state.leadDetails = upsertById(state.leadDetails, lead)
      state.decisions = upsertById(state.decisions, decision)
      state.drafts = upsertById(state.drafts, draft)
      state.reviews = upsertById(state.reviews, review)
      state.traces = upsertById(state.traces, trace)
      state.outboundJobs = upsertById(state.outboundJobs, outboundJob)
    })

    return {
      mode: 'local_dry_run',
      externalNetworkUsed: false,
      realTelegramSenderUsed: false,
      message,
      context,
      lead,
      decision,
      draft,
      review,
      trace,
      outboundJob,
      sendGate,
      analytics: await analyticsService.getSummary(),
    }
  },
}

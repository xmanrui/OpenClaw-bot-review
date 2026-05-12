import type { ReviewDecisionInput, ReviewDetailViewModel, ReviewStatus } from '@/lib/god-plan/types'
import { readState, updateState } from '@/lib/god-plan/storage/db'
import { traceRepository } from '@/lib/god-plan/repository/trace-repository'
import { outboundGuardService } from '@/lib/god-plan/services/outbound-guard-service'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function normalizeReviewStatus(status: unknown): ReviewStatus {
  const value = typeof status === 'string' ? status : ''
  switch (value) {
    case 'pending':
    case 'approved':
    case 'rejected':
    case 'rewritten_approved':
    case 'handoff':
    case 'done':
      return value
    default:
      return 'pending'
  }
}

function getReviewStore() {
  const state = readState()
  return {
    items: state.reviews,
    runtimes: state.runtimes,
    runtimeDetails: state.runtimeDetails,
  }
}

function shouldRecordExecution(status: ReviewDecisionInput['status']) {
  return status === 'approved' || status === 'rewritten_approved' || status === 'done'
}

function buildFinalActionText(review: ReviewDetailViewModel) {
  const rewritten = typeof review.rewrittenDraftText === 'string' ? review.rewrittenDraftText.trim() : ''
  return rewritten || review.draftText
}

export const reviewRepository = {
  async listReviewQueue() {
    return clone(getReviewStore().items.map((item) => ({
      ...item,
      status: normalizeReviewStatus(item.status),
    }))) as ReviewDetailViewModel[]
  },

  async getReviewById(id: string) {
    const item = getReviewStore().items.find((review) => review.id === id)
    if (!item) throw new Error('Review item not found: ' + id)
    return clone({
      ...item,
      status: normalizeReviewStatus(item.status),
    }) as ReviewDetailViewModel
  },

  async decideReview(id: string, input: ReviewDecisionInput) {
    let result: ReviewDetailViewModel | null = null

    updateState((state) => {
      const review = state.reviews.find((item) => item.id === id)
      if (!review) throw new Error('Review item not found: ' + id)

      const runtime = state.runtimes.find((item) => item.id === review.runtimeId)
      const runtimeDetail = state.runtimeDetails.find((item) => item.id === review.runtimeId)

      const reviewBefore = {
        status: review.status,
        reviewComment: review.reviewComment ?? null,
        rewrittenDraftText: review.rewrittenDraftText ?? null,
      }
      const runtimeBefore = {
        restrictionStatus: runtimeDetail?.restrictionStatus ?? runtime?.restrictionStatus ?? null,
        lastActionSummary: runtimeDetail?.lastActionSummary ?? null,
        currentContextSummary: runtimeDetail?.currentContextSummary ?? null,
      }

      review.status = input.status
      review.reviewComment = input.comment ?? review.reviewComment ?? null
      if (typeof input.rewrittenDraftText !== 'undefined') {
        review.rewrittenDraftText = input.rewrittenDraftText
      }

      const changedAt = new Date().toISOString()
      const nextRestriction = input.status === 'rejected' || input.status === 'handoff' ? 'human_handoff' : 'normal'

      if (runtime) {
        runtime.restrictionStatus = nextRestriction
        runtime.updatedAt = changedAt
      }

      if (runtimeDetail) {
        runtimeDetail.restrictionStatus = nextRestriction
        runtimeDetail.lastActionSummary = `review ${input.status}`
        runtimeDetail.currentContextSummary = input.comment ?? review.draftSummary ?? runtimeDetail.currentContextSummary
        runtimeDetail.updatedAt = changedAt
      }

      state.traces.unshift({
        id: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        happenedAt: changedAt,
        type: 'review_decided',
        entityType: 'review_item',
        entityId: review.id,
        entityName: review.targetName,
        actorId: input.actorId ?? 'human_reviewer',
        actorType: 'human',
        actorName: input.actorName ?? 'Reviewer',
        before: reviewBefore,
        after: {
          status: review.status,
          reviewComment: review.reviewComment ?? null,
          rewrittenDraftText: review.rewrittenDraftText ?? null,
        },
        reason: input.comment ?? null,
        summary: `审核项已${input.status}`,
      })

      state.traces.unshift({
        id: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        happenedAt: changedAt,
        type: 'runtime_restriction_changed',
        entityType: 'runtime',
        entityId: review.runtimeId,
        entityName: runtime?.name ?? runtimeDetail?.name ?? review.runtimeId,
        actorId: input.actorId ?? 'human_reviewer',
        actorType: 'human',
        actorName: input.actorName ?? 'Reviewer',
        before: runtimeBefore,
        after: {
          restrictionStatus: nextRestriction,
          lastActionSummary: runtimeDetail?.lastActionSummary ?? null,
          currentContextSummary: runtimeDetail?.currentContextSummary ?? null,
        },
        reason: `review ${input.status}`,
        summary: `runtime 已切换到 ${nextRestriction}`,
      })

      if (shouldRecordExecution(input.status)) {
        const finalActionText = buildFinalActionText(review)
        const executionSummary = input.status === 'rewritten_approved'
          ? '审核改写通过，已记录待执行动作（未外发）'
          : '审核通过，已记录待执行动作（未外发）'

        if (runtimeDetail) {
          runtimeDetail.lastActionSummary = executionSummary
          runtimeDetail.currentContextSummary = input.comment ?? finalActionText
          runtimeDetail.updatedAt = changedAt
        }

        if (runtime) {
          runtime.updatedAt = changedAt
        }

        const outboundJobId = `outbound_job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const guardResult = outboundGuardService.evaluate({
          reviewId: review.id,
          runtimeId: review.runtimeId,
          actionType: review.actionType,
          requestedMode: 'dry_run',
          humanReviewed: true,
        })

        state.outboundJobs.unshift({
          id: outboundJobId,
          reviewId: review.id,
          runtimeId: review.runtimeId,
          actionType: review.actionType,
          status: guardResult.decision === 'block' ? 'blocked' : 'guarded',
          mode: guardResult.mode,
          accountId: review.accountId ?? null,
          personaId: review.personaId ?? null,
          targetName: review.targetName,
          finalActionText,
          externalSent: false,
          guardResult,
          createdAt: changedAt,
          updatedAt: changedAt,
        })

        state.traces.unshift({
          id: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          happenedAt: changedAt,
          type: 'outbound_job_created',
          entityType: 'outbound_job',
          entityId: outboundJobId,
          entityName: review.targetName,
          actorId: input.actorId ?? 'human_reviewer',
          actorType: 'system',
          actorName: 'Outbound Guard',
          before: null,
          after: {
            reviewId: review.id,
            mode: 'dry_run',
            status: 'guarded',
            guardDecision: guardResult.decision,
            environmentMode: guardResult.environmentMode,
            externalSendAllowed: guardResult.externalSendAllowed,
            blockingReasons: guardResult.blockingReasons,
            externalSent: false,
          },
          reason: 'local dry-run outbound guard evaluation',
          summary: '已创建 dry-run outbound job，并通过本地外发守卫评估（未外发）',
        })

        state.traces.unshift({
          id: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          happenedAt: changedAt,
          type: 'action_executed',
          entityType: 'review_item',
          entityId: review.id,
          entityName: review.targetName,
          actorId: input.actorId ?? 'human_reviewer',
          actorType: 'human',
          actorName: input.actorName ?? 'Reviewer',
          before: {
            status: reviewBefore.status,
            externalSent: false,
          },
          after: {
            status: review.status,
            actionType: review.actionType,
            accountId: review.accountId ?? null,
            accountName: review.accountName ?? null,
            personaId: review.personaId ?? null,
            personaName: review.personaName ?? null,
            finalActionText,
            outboundJobId,
            outboundJobMode: guardResult.mode,
            outboundGuardDecision: guardResult.decision,
            outboundEnvironmentMode: guardResult.environmentMode,
            outboundGuardBlockingReasons: guardResult.blockingReasons,
            externalSendAllowed: guardResult.externalSendAllowed,
            externalSent: false,
          },
          reason: input.comment ?? `review ${input.status}`,
          summary: executionSummary,
        })
      }

      result = clone(review)
    })

    if (!result) throw new Error('Review item not found: ' + id)
    return result
  },

  async listReviewTrace(id: string) {
    return traceRepository.listTraceByEntity('review_item', id)
  },
}

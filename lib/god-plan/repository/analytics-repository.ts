import { readState } from '@/lib/god-plan/storage/db'
import { outboundGuardService } from '@/lib/god-plan/services/outbound-guard-service'
import { getStrategyRuleStore } from '@/lib/god-plan/seed-source'
import type { AnalyticsBreakdownItem, AnalyticsQualitySignalItem, AnalyticsRecentActivityItem, GodPlanAnalyticsSummary, StrategyRuleAnalyticsItem } from '@/lib/god-plan/types'

function ratio(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 1000) / 10
}

function countBy<T extends string>(values: T[], labels?: Partial<Record<T, string>>): AnalyticsBreakdownItem[] {
  const total = values.length
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([key, count]) => ({ key, label: labels?.[key] ?? key, count, ratio: ratio(count, total) }))
}

function funnelStep(key: string, label: string, count: number, previous: number, total: number) {
  return {
    key,
    label,
    count,
    ratioFromPrevious: previous > 0 ? ratio(count, previous) : null,
    ratioFromMessages: total > 0 ? ratio(count, total) : null,
  }
}

function actionPriorityForQualitySignal(severity: AnalyticsQualitySignalItem['severity'], count: number): AnalyticsQualitySignalItem['actionPriority'] {
  if (count <= 0 || severity === 'ok') return 'none'
  if (severity === 'critical') return 'high'
  if (severity === 'warning') return 'medium'
  return 'low'
}

function qualitySignal(
  key: string,
  label: string,
  count: number,
  severity: AnalyticsQualitySignalItem['severity'],
  summary: string,
  recommendedAction: string,
  href?: string | null,
): AnalyticsQualitySignalItem {
  return { key, label, count, severity, summary, recommendedAction, actionPriority: actionPriorityForQualitySignal(severity, count), href: href ?? null }
}

function rankReasonForStrategyRule(item: { isRecentlyMatched: boolean; lastMatchedAt?: string | null; priority: number }) {
  if (item.isRecentlyMatched && item.lastMatchedAt) return 'recent_match'
  if (item.isRecentlyMatched) return 'matched'
  return 'priority'
}

function followUpForStrategyRule(item: { matched: boolean; pendingExecutionCount: number; approvalRate: number; status: string }) {
  if (!item.matched && item.status === 'active') {
    return {
      recommendedFollowUp: 'Review matching conditions or wait for more inbound samples.',
      recommendedFollowUpHref: '/god-plan/analytics',
      recommendedFollowUpKind: 'analytics' as const,
      recommendedFollowUpLabel: 'Analytics review',
      needsAttention: true,
      attentionReason: 'active_rule_unmatched',
      attentionLabel: 'Watch rule',
      attentionCategory: 'monitor' as const,
      attentionCategoryLabel: 'Monitor',
      attentionCategorySummary: 'Monitor category means this active rule needs more inbound samples before tuning.',
      attentionCategoryAction: 'Collect more inbound samples or inspect matching conditions before changing priority.',
      attentionCategoryActionKind: 'inspect_samples' as const,
      attentionCategoryActionHref: '/god-plan/analytics',
      attentionCategoryActionPriority: 'medium' as const,
      attentionCategoryActionPriorityRank: 2,
      attentionCategoryActionPriorityReason: 'Medium priority because this active rule is unmatched and needs sample inspection before tuning.',
      attentionCategoryActionPriorityLabel: 'Medium priority',
      attentionCategoryActionBadge: 'warm' as const,
      attentionCategoryActionBadgeLabel: 'Warm',
      attentionCategoryActionBadgeSummary: 'Warm badge means the rule deserves monitoring before any review work is required.',
      attentionCategoryActionBadgeAriaLabel: 'Warm attention: monitor this rule before review work is required.',
      attentionCategoryActionBadgeIcon: 'pulse' as const,
      attentionCategoryActionDisplayGroup: 'monitoring' as const,
      attentionCategoryActionLabel: 'Inspect samples',
      attentionSummary: 'Active rule has not matched any current inbound decision samples.',
      attentionSeverity: 'info' as const,
    }
  }
  if (item.pendingExecutionCount > 0) {
    return {
      recommendedFollowUp: 'Inspect pending execution traces before any outbound action.',
      recommendedFollowUpHref: '/review',
      recommendedFollowUpKind: 'review' as const,
      recommendedFollowUpLabel: 'Review queue',
      needsAttention: true,
      attentionReason: 'pending_execution_trace',
      attentionLabel: 'Review pending trace',
      attentionCategory: 'review' as const,
      attentionCategoryLabel: 'Review',
      attentionCategorySummary: 'Review category means this rule has outcomes or traces that need human inspection.',
      attentionCategoryAction: 'Open the review queue and inspect pending execution traces before any outbound action.',
      attentionCategoryActionKind: 'review_queue' as const,
      attentionCategoryActionHref: '/review',
      attentionCategoryActionPriority: 'high' as const,
      attentionCategoryActionPriorityRank: 3,
      attentionCategoryActionPriorityReason: 'High priority because approved output is waiting as a pending execution trace and must stay human-reviewed before outbound action.',
      attentionCategoryActionPriorityLabel: 'High priority',
      attentionCategoryActionBadge: 'urgent' as const,
      attentionCategoryActionBadgeLabel: 'Urgent',
      attentionCategoryActionBadgeSummary: 'Urgent badge means human review should happen before any outbound action can be considered.',
      attentionCategoryActionBadgeAriaLabel: 'Urgent attention: human review should happen before any outbound action can be considered.',
      attentionCategoryActionBadgeIcon: 'alert' as const,
      attentionCategoryActionDisplayGroup: 'human_review' as const,
      attentionCategoryActionLabel: 'Review queue',
      attentionSummary: 'Rule has approved review output waiting as a pending execution trace.',
      attentionSeverity: 'warning' as const,
    }
  }
  if (item.matched && item.approvalRate <= 0) {
    return {
      recommendedFollowUp: 'Review rejected or pending decisions before scaling this rule.',
      recommendedFollowUpHref: '/review',
      recommendedFollowUpKind: 'review' as const,
      recommendedFollowUpLabel: 'Review queue',
      needsAttention: true,
      attentionReason: 'no_approved_reviews',
      attentionLabel: 'Review outcomes',
      attentionCategory: 'review' as const,
      attentionCategoryLabel: 'Review',
      attentionCategorySummary: 'Review category means this rule has outcomes or traces that need human inspection.',
      attentionCategoryAction: 'Open the review queue and compare rejected or pending outcomes before scaling this rule.',
      attentionCategoryActionKind: 'compare_outcomes' as const,
      attentionCategoryActionHref: '/review',
      attentionCategoryActionPriority: 'high' as const,
      attentionCategoryActionPriorityRank: 3,
      attentionCategoryActionPriorityReason: 'High priority because this rule has matched traffic but still needs outcome comparison before scaling.',
      attentionCategoryActionPriorityLabel: 'High priority',
      attentionCategoryActionBadge: 'urgent' as const,
      attentionCategoryActionBadgeLabel: 'Urgent',
      attentionCategoryActionBadgeSummary: 'Urgent badge means matched outcomes need human comparison before this rule is scaled.',
      attentionCategoryActionBadgeAriaLabel: 'Urgent attention: matched outcomes need human comparison before this rule is scaled.',
      attentionCategoryActionBadgeIcon: 'alert' as const,
      attentionCategoryActionDisplayGroup: 'human_review' as const,
      attentionCategoryActionLabel: 'Compare outcomes',
      attentionSummary: 'Rule matched traffic but has no approved review outcomes yet.',
      attentionSeverity: 'warning' as const,
    }
  }
  return {
    recommendedFollowUp: 'Keep observing this rule and compare future outcomes.',
    recommendedFollowUpHref: '/god-plan/analytics',
    recommendedFollowUpKind: 'observe' as const,
    recommendedFollowUpLabel: 'Observe',
    needsAttention: false,
    attentionReason: 'observe',
    attentionLabel: 'Clear',
    attentionCategory: 'clear' as const,
    attentionCategoryLabel: 'Clear',
    attentionCategorySummary: 'Clear category means no immediate rule attention is required.',
    attentionCategoryAction: 'Keep observing future outcomes; no immediate action is required.',
    attentionCategoryActionKind: 'observe' as const,
    attentionCategoryActionHref: '/god-plan/analytics',
    attentionCategoryActionPriority: 'low' as const,
    attentionCategoryActionPriorityRank: 1,
    attentionCategoryActionPriorityReason: 'Low priority because no immediate attention is required and future outcomes can be observed passively.',
    attentionCategoryActionPriorityLabel: 'Low priority',
    attentionCategoryActionBadge: 'calm' as const,
    attentionCategoryActionBadgeLabel: 'Calm',
    attentionCategoryActionBadgeSummary: 'Calm badge means no immediate intervention is needed and passive observation is enough.',
    attentionCategoryActionBadgeAriaLabel: 'Calm attention: no immediate intervention is needed and passive observation is enough.',
    attentionCategoryActionBadgeIcon: 'circle' as const,
    attentionCategoryActionDisplayGroup: 'passive' as const,
    attentionCategoryActionLabel: 'Observe',
    attentionSummary: 'No blocking follow-up is needed; keep observing future outcomes.',
    attentionSeverity: 'none' as const,
  }
}

function hrefForTrace(entityType: string, entityId: string) {
  if (entityType === 'review_item') return '/review'
  if (entityType === 'runtime') return '/runtime/' + encodeURIComponent(entityId)
  if (entityType === 'lead') return '/leads/' + encodeURIComponent(entityId)
  if (entityType === 'risk') return '/risk'
  return null
}

export const analyticsRepository = {
  async getSummary(): Promise<GodPlanAnalyticsSummary> {
    const state = readState()
    const actionTraces = state.traces.filter((trace) => trace.type === 'action_executed')
    const outboundJobs = state.outboundJobs ?? []
    const senderAttemptRecords = state.senderAttemptRecords ?? []
    const dryRunSenderAttemptRecords = senderAttemptRecords.filter((record) => record.dryRunOnly && record.externalSent === false)
    const rawPayloadStoredRecordCount = senderAttemptRecords.filter((record) => record.rawPayloadStored).length
    const externalSentSenderAttemptRecordCount = senderAttemptRecords.filter((record) => record.externalSent).length
    const dryRunOutboundJobs = outboundJobs.filter((job) => job.mode === 'dry_run')
    const guardedOutboundJobs = outboundJobs.filter((job) => job.status === 'guarded' && job.externalSent === false)
    const externalSentCount = actionTraces.filter((trace) => trace.after?.externalSent === true).length
    const approvedReviews = state.reviews.filter((review) => review.status === 'approved' || review.status === 'rewritten_approved' || review.status === 'done').length
    const rejectedReviews = state.reviews.filter((review) => review.status === 'rejected' || review.status === 'handoff').length
    const pendingReviews = state.reviews.filter((review) => review.status === 'pending').length
    const reviewedCount = approvedReviews + rejectedReviews

    const strategyCounts = new Map<string, StrategyRuleAnalyticsItem>()
    for (const decision of state.decisions) {
      const appliedRuleId = decision.strategy?.appliedRuleId
      if (!appliedRuleId) continue
      const current = strategyCounts.get(appliedRuleId)
      if (current) {
        current.count += 1
      } else {
        strategyCounts.set(appliedRuleId, {
          key: appliedRuleId,
          appliedRuleId,
          label: decision.strategy?.appliedRuleName ?? appliedRuleId,
          count: 1,
          ratio: null,
          reviewGate: decision.strategy?.reviewGate ?? null,
        })
      }
    }
    const strategyRules = [...strategyCounts.values()]
      .sort((a, b) => b.count - a.count || a.appliedRuleId.localeCompare(b.appliedRuleId))
      .map((item) => ({ ...item, ratio: ratio(item.count, Math.max(state.decisions.length, 1)) }))
    const reviewById = new Map(state.reviews.map((review) => [review.id, review]))
    const actionTraceReviewIds = new Set(actionTraces.map((trace) => trace.entityType === 'review_item' ? trace.entityId : null).filter((id): id is string => typeof id === 'string'))
    const decisionIdsByStrategyRule = new Map<string, Set<string>>()
    const lastMatchedAtByStrategyRule = new Map<string, string>()
    for (const decision of state.decisions) {
      const appliedRuleId = decision.strategy?.appliedRuleId
      if (!appliedRuleId) continue
      const ids = decisionIdsByStrategyRule.get(appliedRuleId) ?? new Set<string>()
      ids.add(decision.id)
      decisionIdsByStrategyRule.set(appliedRuleId, ids)
      const previous = lastMatchedAtByStrategyRule.get(appliedRuleId)
      if (!previous || new Date(decision.createdAt).getTime() > new Date(previous).getTime()) {
        lastMatchedAtByStrategyRule.set(appliedRuleId, decision.createdAt)
      }
    }
    const strategyRuleCatalog = getStrategyRuleStore()
      .map((rule) => {
        const hit = strategyCounts.get(rule.id)
        const hitCount = hit?.count ?? 0
        const decisionIds = decisionIdsByStrategyRule.get(rule.id) ?? new Set<string>()
        const relatedReviews = [...decisionIds]
          .map((decisionId) => reviewById.get(`review_${decisionId}`))
          .filter((review): review is NonNullable<typeof review> => Boolean(review))
        const reviewCount = relatedReviews.length
        const approvedReviewCount = relatedReviews.filter((review) => review.status === 'approved' || review.status === 'rewritten_approved' || review.status === 'done').length
        const pendingExecutionCount = relatedReviews.filter((review) => actionTraceReviewIds.has(review.id)).length
        return {
          id: rule.id,
          name: rule.name,
          status: rule.status,
          target: rule.target,
          priority: rule.priority,
          hitCount,
          hitRatio: ratio(hitCount, Math.max(state.decisions.length, 1)),
          reviewCount,
          approvedReviewCount,
          pendingExecutionCount,
          approvalRate: ratio(approvedReviewCount, Math.max(reviewCount, 1)),
          lastMatchedAt: lastMatchedAtByStrategyRule.get(rule.id) ?? null,
          isRecentlyMatched: Boolean(lastMatchedAtByStrategyRule.get(rule.id)),
          matched: hitCount > 0,
          reviewGate: rule.reviewGate ?? null,
          draftTemplateHint: rule.draftTemplateHint ?? null,
          rationale: rule.rationale,
        }
      })
      .sort((a, b) => {
        if (a.isRecentlyMatched !== b.isRecentlyMatched) return a.isRecentlyMatched ? -1 : 1
        const aLastMatchedAt = a.lastMatchedAt ? new Date(a.lastMatchedAt).getTime() : 0
        const bLastMatchedAt = b.lastMatchedAt ? new Date(b.lastMatchedAt).getTime() : 0
        if (aLastMatchedAt !== bLastMatchedAt) return bLastMatchedAt - aLastMatchedAt
        return b.priority - a.priority || a.id.localeCompare(b.id)
      })
      .map((item, index) => ({
        ...item,
        displayRank: index + 1,
        rankReason: rankReasonForStrategyRule(item),
        ...followUpForStrategyRule(item),
      }))

    const highIntentCount = state.messageContexts.filter((context) => context.intelligence?.intentLevel === 'high').length
    const hotLeadCount = state.messageContexts.filter((context) => context.intelligence?.temperature === 'hot').length
    const messageCount = state.messageEvents.length
    const decisionCount = state.decisions.length
    const draftCount = state.drafts.length
    const reviewCount = state.reviews.length
    const actionTraceCount = actionTraces.length
    const unknownRuntimeMessageCount = state.messageEvents.filter((message) => !message.runtimeId || message.runtimeId === 'runtime_unknown').length
    const unknownRuntimeDecisionCount = state.decisions.filter((decision) => !decision.runtimeId || decision.runtimeId === 'runtime_unknown').length
    const unknownRuntimeReviewCount = state.reviews.filter((review) => !review.runtimeId || review.runtimeId === 'runtime_unknown').length
    const unmatchedActiveStrategyRuleCount = strategyRuleCatalog.filter((rule) => rule.status === 'active' && !rule.matched).length
    const dataQuality = [
      qualitySignal(
        'runtime_unknown',
        'Runtime binding gaps',
        unknownRuntimeMessageCount + unknownRuntimeDecisionCount + unknownRuntimeReviewCount,
        unknownRuntimeMessageCount + unknownRuntimeDecisionCount + unknownRuntimeReviewCount > 0 ? 'warning' : 'ok',
        'Messages, decisions, or reviews that fell back to runtime_unknown and may need binding enrichment.',
        unknownRuntimeMessageCount + unknownRuntimeDecisionCount + unknownRuntimeReviewCount > 0
          ? 'Open runtime mappings and bind unknown messages, decisions, or reviews before accepting this dataset.'
          : 'No runtime binding action is needed for this dataset.',
        '/runtime',
      ),
      qualitySignal(
        'external_send_guard',
        'External send guard',
        externalSentCount,
        externalSentCount > 0 ? 'critical' : 'ok',
        'Approved actions should remain pending execution traces during the local smoke loop.',
        externalSentCount > 0
          ? 'Investigate external send records immediately and stop treating the local loop as guarded until resolved.'
          : 'Keep approved outputs as internal pending execution traces; do not enable real outbound send.',
        '/review',
      ),
      qualitySignal(
        'pending_review_backlog',
        'Pending review backlog',
        pendingReviews,
        pendingReviews > 0 ? 'info' : 'ok',
        'Review items waiting for human decision.',
        pendingReviews > 0
          ? 'Open the review queue and resolve pending items when you need a clean acceptance snapshot.'
          : 'No pending review cleanup is required.',
        '/review',
      ),
      qualitySignal(
        'sender_attempt_record_guard',
        'Sender attempt record guard',
        rawPayloadStoredRecordCount + externalSentSenderAttemptRecordCount,
        rawPayloadStoredRecordCount + externalSentSenderAttemptRecordCount > 0 ? 'critical' : 'ok',
        'Dry-run sender attempt records must not store raw platform payloads or mark external sends.',
        rawPayloadStoredRecordCount + externalSentSenderAttemptRecordCount > 0
          ? 'Investigate sender attempt records immediately and verify no raw platform payload or external-sent record was created outside a real sender finalization path.'
          : 'Sender attempt records remain dry-run evidence only, with no raw payload storage and no external-sent finalization.',
        '/outbound-jobs',
      ),
      qualitySignal(
        'unmatched_active_strategy_rules',
        'Unmatched active strategy rules',
        unmatchedActiveStrategyRuleCount,
        unmatchedActiveStrategyRuleCount > 0 ? 'info' : 'ok',
        'Active configured strategy rules that have not matched current stored decisions.',
        unmatchedActiveStrategyRuleCount > 0
          ? 'Inspect rule conditions or collect more inbound samples before tuning unmatched active rules.'
          : 'All active strategy rules have matching evidence in the current dataset.',
        '/god-plan/analytics',
      ),
    ]
    const activeQualitySignals = dataQuality.filter((signal) => signal.severity !== 'ok' && signal.count > 0)
    const blockingQualitySignals = activeQualitySignals.filter((signal) => signal.severity === 'critical' || signal.severity === 'warning')
    const criticalQualityCount = activeQualitySignals.filter((signal) => signal.severity === 'critical').length
    const warningQualityCount = activeQualitySignals.filter((signal) => signal.severity === 'warning').length
    const infoQualityCount = activeQualitySignals.filter((signal) => signal.severity === 'info').length
    const healthStatus = criticalQualityCount > 0 ? 'critical' : warningQualityCount > 0 ? 'warning' : 'ok'
    const healthSummary = criticalQualityCount > 0
      ? criticalQualityCount + ' critical quality signal(s) need immediate review.'
      : warningQualityCount > 0
        ? warningQualityCount + ' warning quality signal(s) need cleanup.'
        : infoQualityCount > 0
          ? infoQualityCount + ' informational signal(s) are available for follow-up.'
          : 'All analytics quality guards are clear.'

    const localTestingReadinessChecks = [
      {
        key: 'analytics_health_clear',
        label: 'Analytics health clear',
        passed: blockingQualitySignals.length === 0,
        summary: blockingQualitySignals.length === 0 ? 'No critical or warning quality signals are blocking local tests.' : 'Blocking quality signals must be cleared before local tests are accepted.',
        href: '/god-plan/analytics',
      },
      {
        key: 'external_send_guard_clear',
        label: 'External send guard clear',
        passed: externalSentCount === 0,
        summary: externalSentCount === 0 ? 'No real outbound sends were recorded; approved actions remain internal traces.' : 'External sends were recorded and must be investigated before local testing continues.',
        href: '/review',
      },
      {
        key: 'inbound_pipeline_has_data',
        label: 'Inbound pipeline has data',
        passed: messageCount > 0 && decisionCount > 0 && draftCount > 0,
        summary: messageCount > 0 && decisionCount > 0 && draftCount > 0 ? 'Messages, decisions, and drafts are present for local test review.' : 'Run the inbound smoke path before accepting local test readiness.',
        href: '/messages',
      },
      {
        key: 'human_review_path_visible',
        label: 'Human review path visible',
        passed: reviewCount > 0 && actionTraceCount - externalSentCount >= 0,
        summary: reviewCount > 0 ? 'Review queue data is present and can be inspected by a human tester.' : 'No review items are present yet; run a high-intent inbound test first.',
        href: '/review',
      },
    ]
    const localTestingReadinessBlockers = localTestingReadinessChecks.filter((check) => !check.passed).map((check) => check.key)
    const localTestingReadinessStatus = localTestingReadinessBlockers.length === 0 ? 'ready' : 'blocked'
    const localTestingReadinessNextActions = localTestingReadinessStatus === 'ready'
      ? [
          {
            key: 'continue_local_acceptance',
            label: 'Continue local acceptance',
            priority: 'low' as const,
            summary: 'Run the demo or another smoke pass when you need fresh acceptance evidence; outbound remains guarded.',
            href: '/god-plan/analytics',
          },
          {
            key: 'inspect_review_queue_before_send',
            label: 'Inspect review queue before any send',
            priority: 'medium' as const,
            summary: 'Use the review queue to inspect pending execution traces; do not treat approved traces as real sends.',
            href: '/review',
          },
        ]
      : localTestingReadinessChecks
          .filter((check) => !check.passed)
          .map((check) => ({
            key: 'clear_' + check.key,
            label: 'Clear ' + check.label,
            priority: 'high' as const,
            summary: check.summary,
            href: check.href ?? '/god-plan/analytics',
          }))

    const outboundGuardDiagnostics = outboundGuardService.getDiagnostics()
    const productionRobotReadinessChecks = [
      {
        key: 'non_local_environment_configured',
        label: 'Non-local environment configured',
        passed: outboundGuardDiagnostics.environmentMode !== 'local',
        requiredFor: 'staging' as const,
        category: 'environment' as const,
        priority: 'high' as const,
        summary: outboundGuardDiagnostics.environmentMode !== 'local'
          ? 'Outbound guard is running outside local mode and can be validated for staging prerequisites.'
          : 'Current environment is local; keep it dry-run and do not treat it as a production robot.',
        recommendedAction: outboundGuardDiagnostics.environmentMode !== 'local'
          ? 'Run staging-only guarded smoke before connecting any public traffic.'
          : 'Keep the current package local-only, then define a separate staging environment before sender work.',
        href: '/outbound-guard',
      },
      {
        key: 'sender_configured',
        label: 'Sender configured',
        passed: outboundGuardDiagnostics.senderConfigured,
        requiredFor: 'staging' as const,
        category: 'sender' as const,
        priority: 'high' as const,
        summary: outboundGuardDiagnostics.senderConfigured
          ? 'A non-local sender configuration is present for guarded validation.'
          : 'No real sender is configured; this prevents Telegram/public outbound execution.',
        recommendedAction: outboundGuardDiagnostics.senderConfigured
          ? 'Keep sender credentials scoped to staging until production rollout checks pass.'
          : 'Design sender credential storage, permission scope, and staging smoke before adding a sender implementation.',
        href: '/outbound-guard',
      },
      {
        key: 'production_send_explicitly_enabled',
        label: 'Production send explicitly enabled',
        passed: outboundGuardDiagnostics.environmentMode === 'production' && outboundGuardDiagnostics.productionOutboundEnabled,
        requiredFor: 'production' as const,
        category: 'safety' as const,
        priority: 'high' as const,
        summary: outboundGuardDiagnostics.productionOutboundEnabled
          ? 'Production outbound enablement flag is present; sender implementation still requires guarded rollout.'
          : 'Production outbound is not explicitly enabled, so the system must stay dry-run or blocked.',
        recommendedAction: 'Do not enable production outbound until staging sender, audit, rollback, rate limit, and monitoring checks are all green.',
        href: '/outbound-guard',
      },
      {
        key: 'external_send_guard_clear',
        label: 'External send guard clear',
        passed: externalSentCount === 0,
        requiredFor: 'production' as const,
        category: 'safety' as const,
        priority: externalSentCount === 0 ? 'medium' as const : 'high' as const,
        summary: externalSentCount === 0
          ? 'No external sends are recorded in the current dataset.'
          : 'External sends are present and must be audited before production readiness can be claimed.',
        recommendedAction: externalSentCount === 0
          ? 'Keep approval output as internal traces until an explicit production sender rollout is approved.'
          : 'Audit every external send and verify it was produced by an approved production sender path.',
        href: '/review',
      },
      {
        key: 'local_acceptance_green',
        label: 'Local acceptance green',
        passed: localTestingReadinessStatus === 'ready' && blockingQualitySignals.length === 0,
        requiredFor: 'staging' as const,
        category: 'acceptance' as const,
        priority: localTestingReadinessStatus === 'ready' ? 'low' as const : 'high' as const,
        summary: localTestingReadinessStatus === 'ready'
          ? 'Local smoke, review, analytics, and dry-run guard evidence are available.'
          : 'Local readiness blockers must be cleared before staging work.',
        recommendedAction: localTestingReadinessStatus === 'ready'
          ? 'Continue using local smoke as the baseline regression gate for each productionization step.'
          : 'Clear local testing readiness blockers before designing non-local sender validation.',
        href: '/god-plan/analytics',
      },
      {
        key: 'human_review_path_visible',
        label: 'Human review path visible',
        passed: reviewCount > 0,
        requiredFor: 'production' as const,
        category: 'review' as const,
        priority: reviewCount > 0 ? 'medium' as const : 'high' as const,
        summary: reviewCount > 0
          ? 'Human review queue evidence exists; outbound decisions remain inspectable.'
          : 'A production robot needs a visible human review path before any send path is considered.',
        recommendedAction: reviewCount > 0
          ? 'Keep human review as mandatory for outbound actions until production policy explicitly narrows it.'
          : 'Create and validate a review queue path before any sender integration work.',
        href: '/review',
      },
      {
        key: 'dry_run_outbound_jobs_visible',
        label: 'Dry-run outbound jobs visible',
        passed: dryRunOutboundJobs.length > 0 && guardedOutboundJobs.length > 0,
        requiredFor: 'staging' as const,
        category: 'outbound_jobs' as const,
        priority: dryRunOutboundJobs.length > 0 && guardedOutboundJobs.length > 0 ? 'medium' as const : 'high' as const,
        summary: dryRunOutboundJobs.length > 0 && guardedOutboundJobs.length > 0
          ? 'Guarded dry-run outbound jobs are visible for inspection.'
          : 'Run an approved review path to create guarded dry-run outbound job evidence.',
        recommendedAction: dryRunOutboundJobs.length > 0 && guardedOutboundJobs.length > 0
          ? 'Use the outbound job queue as the staging contract before adding real dispatch workers.'
          : 'Approve a local review item and confirm it produces only a guarded dry-run outbound job.',
        href: '/outbound-jobs',
      },
      {
        key: 'production_persistence_not_file_backed',
        label: 'Production persistence not file-backed',
        passed: false,
        requiredFor: 'scale' as const,
        category: 'persistence' as const,
        priority: 'high' as const,
        summary: 'Current persistence is local JSON file-backed; production needs a real database, migrations, locking, backups, and concurrent safety.',
        recommendedAction: 'Design the production database schema, migration path, row-level locking strategy, backup/restore plan, and seed migration before multi-user or multi-instance use.',
        href: '/god-plan/analytics',
      },
      {
        key: 'queue_retry_and_rollback_defined',
        label: 'Queue retry and rollback defined',
        passed: false,
        requiredFor: 'scale' as const,
        category: 'queue' as const,
        priority: 'high' as const,
        summary: 'A complete robot still needs durable queues, retry policy, rollback/cancel semantics, and audit retention for outbound jobs.',
        recommendedAction: 'Specify a durable outbound job lifecycle with pending/running/succeeded/failed/cancelled states, idempotency keys, retry limits, dead-letter handling, rollback, and audit retention.',
        href: '/outbound-jobs',
      },
      {
        key: 'rate_limit_and_account_risk_controls_defined',
        label: 'Rate limit and account risk controls defined',
        passed: false,
        requiredFor: 'scale' as const,
        category: 'account_risk' as const,
        priority: 'high' as const,
        summary: 'Multi-account scheduling, per-account rate limits, cooldowns, and account safety controls are not implemented yet.',
        recommendedAction: 'Define per-account quotas, cooldowns, warm-up limits, risk scoring, abuse detection, manual pause, and account rotation policy before any scaled outreach.',
        href: '/outbound-guard',
      },
    ]
    const productionRobotReadinessBlockers = productionRobotReadinessChecks.filter((check) => !check.passed).map((check) => check.key)
    const productionRobotReadinessStatus = productionRobotReadinessBlockers.includes('non_local_environment_configured')
      ? 'local_only' as const
      : productionRobotReadinessBlockers.length === 0
        ? 'ready_for_production' as const
        : productionRobotReadinessBlockers.every((key) => !['production_send_explicitly_enabled', 'production_persistence_not_file_backed', 'queue_retry_and_rollback_defined', 'rate_limit_and_account_risk_controls_defined'].includes(key))
          ? 'ready_for_staging' as const
          : 'blocked' as const
    const productionRobotReadinessNextActions = productionRobotReadinessStatus === 'local_only'
      ? [
          {
            key: 'keep_current_package_local_only',
            label: 'Keep current package local-only',
            priority: 'medium' as const,
            summary: 'Continue using the packaged site for local smoke, demo, and acceptance; do not enable Telegram/public outbound send here.',
            href: '/outbound-guard',
          },
          {
            key: 'design_staging_sender_plan',
            label: 'Design staging sender plan',
            priority: 'high' as const,
            summary: 'Before any real sender work, define staging sender credentials, rate limits, audit logs, rollback, and guarded smoke criteria.',
            href: '/outbound-jobs',
          },
        ]
      : productionRobotReadinessChecks
          .filter((check) => !check.passed)
          .slice(0, 4)
          .map((check) => ({
            key: 'clear_' + check.key,
            label: 'Clear ' + check.label,
            priority: check.requiredFor === 'scale' ? 'high' as const : 'medium' as const,
            summary: check.summary,
            href: check.href ?? '/god-plan/analytics',
          }))

    const funnel = [
      funnelStep('messages', 'Messages', messageCount, messageCount, messageCount),
      funnelStep('decisions', 'Decisions', decisionCount, messageCount, messageCount),
      funnelStep('drafts', 'Drafts', draftCount, decisionCount, messageCount),
      funnelStep('reviews', 'Reviews', reviewCount, draftCount, messageCount),
      funnelStep('approved_reviews', 'Approved reviews', approvedReviews, reviewCount, messageCount),
      funnelStep('pending_execution_traces', 'Pending execution traces', actionTraceCount - externalSentCount, approvedReviews, messageCount),
      funnelStep('dry_run_outbound_jobs', 'Dry-run outbound jobs', dryRunOutboundJobs.length, actionTraceCount - externalSentCount, messageCount),
    ]
    const recentActivity: AnalyticsRecentActivityItem[] = [
      ...state.messageEvents.map((message) => ({
        id: message.id,
        type: 'message',
        entityType: 'message',
        entityId: message.id,
        label: 'Inbound message',
        summary: message.text.slice(0, 80),
        happenedAt: message.sentAt,
        externalSent: null,
        href: '/messages?groupId=' + encodeURIComponent(message.groupId),
      })),
      ...state.reviews.map((review) => ({
        id: review.id,
        type: 'review',
        entityType: 'review_item',
        entityId: review.id,
        label: review.status === 'pending' ? 'Review pending' : 'Review ' + review.status,
        summary: review.draftSummary ?? review.draftText.slice(0, 80),
        happenedAt: review.submittedAt,
        externalSent: null,
        href: '/review',
      })),
      ...outboundJobs.map((job) => ({
        id: job.id,
        type: 'outbound_job',
        entityType: 'outbound_job',
        entityId: job.id,
        label: job.mode === 'dry_run' ? 'Dry-run outbound job' : 'Outbound job',
        summary: job.guardResult?.externalSendAllowed === false ? 'Guarded job remains internal; no external send allowed.' : job.finalActionText.slice(0, 80),
        happenedAt: job.createdAt,
        externalSent: job.externalSent,
        href: '/review',
      })),
      ...state.traces.map((trace) => ({
        id: trace.id,
        type: trace.type,
        entityType: trace.entityType,
        entityId: trace.entityId,
        label: trace.type === 'action_executed' ? 'Pending execution trace' : trace.type,
        summary: trace.summary ?? trace.reason ?? trace.entityName ?? trace.entityId,
        happenedAt: trace.happenedAt,
        externalSent: typeof trace.after?.externalSent === 'boolean' ? trace.after.externalSent : null,
        href: hrefForTrace(trace.entityType, trace.entityId),
      })),
    ]
      .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime())
      .slice(0, 8)

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        messages: state.messageEvents.length,
        decisions: state.decisions.length,
        drafts: state.drafts.length,
        reviews: state.reviews.length,
        risks: state.risks.length,
        leads: state.leads.length,
        actionTraces: actionTraces.length,
        outboundJobs: outboundJobs.length,
        senderAttemptRecords: senderAttemptRecords.length,
      },
      cards: [
        { key: 'high_intent_messages', label: 'High intent messages', value: highIntentCount, unit: 'items', hint: 'Message Intelligence contexts with high intent' },
        { key: 'hot_leads', label: 'Hot lead contexts', value: hotLeadCount, unit: 'items', hint: 'Message contexts with hot temperature' },
        { key: 'pending_reviews', label: 'Pending reviews', value: pendingReviews, unit: 'items', hint: 'Review items still pending' },
        { key: 'pending_executions', label: 'Pending execution traces', value: actionTraceCount - externalSentCount, unit: 'items', hint: 'Approved review traces recorded without external send' },
      ],
      funnel,
      intentDistribution: countBy(state.messageContexts.map((context) => context.intelligence?.intentLevel ?? 'none')),
      decisionDistribution: countBy(state.decisions.map((decision) => decision.decision)),
      leadStageDistribution: countBy(state.leads.map((lead) => lead.stage)),
      strategyRules,
      strategyRuleCatalog,
      recentActivity,
      dataQuality,
      localTestingReadiness: {
        status: localTestingReadinessStatus,
        label: localTestingReadinessStatus === 'ready' ? 'Ready for local testing' : 'Blocked for local testing',
        summary: localTestingReadinessStatus === 'ready'
          ? 'Local smoke/acceptance testing can proceed while outbound remains guarded.'
          : 'Clear failed readiness checks before treating the local test loop as accepted.',
        canRunLocalTests: localTestingReadinessStatus === 'ready',
        blockers: localTestingReadinessBlockers,
        checks: localTestingReadinessChecks,
        nextActions: localTestingReadinessNextActions,
      },
      productionRobotReadiness: {
        status: productionRobotReadinessStatus,
        label: productionRobotReadinessStatus === 'ready_for_production'
          ? 'Ready for production robot'
          : productionRobotReadinessStatus === 'ready_for_staging'
            ? 'Ready for staging robot validation'
            : productionRobotReadinessStatus === 'local_only'
              ? 'Local-only robot workbench'
              : 'Blocked for production robot',
        summary: productionRobotReadinessStatus === 'ready_for_production'
          ? 'Production robot prerequisites are clear; still require controlled rollout and monitoring.'
          : productionRobotReadinessStatus === 'ready_for_staging'
            ? 'Staging prerequisites are mostly clear; production send remains blocked until explicit production controls are complete.'
            : productionRobotReadinessStatus === 'local_only'
              ? 'Current system is a local guarded workbench with dry-run outbound jobs, not a production Telegram/public outbound robot.'
              : 'Clear production robot blockers before claiming complete intelligent lead-acquisition robot readiness.',
        canRunProductionRobot: productionRobotReadinessStatus === 'ready_for_production',
        blockers: productionRobotReadinessBlockers,
        checks: productionRobotReadinessChecks,
        nextActions: productionRobotReadinessNextActions,
      },
      health: {
        status: healthStatus,
        summary: healthSummary,
        criticalCount: criticalQualityCount,
        warningCount: warningQualityCount,
        infoCount: infoQualityCount,
        activeSignalCount: activeQualitySignals.length,
        hasBlockingSignals: blockingQualitySignals.length > 0,
        blockingSignalKeys: blockingQualitySignals.map((signal) => signal.key),
        activeSignalKeys: activeQualitySignals.map((signal) => signal.key),
      },
      review: {
        pending: pendingReviews,
        approved: approvedReviews,
        rejected: rejectedReviews,
        approvalRate: ratio(approvedReviews, reviewedCount),
      },
      safety: {
        externalSentCount,
        pendingExecutionCount: actionTraces.length - externalSentCount,
        outboundJobCount: outboundJobs.length,
        dryRunOutboundJobCount: dryRunOutboundJobs.length,
        guardedOutboundJobCount: guardedOutboundJobs.length,
      senderAttemptRecordCount: senderAttemptRecords.length,
      dryRunSenderAttemptRecordCount: dryRunSenderAttemptRecords.length,
      externalSentSenderAttemptRecordCount,
      rawPayloadStoredSenderAttemptRecordCount: rawPayloadStoredRecordCount,
      },
    }
  },
}

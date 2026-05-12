export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical'
export type RestrictionStatus = 'normal' | 'observing' | 'degraded' | 'silent' | 'under_review' | 'human_handoff'
export type RuntimeStage = 'entry' | 'presence_building' | 'light_interaction' | 'lead_observing' | 'lead_advancing' | 'cooling_maintenance' | 'silent_observing'
export type ReviewActionType = 'reply' | 'ask' | 'dm_suggest' | 'cta' | 'followup'
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'rewritten_approved' | 'handoff' | 'done'
export type RiskStatus = 'detected' | 'observing' | 'restricted' | 'under_review' | 'closed'
export type LeadStage = 'detected' | 'qualified' | 'nurtured' | 'suppressed' | 'lost' | 'converted'
export type TraceType = 'runtime_stage_changed' | 'runtime_restriction_changed' | 'runtime_context_updated' | 'review_submitted' | 'review_decided' | 'risk_triggered' | 'risk_status_changed' | 'lead_created' | 'lead_stage_changed' | 'lead_owner_changed' | 'action_executed' | 'outbound_job_created' | 'sender_attempt_recorded'

export type MessageType = 'text' | 'image' | 'reply' | 'forward' | 'system'
export type MessageSignal =
  | 'question'
  | 'need'
  | 'pain_point'
  | 'commercial_intent'
  | 'pricing'
  | 'comparison'
  | 'contact_intent'
  | 'negative_feedback'
  | 'risk_sensitive'
  | 'small_talk'

export type DecisionAction = 'observe' | 'reply' | 'ask' | 'skip' | 'dm_suggest' | 'escalate_to_human'
export type DraftType = 'reply' | 'ask' | 'dm_suggest'
export type StrategyRuleStatus = 'active' | 'paused'
export type StrategyRuleTarget = 'decision' | 'draft' | 'risk' | 'lead'

export interface StrategyRule {
  id: string
  name: string
  status: StrategyRuleStatus
  target: StrategyRuleTarget
  priority: number
  signalIncludes?: MessageSignal[]
  intentLevel?: MessageIntelligence['intentLevel'][]
  minIntentScore?: number
  maxRiskScore?: number
  decisionAction?: DecisionAction
  forceReview?: boolean
  reviewGate?: 'none' | 'human_review' | 'risk_review'
  draftTemplateHint?: string | null
  rationale: string
  createdAt: string
  updatedAt: string
}

export interface StrategyRuleEvaluation {
  engineVersion: string
  matchedRuleIds: string[]
  appliedRuleId?: string | null
  appliedRuleName?: string | null
  reviewGate: 'none' | 'human_review' | 'risk_review'
  rationale: string[]
}

export interface DecisionEngineEvaluation {
  engineVersion: string
  selectedRule: string
  score: number
  reviewGate: 'none' | 'human_review' | 'risk_review'
  rationale: string[]
}

export interface DraftEngineEvaluation {
  engineVersion: string
  selectedTemplate: string
  tone: string
  ctaType: string
  rationale: string[]
}

export interface MessageEvent {
  id: string
  groupId: string
  runtimeId?: string | null
  accountId?: string | null
  senderId: string
  senderName?: string | null
  senderUsername?: string | null
  text: string
  messageType: MessageType
  language?: string | null
  replyToMessageId?: string | null
  sentAt: string
  rawPayload?: Record<string, unknown> | null
  platformUpdateId?: string | null
  platformMessageId?: string | null
  signals?: MessageSignal[]
}

export interface MessageIntelligence {
  intentLevel: 'none' | 'low' | 'medium' | 'high'
  intentScore: number
  riskScore: number
  temperature: 'cold' | 'warm' | 'hot'
  summary: string
  recommendedNextStep: string
}

export interface MessageContext {
  messageId: string
  groupId: string
  runtimeId?: string | null
  intelligence?: MessageIntelligence | null
  recentMessages: {
    id: string
    senderId: string
    senderName?: string | null
    text: string
    sentAt: string
  }[]
  topicSummary?: string | null
  candidateTargets?: {
    userId: string
    userName?: string | null
    reason: string
  }[]
  recentLeadIds?: string[]
  recentRiskFlags?: string[]
}

export interface DecisionItem {
  id: string
  sourceMessageId: string
  groupId: string
  runtimeId?: string | null
  decision: DecisionAction
  reason: string
  confidence: number
  relatedSignals: MessageSignal[]
  requiresReview: boolean
  riskFlags: string[]
  engine?: DecisionEngineEvaluation | null
  strategy?: StrategyRuleEvaluation | null
  personaId?: string | null
  accountId?: string | null
  createdAt: string
}

export interface DraftItem {
  id: string
  decisionId: string
  sourceMessageId: string
  runtimeId?: string | null
  draftType: DraftType
  draftText: string
  personaId?: string | null
  styleNotes?: string | null
  riskNotes?: string | null
  ctaType?: string | null
  engine?: DraftEngineEvaluation | null
  strategy?: StrategyRuleEvaluation | null
  alternatives?: {
    label: string
    text: string
  }[]
  createdAt: string
}

export interface Suggestion {
  action: string
  title: string
  reason: string
  requiresReview?: boolean
}

export interface RuntimeListItem {
  id: string
  name: string
  groupId?: string | null
  groupName: string
  accountName: string
  personaName: string
  stage: RuntimeStage
  restrictionStatus: RestrictionStatus
  riskLevel: PriorityLevel
  suggestion?: Suggestion
  updatedAt: string
  ownerId?: string | null
}

export interface RuntimeDetailViewModel extends RuntimeListItem {
  groupId?: string | null
  familiarityScore?: number | null
  trustScore?: number | null
  exposureScore?: number | null
  currentTopicSummary?: string | null
  currentContextSummary?: string | null
  lastActionSummary?: string | null
  nextActionAt?: string | null
  relatedLeadIds?: string[]
}

export interface ReviewQueueListItem {
  id: string
  runtimeId: string
  leadId?: string | null
  targetName: string
  actionType: ReviewActionType
  status: ReviewStatus
  riskLevel: PriorityLevel
  draftSummary?: string | null
  submittedAt: string
}

export interface ReviewDetailViewModel extends ReviewQueueListItem {
  draftText: string
  rewrittenDraftText?: string | null
  reviewComment?: string | null
  suggestion?: Suggestion | null
  accountId?: string | null
  accountName?: string | null
  personaId?: string | null
  personaName?: string | null
  styleNotes?: string | null
}

export interface ReviewDecisionInput {
  status: Extract<ReviewStatus, 'approved' | 'rejected' | 'rewritten_approved' | 'handoff' | 'done'>
  comment?: string | null
  rewrittenDraftText?: string | null
  actorId?: string | null
  actorName?: string | null
}

export interface RiskQueueListItem {
  id: string
  type: string
  title: string
  summary: string
  targetType: string
  targetId: string
  targetName: string
  riskLevel: PriorityLevel
  status: RiskStatus
  currentRestriction?: string | null
  relatedRuntimeId?: string | null
  triggeredAt: string
}

export interface RiskActionInput {
  status: Extract<RiskStatus, 'observing' | 'restricted' | 'under_review' | 'closed'>
  restrictionStatus?: RestrictionStatus | null
  comment?: string | null
  actorId?: string | null
  actorName?: string | null
}

export interface LeadListItem {
  id: string
  runtimeId: string
  displayName: string
  summary: string
  stage: LeadStage
  riskLevel: PriorityLevel
  priority: PriorityLevel
  ownerId?: string | null
  ownerName?: string | null
  lastInteractionSummary?: string | null
  updatedAt: string
  suggestion?: Suggestion | null
}

export interface LeadDetailViewModel extends LeadListItem {
  sourceGroupName?: string | null
  sourceAccountName?: string | null
  sourcePersonaName?: string | null
  nextActionSummary?: string | null
  tags?: string[]
}

export interface LeadStageActionInput {
  stage: Extract<LeadStage, 'qualified' | 'nurtured' | 'suppressed' | 'lost' | 'converted'>
  comment?: string | null
  actorId?: string | null
  actorName?: string | null
}

export interface AnalyticsMetricCard {
  key: string
  label: string
  value: number
  unit?: string | null
  hint?: string | null
}

export interface AnalyticsBreakdownItem {
  key: string
  label: string
  count: number
  ratio?: number | null
}

export interface StrategyRuleAnalyticsItem extends AnalyticsBreakdownItem {
  appliedRuleId: string
  reviewGate?: 'none' | 'human_review' | 'risk_review' | null
}

export interface StrategyRuleCatalogAnalyticsItem {
  id: string
  name: string
  status: StrategyRuleStatus
  target: StrategyRuleTarget
  priority: number
  displayRank: number
  rankReason: string
  recommendedFollowUp: string
  recommendedFollowUpHref?: string | null
  recommendedFollowUpKind: 'observe' | 'review' | 'analytics'
  recommendedFollowUpLabel: string
  needsAttention: boolean
  attentionReason: string
  attentionLabel: string
  attentionCategory: 'monitor' | 'review' | 'clear'
  attentionCategoryLabel: string
  attentionCategorySummary: string
  attentionCategoryAction: string
  attentionCategoryActionKind: 'inspect_samples' | 'review_queue' | 'compare_outcomes' | 'observe'
  attentionCategoryActionHref: string
  attentionCategoryActionPriority: 'low' | 'medium' | 'high'
  attentionCategoryActionPriorityRank: number
  attentionCategoryActionPriorityReason: string
  attentionCategoryActionPriorityLabel: string
  attentionCategoryActionBadge: 'calm' | 'warm' | 'urgent'
  attentionCategoryActionBadgeLabel: string
  attentionCategoryActionBadgeSummary: string
  attentionCategoryActionBadgeAriaLabel: string
  attentionCategoryActionBadgeIcon: 'circle' | 'pulse' | 'alert'
  attentionCategoryActionDisplayGroup: 'monitoring' | 'human_review' | 'passive'
  attentionCategoryActionLabel: string
  attentionSummary: string
  attentionSeverity: 'none' | 'info' | 'warning'
  hitCount: number
  hitRatio: number
  reviewCount: number
  approvedReviewCount: number
  pendingExecutionCount: number
  approvalRate: number
  lastMatchedAt?: string | null
  isRecentlyMatched: boolean
  matched: boolean
  reviewGate?: 'none' | 'human_review' | 'risk_review' | null
  draftTemplateHint?: string | null
  rationale: string
}

export interface AnalyticsFunnelStep {
  key: string
  label: string
  count: number
  ratioFromPrevious: number | null
  ratioFromMessages: number | null
}

export interface AnalyticsRecentActivityItem {
  id: string
  type: string
  entityType: string
  entityId: string
  label: string
  summary: string
  happenedAt: string
  externalSent?: boolean | null
  href?: string | null
}

export interface AnalyticsQualitySignalItem {
  key: string
  label: string
  count: number
  severity: 'ok' | 'info' | 'warning' | 'critical'
  summary: string
  recommendedAction: string
  actionPriority: 'none' | 'low' | 'medium' | 'high'
  href?: string | null
}

export interface AnalyticsReadinessCheck {
  key: string
  label: string
  passed: boolean
  summary: string
  href?: string | null
}

export interface AnalyticsReadinessAction {
  key: string
  label: string
  priority: 'low' | 'medium' | 'high'
  summary: string
  href?: string | null
}

export interface ProductionRobotReadinessCheck {
  key: string
  label: string
  passed: boolean
  requiredFor: 'staging' | 'production' | 'scale'
  category: 'environment' | 'sender' | 'safety' | 'acceptance' | 'review' | 'outbound_jobs' | 'persistence' | 'queue' | 'account_risk'
  priority: 'low' | 'medium' | 'high'
  summary: string
  recommendedAction: string
  href?: string | null
}

export interface ProductionRobotReadinessAction {
  key: string
  label: string
  priority: 'low' | 'medium' | 'high'
  summary: string
  href?: string | null
}

export type OutboundEnvironmentMode = 'local' | 'staging' | 'production'
export type OutboundGuardReason =
  | 'human_review_approved'
  | 'local_mode_dry_run_only'
  | 'external_send_guarded'
  | 'dry_run_mode_required'
  | 'sender_not_configured'
  | 'production_send_disabled'

export interface OutboundGuardResult {
  allowed: boolean
  mode: 'dry_run' | 'staging' | 'production'
  environmentMode: OutboundEnvironmentMode
  decision: 'allow_dry_run' | 'allow_send' | 'block' | 'hold' | 'needs_review'
  externalSendAllowed: boolean
  reasons: OutboundGuardReason[]
  blockingReasons: OutboundGuardReason[]
  summary: string
  evaluatedAt: string
}

export interface OutboundGuardDiagnostics {
  environmentMode: OutboundEnvironmentMode
  senderConfigured: boolean
  productionOutboundEnabled: boolean
  externalSendPossible: boolean
  defaultDecision: OutboundGuardResult
  blockingReasons: OutboundGuardReason[]
  safetySummary: string
  nextActions: {
    key: string
    label: string
    priority: 'low' | 'medium' | 'high'
    summary: string
  }[]
}

export interface OutboundJob {
  id: string
  reviewId: string
  runtimeId: string
  actionType: ReviewActionType
  status: 'guarded' | 'blocked' | 'sent' | 'failed' | 'cancelled'
  mode: 'dry_run' | 'staging' | 'production'
  accountId?: string | null
  personaId?: string | null
  targetName: string
  finalActionText: string
  externalSent: boolean
  guardResult: OutboundGuardResult
  createdAt: string
  updatedAt: string
}


export interface SenderAttemptRecord {
  id: string
  outboundJobId: string
  reviewId: string
  runtimeId: string
  attemptedMode: 'dry_run' | 'staging' | 'production'
  decision: 'recordable_dry_run' | 'blocked' | 'recordable_sender_success'
  externalSent: boolean
  dryRunOnly: boolean
  platformMessageId?: string | null
  senderAttemptRef?: string | null
  platformResponseFingerprint?: string | null
  rawPayloadStored: false
  reasons: string[]
  summary: string
  createdAt: string
}

export interface GodPlanAnalyticsSummary {
  generatedAt: string
  totals: {
    messages: number
    decisions: number
    drafts: number
    reviews: number
    risks: number
    leads: number
    actionTraces: number
    outboundJobs: number
    senderAttemptRecords: number
  }
  cards: AnalyticsMetricCard[]
  funnel: AnalyticsFunnelStep[]
  intentDistribution: AnalyticsBreakdownItem[]
  decisionDistribution: AnalyticsBreakdownItem[]
  leadStageDistribution: AnalyticsBreakdownItem[]
  strategyRules: StrategyRuleAnalyticsItem[]
  strategyRuleCatalog: StrategyRuleCatalogAnalyticsItem[]
  recentActivity: AnalyticsRecentActivityItem[]
  dataQuality: AnalyticsQualitySignalItem[]
  localTestingReadiness: {
    status: 'ready' | 'blocked'
    label: string
    summary: string
    canRunLocalTests: boolean
    blockers: string[]
    checks: AnalyticsReadinessCheck[]
    nextActions: AnalyticsReadinessAction[]
  }
  productionRobotReadiness: {
    status: 'local_only' | 'blocked' | 'ready_for_staging' | 'ready_for_production'
    label: string
    summary: string
    canRunProductionRobot: boolean
    blockers: string[]
    checks: ProductionRobotReadinessCheck[]
    nextActions: ProductionRobotReadinessAction[]
  }
  health: {
    status: 'ok' | 'warning' | 'critical'
    summary: string
    criticalCount: number
    warningCount: number
    infoCount: number
    activeSignalCount: number
    hasBlockingSignals: boolean
    blockingSignalKeys: string[]
    activeSignalKeys: string[]
  }
  review: {
    pending: number
    approved: number
    rejected: number
    approvalRate: number
  }
  safety: {
    externalSentCount: number
    pendingExecutionCount: number
    outboundJobCount: number
    dryRunOutboundJobCount: number
    guardedOutboundJobCount: number
    senderAttemptRecordCount: number
    dryRunSenderAttemptRecordCount: number
    externalSentSenderAttemptRecordCount: number
    rawPayloadStoredSenderAttemptRecordCount: number
  }
}

export interface TraceEvent {
  id: string
  type: TraceType
  entityType: string
  entityId: string
  entityName?: string | null
  actorId?: string | null
  actorType?: 'system' | 'human' | null
  actorName?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  reason?: string | null
  summary?: string | null
  happenedAt: string
}

import type { GroupListQuery as GroupListQueryInput, GroupRecord } from '@/lib/god-plan/seed-source'
import type {
  DecisionAction,
  DecisionItem,
  DraftItem,
  DraftType,
  LeadDetailViewModel,
  LeadListItem,
  LeadStageActionInput,
  MessageContext,
  MessageEvent,
  MessageSignal,
  OutboundJob,
  ReviewDecisionInput,
  ReviewDetailViewModel,
  RiskActionInput,
  RiskQueueListItem,
  RuntimeDetailViewModel,
  RuntimeListItem,
  TraceEvent,
} from '@/lib/god-plan/types'

export type GroupDTO = GroupRecord
export type GroupListQuery = GroupListQueryInput
export type CreateGroupInput = Omit<GroupRecord, 'createdAt' | 'updatedAt'>
export type UpdateGroupInput = Partial<GroupRecord>
export type CreateGroupResult = GroupRecord
export type UpdateGroupResult = GroupRecord

export type RuntimeDetailDTO = RuntimeDetailViewModel
export type RuntimeListItemDTO = RuntimeListItem
export type RuntimeTraceItemDTO = TraceEvent
export interface UpdateRuntimeContextInput {
  currentContextSummary?: string | null
  lastActionSummary?: string | null
  updatedAt?: string
}

export type LeadDetailDTO = LeadDetailViewModel
export type LeadQueueItemDTO = LeadListItem
export type LeadTraceItemDTO = TraceEvent
export type ChangeLeadStageInput = LeadStageActionInput
export interface ChangeLeadStageResult {
  ok: true
  lead: LeadDetailDTO
  runtime: RuntimeDetailDTO
  traceItems: {
    lead: LeadTraceItemDTO[]
    runtime: RuntimeTraceItemDTO[]
  }
}

export type ReviewDetailDTO = ReviewDetailViewModel
export type ReviewQueueItemDTO = ReviewDetailViewModel
export type ReviewTraceItemDTO = TraceEvent
export type ReviewDecisionDTO = ReviewDecisionInput
export interface DecideReviewResult {
  ok: true
  review: ReviewDetailDTO
  runtime: RuntimeDetailDTO
  traceItems: {
    review: ReviewTraceItemDTO[]
    runtime: RuntimeTraceItemDTO[]
  }
}

export type RiskDetailDTO = RiskQueueListItem
export type RiskQueueItemDTO = RiskQueueListItem
export type RiskTraceItemDTO = TraceEvent
export type RiskActionDTO = RiskActionInput
export interface ApplyRiskActionResult {
  ok: true
  risk: RiskDetailDTO
  runtime: RuntimeDetailDTO | null
  traceItems: {
    risk: RiskTraceItemDTO[]
    runtime: RuntimeTraceItemDTO[]
  }
}

export type OutboundJobDTO = OutboundJob
export type TraceItemDTO = TraceEvent
export interface TraceAppendResult {
  ok: true
  item: TraceItemDTO
}

export type MessageEventDTO = MessageEvent
export type MessageContextDTO = MessageContext
export type DecisionItemDTO = DecisionItem
export type DraftItemDTO = DraftItem

export interface IngestMessageInput {
  groupId: string
  runtimeId?: string | null
  accountId?: string | null
  senderId: string
  senderName?: string | null
  senderUsername?: string | null
  text: string
  messageType?: 'text' | 'image' | 'reply' | 'forward' | 'system'
  language?: string | null
  replyToMessageId?: string | null
  rawPayload?: Record<string, unknown> | null
  platformUpdateId?: string | null
  platformMessageId?: string | null
  sentAt?: string
}

export interface BuildMessageContextInput {
  messageId: string
  recentLimit?: number
}

export interface CreateDecisionInput {
  sourceMessageId: string
  runtimeId?: string | null
  personaId?: string | null
  accountId?: string | null
}

export interface CreateDecisionResult {
  ok: true
  message: MessageEventDTO
  context: MessageContextDTO
  decision: DecisionItemDTO
}

export interface CreateDraftInput {
  decisionId: string
}

export interface CreateDraftResult {
  ok: true
  decision: DecisionItemDTO
  draft: DraftItemDTO | null
}

export interface ProcessMessageInput extends IngestMessageInput {
  personaId?: string | null
}

export interface ProcessMessageResult {
  ok: true
  message: MessageEventDTO
  context: MessageContextDTO
  decision: DecisionItemDTO
  draft: DraftItemDTO | null
  review: ReviewDetailDTO | null
  risk: RiskDetailDTO | null
  lead: LeadDetailDTO | null
  runtime: RuntimeDetailDTO | null
}

export interface CreateLeadFromMessageInput {
  sourceMessageId: string
  decisionId?: string | null
  targetUserId?: string | null
  targetUserName?: string | null
}

export interface LinkedUpdateResult {
  ok: true
  updatedAt: string
}

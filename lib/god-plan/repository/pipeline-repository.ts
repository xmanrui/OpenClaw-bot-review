import type {
  DecisionAction,
  DecisionEngineEvaluation,
  DecisionItem,
  DraftEngineEvaluation,
  DraftItem,
  DraftType,
  LeadDetailViewModel,
  MessageContext,
  MessageEvent,
  MessageIntelligence,
  MessageSignal,
  ReviewDetailViewModel,
  RiskQueueListItem,
  RuntimeDetailViewModel,
  StrategyRule,
  StrategyRuleEvaluation,
} from '@/lib/god-plan/types'
import { readState, updateState } from '@/lib/god-plan/storage/db'
import { traceRepository } from '@/lib/god-plan/repository/trace-repository'
import { getStrategyRuleStore } from '@/lib/god-plan/seed-source'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function pickSignals(text: string): MessageSignal[] {
  const source = text.toLowerCase()
  const hits = new Set<MessageSignal>()

  if (/\?|？|怎么|如何|请问|能不能|可以吗/.test(text)) hits.add('question')
  if (/需要|想要|求推荐|有没有|找|咨询|方案|需求/.test(text)) hits.add('need')
  if (/痛点|麻烦|难|难点|卡住|问题|困扰/.test(text)) hits.add('pain_point')
  if (/报价|价格|预算|多少钱|收费|套餐/.test(text)) hits.add('pricing')
  if (/对比|区别|哪个好|比较/.test(text)) hits.add('comparison')
  if (/私聊|加我|联系|vx|微信|telegram|tg|联系方式/.test(source)) hits.add('contact_intent')
  if (/买|下单|合作|成交|转化|客户|商机/.test(text)) hits.add('commercial_intent')
  if (/封号|风控|敏感|违规|举报|限制|导流|骗子|骗|忽悠|套路/.test(text)) hits.add('risk_sensitive')
  if (/哈哈|路过|围观|打卡|早上好|晚上好/.test(text)) hits.add('small_talk')
  if (/不行|差|垃圾|坑|失望|没用|骗子|骗人|忽悠/.test(text)) hits.add('negative_feedback')

  return Array.from(hits)
}

function getRuntimeLeadIds(runtimeId: string | null | undefined) {
  if (!runtimeId) return []
  const state = readState()
  return state.leads.filter((item) => item.runtimeId === runtimeId).map((item) => item.id)
}

function getRuntimeRiskFlags(runtimeId: string | null | undefined) {
  if (!runtimeId) return []
  const state = readState()
  return state.risks
    .filter((item) => item.relatedRuntimeId === runtimeId && item.status !== 'closed')
    .map((item) => item.type)
}

function buildTopicSummary(message: MessageEvent, signals: MessageSignal[]) {
  if (signals.includes('pricing')) return '用户正在询价或比较价格'
  if (signals.includes('commercial_intent')) return '用户表现出较强商业意图'
  if (signals.includes('need')) return '用户正在表达明确需求'
  if (signals.includes('risk_sensitive')) return '当前话题包含风险敏感信号'
  if (signals.includes('small_talk')) return '当前更偏轻量寒暄或围观'
  return message.text.slice(0, 60)
}

function buildMessageIntelligence(message: MessageEvent, signals: MessageSignal[]): MessageIntelligence {
  const signalSet = new Set(signals)
  const intentScore = Math.min(100,
    (signalSet.has('commercial_intent') ? 38 : 0) +
    (signalSet.has('pricing') ? 30 : 0) +
    (signalSet.has('need') ? 22 : 0) +
    (signalSet.has('question') ? 12 : 0) +
    (signalSet.has('comparison') ? 10 : 0) +
    (signalSet.has('pain_point') ? 14 : 0) +
    (signalSet.has('contact_intent') ? 18 : 0)
  )
  const riskScore = Math.min(100,
    (signalSet.has('risk_sensitive') ? 60 : 0) +
    (signalSet.has('contact_intent') ? 28 : 0) +
    (signalSet.has('negative_feedback') ? 38 : 0) +
    (message.text.length > 160 ? 8 : 0)
  )
  const intentLevel = intentScore >= 70 ? 'high' : intentScore >= 40 ? 'medium' : intentScore > 0 ? 'low' : 'none'
  const temperature = riskScore >= 60 ? 'warm' : intentScore >= 70 ? 'hot' : intentScore >= 35 ? 'warm' : 'cold'
  const recommendedNextStep = riskScore >= 60
    ? '进入人工审核，避免直接公开推进'
    : intentScore >= 70
      ? '生成私聊/转化建议并进入审核'
      : intentScore >= 35
        ? '生成澄清追问，继续确认需求'
        : '继续观察，等待更多上下文'

  return {
    intentLevel,
    intentScore,
    riskScore,
    temperature,
    summary: `${buildTopicSummary(message, signals)}；意图分 ${intentScore}，风险分 ${riskScore}`,
    recommendedNextStep,
  }
}

function normalizeToken(value: string | null | undefined) {
  return (value ?? '').toLowerCase().replace(/[\s_-]+/g, '')
}

function chooseAccountAndPersona(input: { runtimeId?: string | null; signals: MessageSignal[]; riskFlags?: string[] }) {
  const state = readState()
  const runtime = input.runtimeId ? state.runtimeDetails.find((item) => item.id === input.runtimeId) : null
  const runtimeAccountName = normalizeToken(runtime?.accountName)
  const runtimePersonaName = normalizeToken(runtime?.personaName)
  const accountCandidates = state.accounts.filter((account) =>
    account.platform === 'telegram' && account.status !== 'banned' && account.status !== 'frozen' && account.speakStatus !== 'banned' && account.speakStatus !== 'silent' && account.dailyQuota > account.usedQuota
  )
  const account = accountCandidates.find((item) => normalizeToken(item.name) === runtimeAccountName) ?? accountCandidates.find((item) => item.status === 'active' && item.riskLevel === 'low') ?? accountCandidates.sort((a, b) => b.healthScore - a.healthScore)[0] ?? state.accounts.find((item) => item.platform === 'telegram') ?? null
  const signalSet = new Set(input.signals)
  const hasCommercialIntent = signalSet.has('commercial_intent') || signalSet.has('pricing') || signalSet.has('contact_intent')
  const hasRisk = (input.riskFlags ?? []).length > 0 || signalSet.has('risk_sensitive')
  const persona = state.personas.find((item) => normalizeToken(item.name) === runtimePersonaName) ?? (hasCommercialIntent ? state.personas.find((item) => item.initiativeLevel === 'high' || item.trackFit.includes('growth')) : null) ?? (hasRisk ? state.personas.find((item) => item.initiativeLevel === 'low') : null) ?? state.personas[0] ?? null
  const notes = [
    account ? `账号：${account.name}（健康分 ${account.healthScore}，剩余额度 ${Math.max(0, account.dailyQuota - account.usedQuota)}/${account.dailyQuota}）` : '账号：未命中可用账号',
    persona ? `人设：${persona.name}（${persona.tone}，${persona.conversionStyle}）` : '人设：未命中可用人设',
  ]
  return { account, persona, notes }
}


function matchStrategyRule(rule: StrategyRule, input: { signals: MessageSignal[]; intelligence: MessageIntelligence | null; riskFlags: string[] }) {
  if (rule.status !== 'active') return false
  const signalSet = new Set(input.signals)
  const requiredSignals = rule.signalIncludes ?? []
  if (requiredSignals.some((signal) => !signalSet.has(signal))) return false
  if (rule.intentLevel && input.intelligence && !rule.intentLevel.includes(input.intelligence.intentLevel)) return false
  if (rule.intentLevel && !input.intelligence) return false
  if (typeof rule.minIntentScore === 'number' && (input.intelligence?.intentScore ?? 0) < rule.minIntentScore) return false
  if (typeof rule.maxRiskScore === 'number' && (input.intelligence?.riskScore ?? 0) > rule.maxRiskScore) return false
  if (rule.target === 'risk' && input.riskFlags.length === 0 && !requiredSignals.includes('risk_sensitive')) return false
  return true
}

function evaluateStrategyRules(input: { signals: MessageSignal[]; intelligence: MessageIntelligence | null; riskFlags: string[] }): StrategyRuleEvaluation {
  const state = readState()
  const rules = state.strategyRules.length > 0 ? state.strategyRules : getStrategyRuleStore()
  const matched = rules
    .filter((rule) => matchStrategyRule(rule, input))
    .sort((a, b) => b.priority - a.priority)
  const applied = matched[0] ?? null

  return {
    engineVersion: 'strategy-rules-v1',
    matchedRuleIds: matched.map((rule) => rule.id),
    appliedRuleId: applied?.id ?? null,
    appliedRuleName: applied?.name ?? null,
    reviewGate: applied?.reviewGate ?? 'none',
    rationale: applied ? [applied.rationale] : ['未命中策略规则，沿用基础决策引擎结果'],
  }
}

function decideAction(input: {
  message: MessageEvent
  context: MessageContext
  runtime: RuntimeDetailViewModel | null
  signals: MessageSignal[]
}) {
  const { context, runtime, signals } = input
  const intelligence = context.intelligence ?? null
  const riskFlags: string[] = []
  const restrictionFlags: string[] = []
  const rationale: string[] = []

  if (signals.includes('risk_sensitive')) riskFlags.push('risk_sensitive')
  if (signals.includes('contact_intent')) riskFlags.push('contact_intent')
  if (signals.includes('negative_feedback')) riskFlags.push('negative_feedback')
  if (runtime?.restrictionStatus && runtime.restrictionStatus !== 'normal') restrictionFlags.push(`runtime_${runtime.restrictionStatus}`)

  const hasDirectRisk = riskFlags.length > 0
  const hasCommercialIntent = signals.includes('commercial_intent') || signals.includes('pricing')
  const hasNeed = signals.includes('need')
  const hasQuestion = signals.includes('question')
  const intentScore = intelligence?.intentScore ?? 0
  const riskScore = intelligence?.riskScore ?? 0

  if (signals.length > 0) rationale.push(`命中信号：${signals.join(', ')}`)
  if (intelligence) rationale.push(`意图分 ${intentScore}，风险分 ${riskScore}，温度 ${intelligence.temperature}`)
  if (restrictionFlags.length > 0) rationale.push(`runtime 限制：${restrictionFlags.join(', ')}`)

  let decision: DecisionAction = 'observe'
  let reason = '决策引擎：默认观察，等待更多上下文'
  let confidence = 0.42
  let requiresReview = false
  let selectedRule = 'observe_default'

  if (hasDirectRisk || riskScore >= 60) {
    decision = 'escalate_to_human'
    reason = '决策引擎：风险优先，消息命中风险信号或风险分达到阈值，进入人工审核/风控'
    confidence = 0.92
    requiresReview = true
    selectedRule = 'risk_first_human_handoff'
  } else if (hasCommercialIntent || intentScore >= 70) {
    decision = 'dm_suggest'
    reason = restrictionFlags.length > 0
      ? '决策引擎：高意图但 runtime 受限，生成私聊建议并先进入审核队列'
      : '决策引擎：高意图商业机会，生成私聊或转化建议'
    confidence = restrictionFlags.length > 0 ? 0.78 : Math.max(0.86, Math.min(0.94, intentScore / 100))
    requiresReview = true
    selectedRule = 'high_intent_dm_suggest'
  } else if (hasNeed || intentScore >= 40) {
    decision = 'ask'
    reason = restrictionFlags.length > 0
      ? '决策引擎：用户表达需求但 runtime 受限，建议先审核后追问'
      : '决策引擎：中等意图或明确需求，先追问澄清'
    confidence = restrictionFlags.length > 0 ? 0.72 : 0.8
    requiresReview = true
    selectedRule = 'need_clarification_ask'
  } else if (hasQuestion) {
    decision = 'reply'
    reason = restrictionFlags.length > 0
      ? '决策引擎：用户明确提问但 runtime 受限，建议先审核后回复'
      : '决策引擎：用户明确提问，生成公开回复草稿'
    confidence = restrictionFlags.length > 0 ? 0.66 : 0.72
    requiresReview = true
    selectedRule = 'question_public_reply'
  } else if (signals.includes('small_talk')) {
    decision = 'observe'
    reason = restrictionFlags.length > 0
      ? '决策引擎：闲聊消息且 runtime 受限，继续观察'
      : '决策引擎：闲聊或围观消息，暂不主动介入'
    confidence = restrictionFlags.length > 0 ? 0.72 : 0.67
    selectedRule = 'small_talk_observe'
  }

  const directRiskFlags = [...riskFlags, ...restrictionFlags]
  const strategy = evaluateStrategyRules({ signals, intelligence, riskFlags: directRiskFlags })
  const engine: DecisionEngineEvaluation = {
    engineVersion: 'decision-engine-v1',
    selectedRule,
    score: Math.max(intentScore, riskScore),
    reviewGate: strategy.reviewGate !== 'none' ? strategy.reviewGate : hasDirectRisk || riskScore >= 60 ? 'risk_review' : requiresReview ? 'human_review' : 'none',
    rationale: rationale.length > 0 ? rationale : ['未命中强信号，保持观察'],
  }

  const strategyRationale = strategy.appliedRuleName ? `策略规则：${strategy.appliedRuleName}` : null

  return {
    decision,
    reason: strategyRationale ? `${reason}；${strategyRationale}` : reason,
    confidence,
    requiresReview: requiresReview || strategy.reviewGate !== 'none',
    riskFlags: directRiskFlags,
    engine,
    strategy,
  }
}

function resolveExplicitAccountId(accountId: string | null | undefined) {
  if (!accountId) return null
  const state = readState()
  return state.accounts.some((item) => item.id === accountId) ? accountId : null
}

function buildDraftPlan(decision: DecisionItem, message: MessageEvent): {
  draftText: string
  ctaType: string
  alternatives: { label: string; text: string }[]
  engine: DraftEngineEvaluation
} {
  const signals = new Set(decision.relatedSignals)
  const excerpt = message.text.slice(0, 36)
  const rationale = [
    `承接决策：${decision.decision}`,
    `命中信号：${decision.relatedSignals.length > 0 ? decision.relatedSignals.join(', ') : 'none'}`,
  ]

  if (decision.engine?.selectedRule) {
    rationale.push(`决策规则：${decision.engine.selectedRule}`)
  }

  if (signals.has('pricing')) {
    rationale.push('用户提到价格，草稿需要降低推销感并引导私聊承接')
  }

  switch (decision.decision) {
    case 'ask':
      return {
        draftText: `看到你提到“${excerpt}”，方便再补充一下你现在最想解决的具体场景、预算范围和时间要求吗？`,
        ctaType: 'clarify_need',
        alternatives: [
          { label: '追问痛点', text: '如果方便的话，可以补充一下你现在最卡的具体环节。' },
          { label: '追问预算', text: '你这边更关注预算、落地周期，还是最终转化效果？' },
        ],
        engine: {
          engineVersion: 'draft-engine-v1',
          selectedTemplate: 'clarify_need_question',
          tone: '克制追问',
          ctaType: 'clarify_need',
          rationale,
        },
      }
    case 'reply':
      return {
        draftText: `这个问题可以先从你的当前场景入手看。你可以简单说一下目标、已有资源和限制条件，我再给你一个更贴近实际的判断。`,
        ctaType: 'public_reply',
        alternatives: [
          { label: '短回复', text: '可以，先看你的目标和限制，再判断哪种方案更合适。' },
        ],
        engine: {
          engineVersion: 'draft-engine-v1',
          selectedTemplate: 'public_contextual_reply',
          tone: '公开克制回复',
          ctaType: 'public_reply',
          rationale,
        },
      }
    case 'dm_suggest':
      return {
        draftText: `你这个问题已经比较接近具体需求了。收费一般要看目标、现有资源和预期周期；如果你愿意，我可以先按你的情况整理一个更聚焦的建议，私聊会更高效。`,
        ctaType: 'private_followup',
        alternatives: [
          { label: '更克制', text: '这个要看具体目标和现有资源，方便的话可以私聊，我先帮你拆一下判断口径。' },
          { label: '更直接', text: '如果你已经在评估合作，可以私聊我你的目标和预算，我给你一个更明确的建议。' },
        ],
        engine: {
          engineVersion: 'draft-engine-v1',
          selectedTemplate: 'high_intent_private_followup',
          tone: '低压转私聊',
          ctaType: 'private_followup',
          rationale,
        },
      }
    default:
      return {
        draftText: '',
        ctaType: 'none',
        alternatives: [],
        engine: {
          engineVersion: 'draft-engine-v1',
          selectedTemplate: 'empty',
          tone: 'none',
          ctaType: 'none',
          rationale,
        },
      }
  }
}

function upsertReviewFromDecision(decision: DecisionItem, draft: DraftItem | null, message: MessageEvent) {
  let created: ReviewDetailViewModel | null = null

  updateState((state) => {
    if (!decision.requiresReview) return
    if (!draft) return
    const existing = state.reviews.find((item) => item.id === `review_${decision.id}`)
    if (existing) {
      created = clone(existing)
      return
    }

    const runtime = decision.runtimeId ? state.runtimes.find((item) => item.id === decision.runtimeId) : null
    const account = decision.accountId ? state.accounts.find((item) => item.id === decision.accountId) : null
    const persona = draft.personaId ? state.personas.find((item) => item.id === draft.personaId) : null
    const review: ReviewDetailViewModel = {
      id: `review_${decision.id}`,
      runtimeId: decision.runtimeId ?? 'runtime_unknown',
      leadId: null,
      targetName: message.senderName ?? message.senderId,
      actionType: draft.draftType,
      status: 'pending',
      riskLevel: decision.riskFlags.length > 0 ? 'high' : decision.decision === 'dm_suggest' ? 'high' : 'medium',
      draftSummary: decision.reason,
      submittedAt: decision.createdAt,
      draftText: draft.draftText,
      rewrittenDraftText: null,
      reviewComment: null,
      accountId: decision.accountId ?? null,
      accountName: account?.name ?? null,
      personaId: draft.personaId ?? decision.personaId ?? null,
      personaName: persona?.name ?? null,
      styleNotes: draft.styleNotes ?? null,
      suggestion: {
        action: decision.decision,
        title: '消息前置链路生成候选动作',
        reason: decision.reason,
        requiresReview: true,
      },
    }
    state.reviews.unshift(review)
    state.traces.unshift({
      id: createId('trace'),
      happenedAt: decision.createdAt,
      type: 'review_submitted',
      entityType: 'review_item',
      entityId: review.id,
      entityName: review.targetName,
      actorId: 'message_pipeline',
      actorType: 'system',
      actorName: 'Message Pipeline',
      before: null,
      after: { status: review.status, actionType: review.actionType },
      reason: decision.reason,
      summary: '消息已生成审核项',
    })
    if (runtime) runtime.updatedAt = decision.createdAt
    created = clone(review)
  })

  return created
}

function upsertRiskFromDecision(decision: DecisionItem, message: MessageEvent) {
  let created: RiskQueueListItem | null = null

  updateState((state) => {
    const directRiskFlags = decision.riskFlags.filter((flag) => !flag.startsWith('runtime_'))
    if (directRiskFlags.length === 0) return
    const existing = state.risks.find((item) => item.id === `risk_${decision.id}`)
    if (existing) {
      created = clone(existing)
      return
    }

    const risk: RiskQueueListItem = {
      id: `risk_${decision.id}`,
      type: directRiskFlags[0] ?? 'risk_sensitive',
      title: '消息命中风险前置信号',
      summary: decision.reason,
      targetType: 'message_event',
      targetId: message.id,
      targetName: message.senderName ?? message.senderId,
      riskLevel: 'high',
      status: 'detected',
      currentRestriction: decision.runtimeId ? 'under_review' : null,
      relatedRuntimeId: decision.runtimeId ?? null,
      triggeredAt: decision.createdAt,
    }
    state.risks.unshift(risk)
    state.traces.unshift({
      id: createId('trace'),
      happenedAt: decision.createdAt,
      type: 'risk_triggered',
      entityType: 'risk_event',
      entityId: risk.id,
      entityName: risk.title,
      actorId: 'message_pipeline',
      actorType: 'system',
      actorName: 'Message Pipeline',
      before: null,
      after: { status: risk.status, currentRestriction: risk.currentRestriction },
      reason: decision.reason,
      summary: '消息已触发风控项',
    })

    if (decision.runtimeId) {
      const runtime = state.runtimes.find((item) => item.id === decision.runtimeId)
      const detail = state.runtimeDetails.find((item) => item.id === decision.runtimeId)
      if (runtime) {
        runtime.restrictionStatus = 'under_review'
        runtime.updatedAt = decision.createdAt
      }
      if (detail) {
        detail.restrictionStatus = 'under_review'
        detail.lastActionSummary = 'risk detected from message'
        detail.currentContextSummary = message.text.slice(0, 120)
        detail.updatedAt = decision.createdAt
      }
    }

    created = clone(risk)
  })

  return created
}

function upsertLeadFromDecision(decision: DecisionItem, message: MessageEvent) {
  let created: LeadDetailViewModel | null = null

  updateState((state) => {
    const shouldCreate = decision.decision === 'dm_suggest' || decision.relatedSignals.includes('commercial_intent') || decision.relatedSignals.includes('pricing')
    if (!shouldCreate || !decision.runtimeId) return

    const existingList = state.leads.find((item) => item.runtimeId === decision.runtimeId && item.displayName === (message.senderName ?? message.senderId))
    const existingDetail = existingList ? state.leadDetails.find((item) => item.id === existingList.id) : null
    const changedAt = decision.createdAt

    if (existingList && existingDetail) {
      existingList.stage = 'qualified'
      existingList.updatedAt = changedAt
      existingList.lastInteractionSummary = decision.reason
      existingDetail.stage = 'qualified'
      existingDetail.updatedAt = changedAt
      existingDetail.lastInteractionSummary = decision.reason
      existingDetail.nextActionSummary = '继续跟进该对象的需求细节'
      state.traces.unshift({
        id: createId('trace'),
        happenedAt: changedAt,
        type: 'lead_stage_changed',
        entityType: 'lead',
        entityId: existingDetail.id,
        entityName: existingDetail.displayName,
        actorId: 'message_pipeline',
        actorType: 'system',
        actorName: 'Message Pipeline',
        before: { stage: 'detected' },
        after: { stage: 'qualified' },
        reason: decision.reason,
        summary: '前置链路将线索推进到 qualified',
      })
      created = clone(existingDetail)
      return
    }

    const id = `lead_msg_${message.id}`
    const runtimeDetail = state.runtimeDetails.find((item) => item.id === decision.runtimeId)
    const leadListItem = {
      id,
      runtimeId: decision.runtimeId,
      displayName: message.senderName ?? message.senderId,
      summary: message.text.slice(0, 120),
      stage: 'detected' as const,
      riskLevel: decision.riskFlags.length > 0 ? 'high' as const : 'medium' as const,
      priority: decision.relatedSignals.includes('pricing') ? 'high' as const : 'medium' as const,
      ownerId: null,
      ownerName: null,
      lastInteractionSummary: decision.reason,
      updatedAt: changedAt,
      suggestion: {
        action: decision.decision,
        title: '由消息前置链自动沉淀为 lead',
        reason: decision.reason,
        requiresReview: decision.requiresReview,
      },
    }
    const leadDetail: LeadDetailViewModel = {
      ...leadListItem,
      sourceGroupName: runtimeDetail?.groupName ?? null,
      sourceAccountName: runtimeDetail?.accountName ?? null,
      sourcePersonaName: runtimeDetail?.personaName ?? null,
      nextActionSummary: '继续确认需求范围并决定是否私聊推进',
      tags: decision.relatedSignals,
    }

    state.leads.unshift(leadListItem)
    state.leadDetails.unshift(leadDetail)
    state.traces.unshift({
      id: createId('trace'),
      happenedAt: changedAt,
      type: 'lead_created',
      entityType: 'lead',
      entityId: id,
      entityName: leadDetail.displayName,
      actorId: 'message_pipeline',
      actorType: 'system',
      actorName: 'Message Pipeline',
      before: null,
      after: { stage: leadDetail.stage, summary: leadDetail.summary },
      reason: decision.reason,
      summary: '消息已沉淀为 lead',
    })

    if (runtimeDetail) {
      const current = new Set(runtimeDetail.relatedLeadIds ?? [])
      current.add(id)
      runtimeDetail.relatedLeadIds = Array.from(current)
      runtimeDetail.lastActionSummary = 'lead detected from message'
      runtimeDetail.currentContextSummary = message.text.slice(0, 120)
      runtimeDetail.updatedAt = changedAt
    }

    created = clone(leadDetail)
  })

  return created
}

function resolveRuntimeId(input: { explicitRuntimeId?: string | null; groupId: string }) {
  if (input.explicitRuntimeId) return input.explicitRuntimeId

  const state = readState()
  const matchedGroup = state.groups.find((group) => group.id === input.groupId)
  if (matchedGroup?.primaryRuntimeId) {
    const primaryRuntime = state.runtimeDetails.find((item) => item.id === matchedGroup.primaryRuntimeId)
    if (primaryRuntime) return primaryRuntime.id
  }

  const matched = state.runtimeDetails.filter((item) => item.groupId === input.groupId)
  if (matched.length === 1) return matched[0]?.id ?? null
  if (matched.length === 0) return null

  const ranked = matched
    .slice()
    .sort((a, b) => {
      const aRestricted = a.restrictionStatus && a.restrictionStatus !== 'normal' ? 1 : 0
      const bRestricted = b.restrictionStatus && b.restrictionStatus !== 'normal' ? 1 : 0
      if (aRestricted !== bRestricted) return aRestricted - bRestricted
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  return ranked[0]?.id ?? null
}

export const pipelineRepository = {
  async ingestMessage(input: {
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
  }) {
    const sentAt = input.sentAt ?? new Date().toISOString()
    const message: MessageEvent = {
      id: createId('msg'),
      groupId: input.groupId,
      runtimeId: input.runtimeId ?? null,
      accountId: input.accountId ?? null,
      senderId: input.senderId,
      senderName: input.senderName ?? null,
      senderUsername: input.senderUsername ?? null,
      text: input.text,
      messageType: input.messageType ?? 'text',
      language: input.language ?? 'zh',
      replyToMessageId: input.replyToMessageId ?? null,
      sentAt,
      rawPayload: null,
      platformUpdateId: input.platformUpdateId ?? null,
      platformMessageId: input.platformMessageId ?? null,
      signals: pickSignals(input.text),
    }

    updateState((state) => {
      state.messageEvents.unshift(clone(message))
      state.traces.unshift({
        id: createId('trace'),
        happenedAt: sentAt,
        type: 'action_executed',
        entityType: 'message_event',
        entityId: message.id,
        entityName: message.senderName ?? message.senderId,
        actorId: 'message_ingest',
        actorType: 'system',
        actorName: 'Message Ingest',
        before: null,
        after: { messageType: message.messageType, groupId: message.groupId },
        reason: null,
        summary: '消息已进入系统',
      })
    })

    return message
  },

  async listMessages(input?: { groupId?: string; runtimeId?: string; limit?: number }) {
    const state = readState()
    let items = state.messageEvents.slice()

    if (input?.groupId) {
      items = items.filter((item) => item.groupId === input.groupId)
    }

    if (input?.runtimeId) {
      items = items.filter((item) => item.runtimeId === input.runtimeId)
    }

    const limit = Math.max(1, Math.min(input?.limit ?? 20, 100))
    const sliced = items.slice(0, limit)

    return {
      items: clone(sliced),
      total: items.length,
    }
  },

  async listDecisions(input?: { groupId?: string; runtimeId?: string; decision?: string; limit?: number }) {
    const state = readState()
    let items = state.decisions.slice()

    if (input?.groupId) {
      items = items.filter((item) => item.groupId === input.groupId)
    }

    if (input?.runtimeId) {
      items = items.filter((item) => item.runtimeId === input.runtimeId)
    }

    if (input?.decision) {
      items = items.filter((item) => item.decision === input.decision)
    }

    const limit = Math.max(1, Math.min(input?.limit ?? 20, 100))
    const sliced = items.slice(0, limit)

    return {
      items: clone(sliced),
      total: items.length,
    }
  },

  async listDrafts(input?: { runtimeId?: string; draftType?: string; decisionId?: string; limit?: number }) {
    const state = readState()
    let items = state.drafts.slice()

    if (input?.runtimeId) {
      items = items.filter((item) => item.runtimeId === input.runtimeId)
    }

    if (input?.draftType) {
      items = items.filter((item) => item.draftType === input.draftType)
    }

    if (input?.decisionId) {
      items = items.filter((item) => item.decisionId === input.decisionId)
    }

    const limit = Math.max(1, Math.min(input?.limit ?? 20, 100))
    const sliced = items.slice(0, limit)

    return {
      items: clone(sliced),
      total: items.length,
    }
  },

  async getDecision(id: string) {
    const state = readState()
    const decision = state.decisions.find((item) => item.id === id)
    if (!decision) throw new Error('Decision item not found: ' + id)
    return clone(decision)
  },

  async getDraft(id: string) {
    const state = readState()
    const draft = state.drafts.find((item) => item.id === id)
    if (!draft) throw new Error('Draft item not found: ' + id)
    return clone(draft)
  },

  async buildMessageContext(messageId: string, recentLimit = 8) {
    const state = readState()
    const message = state.messageEvents.find((item) => item.id === messageId)
    if (!message) throw new Error('Message event not found: ' + messageId)

    const recentMessages = state.messageEvents
      .filter((item) => item.groupId === message.groupId)
      .slice(0, recentLimit)
      .map((item) => ({ id: item.id, senderId: item.senderId, senderName: item.senderName ?? null, text: item.text, sentAt: item.sentAt }))

    const context: MessageContext = {
      messageId: message.id,
      groupId: message.groupId,
      runtimeId: message.runtimeId ?? null,
      intelligence: buildMessageIntelligence(message, message.signals ?? []),
      recentMessages,
      topicSummary: buildTopicSummary(message, message.signals ?? []),
      candidateTargets: [
        {
          userId: message.senderId,
          userName: message.senderName ?? null,
          reason: '当前消息发送者是最直接的候选互动对象',
        },
      ],
      recentLeadIds: getRuntimeLeadIds(message.runtimeId),
      recentRiskFlags: getRuntimeRiskFlags(message.runtimeId),
    }

    updateState((nextState) => {
      const index = nextState.messageContexts.findIndex((item) => item.messageId === messageId)
      if (index >= 0) nextState.messageContexts[index] = clone(context)
      else nextState.messageContexts.unshift(clone(context))
    })

    return context
  },

  async createDecision(input: { sourceMessageId: string; runtimeId?: string | null; personaId?: string | null; accountId?: string | null }) {
    const state = readState()
    const message = state.messageEvents.find((item) => item.id === input.sourceMessageId)
    if (!message) throw new Error('Message event not found: ' + input.sourceMessageId)

    const resolvedRuntimeId = resolveRuntimeId({
      explicitRuntimeId: input.runtimeId ?? message.runtimeId ?? null,
      groupId: message.groupId,
    })

    if (message.runtimeId !== resolvedRuntimeId) {
      updateState((nextState) => {
        const target = nextState.messageEvents.find((item) => item.id === message.id)
        if (target) target.runtimeId = resolvedRuntimeId
      })
      message.runtimeId = resolvedRuntimeId
    }

    const context = state.messageContexts.find((item) => item.messageId === input.sourceMessageId) ?? (await this.buildMessageContext(input.sourceMessageId))
    const runtime = resolvedRuntimeId ? state.runtimeDetails.find((item) => item.id === resolvedRuntimeId) ?? null : null
    const next = decideAction({
      message,
      context,
      runtime,
      signals: message.signals ?? [],
    })

    const selection = chooseAccountAndPersona({
      runtimeId: resolvedRuntimeId,
      signals: message.signals ?? [],
      riskFlags: next.riskFlags,
    })

    const decision: DecisionItem = {
      id: createId('decision'),
      sourceMessageId: message.id,
      groupId: message.groupId,
      runtimeId: resolvedRuntimeId,
      decision: next.decision,
      reason: [next.reason, `规则：${next.engine.selectedRule}`, ...next.engine.rationale, ...selection.notes].join('；'),
      confidence: next.confidence,
      relatedSignals: message.signals ?? [],
      requiresReview: next.requiresReview,
      riskFlags: next.riskFlags,
      engine: next.engine,
      strategy: next.strategy,
      personaId: input.personaId ?? selection.persona?.id ?? null,
      accountId: resolveExplicitAccountId(input.accountId) ?? selection.account?.id ?? resolveExplicitAccountId(message.accountId) ?? null,
      createdAt: new Date().toISOString(),
    }

    updateState((nextState) => {
      nextState.decisions.unshift(clone(decision))
    })

    return decision
  },

  async createDraft(decisionId: string) {
    const state = readState()
    const decision = state.decisions.find((item) => item.id === decisionId)
    if (!decision) throw new Error('Decision item not found: ' + decisionId)
    if (!['reply', 'ask', 'dm_suggest'].includes(decision.decision)) return null

    const existing = state.drafts.find((item) => item.decisionId === decisionId)
    if (existing) return clone(existing)

    const message = state.messageEvents.find((item) => item.id === decision.sourceMessageId)
    if (!message) throw new Error('Message event not found: ' + decision.sourceMessageId)

    const selectedPersona = decision.personaId ? state.personas.find((item) => item.id === decision.personaId) : null
    const selectedAccount = decision.accountId ? state.accounts.find((item) => item.id === decision.accountId) : null
    const personaStyle = selectedPersona
      ? `按「${selectedPersona.name}」执行：${selectedPersona.tone}；${selectedPersona.languageStyle}；禁忌：${selectedPersona.forbiddenRules.join('、')}`
      : '保持克制、自然、像真人交流，不要过度推销'
    const accountNote = selectedAccount
      ? `使用账号「${selectedAccount.name}」，当前状态 ${selectedAccount.status}，剩余额度 ${Math.max(0, selectedAccount.dailyQuota - selectedAccount.usedQuota)}/${selectedAccount.dailyQuota}`
      : '未绑定具体账号'

    const draftPlan = buildDraftPlan(decision, message)
    if (decision.strategy?.appliedRuleName) {
      draftPlan.engine.rationale.push(`策略规则：${decision.strategy.appliedRuleName}`)
    }
    const draft: DraftItem = {
      id: createId('draft'),
      decisionId,
      sourceMessageId: decision.sourceMessageId,
      runtimeId: decision.runtimeId ?? null,
      draftType: decision.decision as DraftType,
      draftText: draftPlan.draftText,
      personaId: decision.personaId ?? null,
      styleNotes: `${personaStyle}；${accountNote}；草稿引擎：${draftPlan.engine.selectedTemplate}（${draftPlan.engine.tone}）`,
      riskNotes: decision.riskFlags.length > 0 ? `注意风险标记：${decision.riskFlags.join(', ')}` : '未命中高风险信号',
      ctaType: draftPlan.ctaType,
      engine: draftPlan.engine,
      strategy: decision.strategy ?? null,
      alternatives: draftPlan.alternatives,
      createdAt: new Date().toISOString(),
    }

    updateState((nextState) => {
      nextState.drafts.unshift(clone(draft))
    })

    return draft
  },

  async processMessage(input: {
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
    personaId?: string | null
  }) {
    const message = await this.ingestMessage(input)
    await this.buildMessageContext(message.id)
    const decision = await this.createDecision({
      sourceMessageId: message.id,
      runtimeId: input.runtimeId ?? null,
      personaId: input.personaId ?? null,
      accountId: input.accountId ?? null,
    })
    const refreshedState = readState()
    const refreshedMessage = clone(refreshedState.messageEvents.find((item) => item.id === message.id) ?? message)
    const refreshedContext = clone(
      refreshedState.messageContexts.find((item) => item.messageId === message.id) ?? {
        messageId: refreshedMessage.id,
        groupId: refreshedMessage.groupId,
        runtimeId: decision.runtimeId ?? refreshedMessage.runtimeId ?? null,
        recentMessages: [],
        intelligence: buildMessageIntelligence(refreshedMessage, refreshedMessage.signals ?? []),
        topicSummary: buildTopicSummary(refreshedMessage, refreshedMessage.signals ?? []),
        candidateTargets: [
          {
            userId: refreshedMessage.senderId,
            userName: refreshedMessage.senderName ?? null,
            reason: '当前消息发送者是最直接的候选互动对象',
          },
        ],
        recentLeadIds: getRuntimeLeadIds(decision.runtimeId ?? refreshedMessage.runtimeId ?? null),
        recentRiskFlags: getRuntimeRiskFlags(decision.runtimeId ?? refreshedMessage.runtimeId ?? null),
      }
    )
    refreshedMessage.runtimeId = decision.runtimeId ?? refreshedMessage.runtimeId ?? null
    refreshedContext.runtimeId = decision.runtimeId ?? refreshedContext.runtimeId ?? null
    const draft = await this.createDraft(decision.id)
    const review = upsertReviewFromDecision(decision, draft, refreshedMessage)
    const risk = upsertRiskFromDecision(decision, refreshedMessage)
    const lead = upsertLeadFromDecision(decision, refreshedMessage)
    const runtime = decision.runtimeId ? readState().runtimeDetails.find((item) => item.id === decision.runtimeId) ?? null : null

    if (runtime) {
      await traceRepository.appendTrace({
        id: createId('trace'),
        happenedAt: new Date().toISOString(),
        type: 'runtime_context_updated',
        entityType: 'runtime',
        entityId: runtime.id,
        entityName: runtime.name,
        actorId: 'message_pipeline',
        actorType: 'system',
        actorName: 'Message Pipeline',
        before: null,
        after: {
          lastActionSummary: runtime.lastActionSummary ?? null,
          currentContextSummary: runtime.currentContextSummary ?? null,
          relatedLeadIds: runtime.relatedLeadIds ?? [],
        },
        reason: decision.reason,
        summary: '消息前置链已回流到 runtime',
      })
    }

    return {
      ok: true as const,
      message: refreshedMessage,
      context: refreshedContext,
      decision,
      draft,
      review,
      risk,
      lead,
      runtime: runtime ? clone(runtime) : null,
    }
  },
}

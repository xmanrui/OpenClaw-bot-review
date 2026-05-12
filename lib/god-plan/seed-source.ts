import type {
  LeadDetailViewModel,
  LeadListItem,
  ReviewDetailViewModel,
  RiskQueueListItem,
  RuntimeDetailViewModel,
  RuntimeListItem,
  StrategyRule,
  TraceEvent,
} from '@/lib/god-plan/types'

export interface GroupRecord {
  id: string
  name: string
  platform: string
  category: string
  language: string
  status: string
  description: string
  tags: string[]
  source: string
  owner: string | null
  primaryRuntimeId?: string | null
  externalRefs?: {
    platform: string
    chatId: string
    kind: 'telegram_group' | 'telegram_direct'
  }[]
  lastActiveAt: string
  createdAt: string
  updatedAt: string
}

export interface GroupListQuery {
  primaryRuntimeId?: string
  platform?: string
  status?: string
}

export interface AccountRecord {
  id: string
  name: string
  platform: string
  status: 'active' | 'cooling' | 'frozen' | 'banned' | 'warming'
  healthScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  dailyQuota: number
  usedQuota: number
  joinCapacity: 'normal' | 'limited' | 'disabled'
  speakStatus: 'normal' | 'limited' | 'silent' | 'banned'
  cooldownUntil?: string | null
  deviceRef?: string | null
  proxyRef?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface PersonaRecord {
  id: string
  name: string
  role: string
  domains: string[]
  tone: string
  style: string
  forbiddenRules: string[]
  speakPreference: string
  initiativeLevel: 'low' | 'medium' | 'high'
  conversionStyle: string
  languageStyle: string
  trackFit: string[]
  createdAt: string
  updatedAt: string
}

const now = new Date()
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()

export const runtimeItems: RuntimeListItem[] = [
  { id: 'runtime_ai_a_advisor', name: 'AI 创业群 / 顾问号-A / 创业顾问型', groupId: 'group_ai_founder', groupName: 'AI 创业交流群', accountName: '顾问号-A', personaName: '创业顾问型', stage: 'lead_observing', restrictionStatus: 'normal', riskLevel: 'low', suggestion: { action: 'continue_nurture', title: '继续轻推进', reason: '高价值对象还在群内持续发言' }, updatedAt: minutesAgo(8), ownerId: null },
  { id: 'runtime_indie_a_growth', name: '独立开发者增长群 / 顾问号-A / 增长操盘手型', groupId: 'group_indie_hackers', groupName: '独立开发者增长群', accountName: '顾问号-A', personaName: '增长操盘手型', stage: 'lead_advancing', restrictionStatus: 'under_review', riskLevel: 'medium', suggestion: { action: 'send_to_review', title: '有一条跟进草稿待审', reason: '目标对象需求明确，建议审核后再发' }, updatedAt: minutesAgo(12), ownerId: 'owner_alice' },
  { id: 'runtime_trade_b_peer', name: '跨境电商群 / 顾问号-B / 同行朋友型', groupId: 'group_cross_border', groupName: '跨境电商交流社', accountName: '顾问号-B', personaName: '同行朋友型', stage: 'presence_building', restrictionStatus: 'observing', riskLevel: 'medium', suggestion: { action: 'observe', title: '先观察', reason: '氛围还没建立，不建议强推进' }, updatedAt: minutesAgo(25), ownerId: null },
  { id: 'runtime_seo_c_growth', name: 'TG SEO 群 / 社区号-C / 增长操盘手型', groupId: 'group_tg_seo', groupName: 'Telegram SEO 资源群', accountName: '社区号-C', personaName: '增长操盘手型', stage: 'cooling_maintenance', restrictionStatus: 'degraded', riskLevel: 'high', suggestion: { action: 'degrade', title: '继续降频', reason: '近期表达重复度高，暴露风险偏高' }, updatedAt: minutesAgo(31), ownerId: 'owner_bob' },
  { id: 'runtime_seo_a_advisor', name: 'TG SEO 群 / 顾问号-A / 创业顾问型', groupId: 'group_tg_seo', groupName: 'Telegram SEO 资源群', accountName: '顾问号-A', personaName: '创业顾问型', stage: 'silent_observing', restrictionStatus: 'silent', riskLevel: 'high', suggestion: { action: 'silence', title: '保持静默', reason: '群处于敏感期，先不要继续出声' }, updatedAt: minutesAgo(46), ownerId: 'owner_bob' },
  { id: 'runtime_cold_b_peer', name: '冷启动测试群 / 顾问号-B / 同行朋友型', groupId: null, groupName: '新群冷启动测试群', accountName: '顾问号-B', personaName: '同行朋友型', stage: 'entry', restrictionStatus: 'normal', riskLevel: 'low', suggestion: { action: 'observe', title: '刚入场', reason: '先建存在感，再判断经营方向' }, updatedAt: minutesAgo(4), ownerId: null },
]

export const runtimeDetails: RuntimeDetailViewModel[] = runtimeItems.map((item, index) => ({
  ...item,
  familiarityScore: 55 + index * 4,
  trustScore: 48 + index * 3,
  exposureScore: 32 + index * 5,
  currentTopicSummary: item.groupName + ' 最近围绕增长、获客和私域转化展开讨论',
  currentContextSummary: item.suggestion?.reason ?? null,
  lastActionSummary: item.suggestion?.title ?? null,
  nextActionAt: new Date(now.getTime() + (15 + index * 3) * 60_000).toISOString(),
  relatedLeadIds: index < 3 ? ['lead_founder_zhang', 'lead_indie_li'].slice(0, index === 0 ? 1 : 2) : [],
}))

export const reviewItems: ReviewDetailViewModel[] = [
  { id: 'review_r3_reply_001', runtimeId: 'runtime_indie_a_growth', leadId: 'lead_indie_li', targetName: '李某（独立开发者）', actionType: 'reply', status: 'pending', riskLevel: 'medium', draftSummary: '一条偏判断型的跟进回复，建议审核后发送', submittedAt: minutesAgo(14), draftText: '你现在这个阶段，先别急着堆渠道，先把首批付费用户画像打透，不然后面的增长成本会一直高。', rewrittenDraftText: null, reviewComment: null, suggestion: { action: 'rewrite', title: '建议轻微改写后通过', reason: '判断味稍重，建议更自然一些', requiresReview: true } },
  { id: 'review_r8_dm_001', runtimeId: 'runtime_seo_c_growth', leadId: 'lead_risky_ma', targetName: '马某（SEO 资源方）', actionType: 'dm_suggest', status: 'pending', riskLevel: 'high', draftSummary: '带轻 CTA 的私聊建议，风险偏高', submittedAt: minutesAgo(20), draftText: '你如果愿意的话，我可以私下把那套筛选方法给你，群里说不太方便。', rewrittenDraftText: null, reviewComment: null, suggestion: { action: 'handoff', title: '建议人工兜底', reason: '导流感较强，可能触发敏感风控', requiresReview: true } },
  { id: 'review_r5_cta_001', runtimeId: 'runtime_seo_c_growth', leadId: null, targetName: 'SEO 资源群 CTA', actionType: 'cta', status: 'rejected', riskLevel: 'high', draftSummary: '直接引导动作已驳回', submittedAt: minutesAgo(80), draftText: '有需要的可以直接加我细聊。', rewrittenDraftText: null, reviewComment: '导流感太强，驳回', suggestion: null },
  { id: 'review_r1_ask_001', runtimeId: 'runtime_ai_a_advisor', leadId: 'lead_founder_zhang', targetName: '张总', actionType: 'ask', status: 'approved', riskLevel: 'low', draftSummary: '已通过的一条轻问句', submittedAt: minutesAgo(120), draftText: '你们现在更卡在获客效率，还是销售转化链路？', rewrittenDraftText: '你们现在更卡在获客效率，还是成交转化？', reviewComment: '改写后已通过', suggestion: null },
]

export const riskItems: RiskQueueListItem[] = [
  { id: 'risk_runtime_seo_repeat_001', type: 'content_repetition', title: '内容重复风险', summary: '同类表达短时间内重复出现，存在被识别风险', targetType: 'runtime', targetId: 'runtime_seo_c_growth', targetName: 'TG SEO 群 / 社区号-C / 增长操盘手型', riskLevel: 'high', status: 'restricted', currentRestriction: '降频至低', relatedRuntimeId: 'runtime_seo_c_growth', triggeredAt: minutesAgo(40) },
  { id: 'risk_group_sensitive_001', type: 'group_sensitive_period', title: '群敏感期风险', summary: '管理员近期对导流与过度互动更敏感', targetType: 'runtime', targetId: 'runtime_seo_a_advisor', targetName: 'TG SEO 群 / 顾问号-A / 创业顾问型', riskLevel: 'high', status: 'observing', currentRestriction: '建议静默观察', relatedRuntimeId: 'runtime_seo_a_advisor', triggeredAt: minutesAgo(55) },
  { id: 'risk_account_freq_001', type: 'account_frequency_abnormal', title: '账号频率异常', summary: '社区号-C 在近 1 小时内互动过密', targetType: 'account', targetId: 'account_community_c', targetName: '社区号-C', riskLevel: 'high', status: 'restricted', currentRestriction: '账号降载', relatedRuntimeId: 'runtime_seo_c_growth', triggeredAt: minutesAgo(70) },
  { id: 'risk_sensitive_cta_001', type: 'sensitive_cta', title: '导流敏感风险', summary: '草稿中出现较强私聊导流意图', targetType: 'review_item', targetId: 'review_r8_dm_001', targetName: 'review_r8_dm_001', riskLevel: 'critical', status: 'under_review', currentRestriction: '需人工放行', relatedRuntimeId: 'runtime_seo_c_growth', triggeredAt: minutesAgo(18) },
]

export const leadItems: LeadListItem[] = [
  {
    id: 'lead_founder_zhang',
    runtimeId: 'runtime_ai_a_advisor',
    displayName: '张总',
    summary: '对 AI 创业服务外包和获客效率都表现出明确兴趣，适合继续推进。',
    stage: 'qualified',
    riskLevel: 'low',
    priority: 'high',
    ownerId: 'owner_alice',
    ownerName: 'Alice',
    lastInteractionSummary: '已通过一条轻问句确认需求方向',
    updatedAt: minutesAgo(16),
    suggestion: { action: 'nurture', title: '进入培育', reason: '需求已相对清晰，建议继续围绕成交障碍推进' },
  },
  {
    id: 'lead_indie_li',
    runtimeId: 'runtime_indie_a_growth',
    displayName: '李某（独立开发者）',
    summary: '正在讨论首批付费用户与增长路径，是当前最值得跟进的对象之一。',
    stage: 'detected',
    riskLevel: 'medium',
    priority: 'high',
    ownerId: 'owner_alice',
    ownerName: 'Alice',
    lastInteractionSummary: '已有一条审核通过的跟进建议',
    updatedAt: minutesAgo(10),
    suggestion: { action: 'qualify', title: '先标记合格', reason: '已具备明确需求信号，可以正式纳入 lead 队列' },
  },
  {
    id: 'lead_risky_ma',
    runtimeId: 'runtime_seo_c_growth',
    displayName: '马某（SEO 资源方）',
    summary: '具备资源交换价值，但当前触发过导流敏感风险，需谨慎经营。',
    stage: 'nurtured',
    riskLevel: 'high',
    priority: 'medium',
    ownerId: 'owner_bob',
    ownerName: 'Bob',
    lastInteractionSummary: '风险刚由人工关闭，暂不宜激进推进',
    updatedAt: minutesAgo(7),
    suggestion: { action: 'observe', title: '保持轻培育', reason: '有价值，但当前更适合低频维护而不是立刻转化' },
  },
  {
    id: 'lead_cold_wang',
    runtimeId: 'runtime_cold_b_peer',
    displayName: '王某（新群活跃者）',
    summary: '刚出现不久，只有初步兴趣信号，暂时还不值得重投入。',
    stage: 'detected',
    riskLevel: 'low',
    priority: 'low',
    ownerId: null,
    ownerName: null,
    lastInteractionSummary: '仅完成入场观察',
    updatedAt: minutesAgo(5),
    suggestion: { action: 'observe', title: '继续观察', reason: '先确认是否有持续互动价值，再决定是否推进' },
  },
]

export const leadDetails: LeadDetailViewModel[] = leadItems.map((item) => ({
  ...item,
  sourceGroupName: runtimeItems.find((runtime) => runtime.id === item.runtimeId)?.groupName ?? null,
  sourceAccountName: runtimeItems.find((runtime) => runtime.id === item.runtimeId)?.accountName ?? null,
  sourcePersonaName: runtimeItems.find((runtime) => runtime.id === item.runtimeId)?.personaName ?? null,
  nextActionSummary: item.suggestion?.title ?? null,
  tags: item.riskLevel === 'high' ? ['high-risk', 'watch'] : item.priority === 'high' ? ['high-priority'] : ['watch'],
}))

export const traceEvents: TraceEvent[] = [
  { id: 'trace_runtime_r3_review_submitted', type: 'review_submitted', entityType: 'runtime', entityId: 'runtime_indie_a_growth', entityName: '独立开发者增长群 / 顾问号-A / 增长操盘手型', actorId: 'system', actorType: 'system', actorName: 'system', before: { restrictionStatus: 'normal' }, after: { restrictionStatus: 'under_review' }, reason: '生成了一条需审核的跟进动作', summary: 'runtime 已进入待审核状态', happenedAt: minutesAgo(14) },
  { id: 'trace_review_r1_approved', type: 'review_decided', entityType: 'review_item', entityId: 'review_r1_ask_001', entityName: 'review_r1_ask_001', actorId: 'owner_alice', actorType: 'human', actorName: 'Alice', before: { status: 'pending' }, after: { status: 'approved' }, reason: '轻改写后通过', summary: '审核项已通过', happenedAt: minutesAgo(110) },
  { id: 'trace_risk_runtime_seo_repeat', type: 'risk_triggered', entityType: 'risk_event', entityId: 'risk_runtime_seo_repeat_001', entityName: '内容重复风险', actorId: 'system', actorType: 'system', actorName: 'system', before: null, after: { status: 'restricted' }, reason: '重复表达过多', summary: 'runtime 进入降频限制', happenedAt: minutesAgo(40) },
  { id: 'trace_runtime_seo_restricted', type: 'runtime_restriction_changed', entityType: 'runtime', entityId: 'runtime_seo_c_growth', entityName: 'TG SEO 群 / 社区号-C / 增长操盘手型', actorId: 'system', actorType: 'system', actorName: 'system', before: { restrictionStatus: 'normal' }, after: { restrictionStatus: 'degraded' }, reason: '风险触发后自动降频', summary: 'runtime 由 normal 变为 degraded', happenedAt: minutesAgo(39) },
]

const groupSeedNow = new Date()
const groupSeedMinutesAgo = (m: number) => new Date(groupSeedNow.getTime() - m * 60_000).toISOString()

const accounts: AccountRecord[] = [
  { id: 'account_advisor_a', name: '顾问号-A', platform: 'telegram', status: 'active', healthScore: 86, riskLevel: 'low', dailyQuota: 30, usedQuota: 7, joinCapacity: 'normal', speakStatus: 'normal', cooldownUntil: null, deviceRef: 'device-a', proxyRef: 'proxy-hk-01', notes: '主力顾问号，适合承接高价值线索。', createdAt: groupSeedMinutesAgo(900), updatedAt: groupSeedMinutesAgo(8) },
  { id: 'account_advisor_b', name: '顾问号-B', platform: 'telegram', status: 'warming', healthScore: 72, riskLevel: 'medium', dailyQuota: 18, usedQuota: 4, joinCapacity: 'limited', speakStatus: 'normal', cooldownUntil: null, deviceRef: 'device-b', proxyRef: 'proxy-sg-02', notes: '冷启动和轻互动账号，避免高频推进。', createdAt: groupSeedMinutesAgo(840), updatedAt: groupSeedMinutesAgo(24) },
  { id: 'account_community_c', name: '社区号-C', platform: 'telegram', status: 'cooling', healthScore: 54, riskLevel: 'high', dailyQuota: 12, usedQuota: 10, joinCapacity: 'limited', speakStatus: 'limited', cooldownUntil: groupSeedMinutesAgo(-90), deviceRef: 'device-c', proxyRef: 'proxy-jp-03', notes: '近期触发频率风险，需要降载观察。', createdAt: groupSeedMinutesAgo(780), updatedAt: groupSeedMinutesAgo(31) },
]

const personas: PersonaRecord[] = [
  { id: 'persona_startup_advisor', name: '创业顾问型', role: '偏判断和拆解的顾问角色', domains: ['AI', 'SaaS', '获客'], tone: '克制、专业、直接', style: '先判断问题结构，再给轻建议', forbiddenRules: ['不直接硬广', '不连续追问', '不在公开群强导流'], speakPreference: '优先回答明确问题，避免无意义刷存在感', initiativeLevel: 'medium', conversionStyle: '先确认需求，再建议私聊承接', languageStyle: '短句、低营销味、偏咨询口吻', trackFit: ['AI', 'founder', 'saas'], createdAt: groupSeedMinutesAgo(900), updatedAt: groupSeedMinutesAgo(8) },
  { id: 'persona_growth_operator', name: '增长操盘手型', role: '偏实战和路径设计的增长角色', domains: ['增长', '私域', '转化'], tone: '务实、结果导向、少废话', style: '给路径、给优先级、给下一步', forbiddenRules: ['不承诺绝对收益', '不频繁贴链接', '不制造焦虑'], speakPreference: '对高意图对象主动一点，对闲聊保持观察', initiativeLevel: 'high', conversionStyle: '用诊断型问题推动下一步', languageStyle: '像同行交流，不像客服话术', trackFit: ['growth', 'indie', 'traffic'], createdAt: groupSeedMinutesAgo(860), updatedAt: groupSeedMinutesAgo(12) },
  { id: 'persona_peer_friend', name: '同行朋友型', role: '偏陪跑和经验交换的同行角色', domains: ['跨境', '冷启动', '社群'], tone: '自然、松弛、低压', style: '先共鸣，再补一条实用经验', forbiddenRules: ['不装专家', '不主动索要联系方式', '不抢话题'], speakPreference: '适合低风险群内存在感建设', initiativeLevel: 'low', conversionStyle: '先建立熟悉感，再慢慢承接', languageStyle: '口语化、短回复、少术语', trackFit: ['cross-border', 'community', 'cold-start'], createdAt: groupSeedMinutesAgo(820), updatedAt: groupSeedMinutesAgo(25) },
]

const strategyRules: StrategyRule[] = [
  {
    id: 'strategy_high_intent_private_followup',
    name: '高意图询价：低压私聊承接',
    status: 'active',
    target: 'decision',
    priority: 100,
    signalIncludes: ['pricing', 'commercial_intent'],
    intentLevel: ['high'],
    minIntentScore: 70,
    maxRiskScore: 59,
    decisionAction: 'dm_suggest',
    forceReview: true,
    reviewGate: 'human_review',
    draftTemplateHint: 'high_intent_private_followup',
    rationale: '询价和合作意图同时出现，适合进入人工审核后的低压私聊承接。',
    createdAt: groupSeedMinutesAgo(900),
    updatedAt: groupSeedMinutesAgo(6),
  },
  {
    id: 'strategy_risk_sensitive_handoff',
    name: '风险敏感：人工兜底',
    status: 'active',
    target: 'risk',
    priority: 120,
    signalIncludes: ['risk_sensitive'],
    minIntentScore: 0,
    decisionAction: 'escalate_to_human',
    forceReview: true,
    reviewGate: 'risk_review',
    draftTemplateHint: null,
    rationale: '出现封号、风控、违规、导流等敏感表达时，先进入人工兜底。',
    createdAt: groupSeedMinutesAgo(900),
    updatedAt: groupSeedMinutesAgo(6),
  },
]

const groups: GroupRecord[] = [
  {
    id: 'group_indie_hackers',
    name: '独立开发者增长群',
    platform: 'telegram',
    category: '增长',
    language: 'zh-CN',
    status: 'active',
    description: '围绕独立开发、增长与首批用户获取展开讨论。',
    tags: ['indie', 'growth', 'founder'],
    source: 'seed-v1',
    owner: 'system',
    primaryRuntimeId: 'runtime_indie_a_growth',
    externalRefs: [
      { platform: 'telegram', chatId: '-10017770001', kind: 'telegram_group' },
      { platform: 'telegram', chatId: '987654321', kind: 'telegram_direct' },
    ],
    lastActiveAt: groupSeedMinutesAgo(6),
    createdAt: groupSeedMinutesAgo(600),
    updatedAt: groupSeedMinutesAgo(6),
  },
  {
    id: 'group_ai_founder',
    name: 'AI 创业交流群',
    platform: 'telegram',
    category: 'AI',
    language: 'zh-CN',
    status: 'active',
    description: 'AI 创业者与顾问型账号的高频交流场。',
    tags: ['ai', 'founder', 'saas'],
    source: 'seed-v1',
    owner: 'system',
    lastActiveAt: groupSeedMinutesAgo(9),
    createdAt: groupSeedMinutesAgo(720),
    updatedAt: groupSeedMinutesAgo(9),
  },
  {
    id: 'group_tg_seo',
    name: 'Telegram SEO 资源群',
    platform: 'telegram',
    category: 'SEO',
    language: 'zh-CN',
    status: 'active',
    description: '偏资源交换与流量讨论，风险敏感度较高。',
    tags: ['seo', 'telegram', 'traffic'],
    source: 'seed-v1',
    owner: 'system',
    lastActiveAt: groupSeedMinutesAgo(18),
    createdAt: groupSeedMinutesAgo(840),
    updatedAt: groupSeedMinutesAgo(18),
  },
  {
    id: 'group_cross_border',
    name: '跨境电商交流社',
    platform: 'telegram',
    category: '跨境',
    language: 'zh-CN',
    status: 'active',
    description: '跨境从业者的经验交换群。',
    tags: ['cross-border', 'ecommerce'],
    source: 'seed-v1',
    owner: null,
    lastActiveAt: groupSeedMinutesAgo(24),
    createdAt: groupSeedMinutesAgo(900),
    updatedAt: groupSeedMinutesAgo(24),
  },
]

export function getAccountStore() {
  return accounts
}

export function getPersonaStore() {
  return personas
}

export function getGroupStore() {
  return groups
}

export function getRuntimeStore() {
  return runtimeItems
}

export function getRuntimeDetailStore() {
  return runtimeDetails
}

export function getLeadStore() {
  return leadItems
}

export function getLeadDetailStore() {
  return leadDetails
}

export function getReviewStore() {
  return reviewItems
}

export function getRiskStore() {
  return riskItems
}

export function getTraceStore() {
  return traceEvents
}

export function getStrategyRuleStore() {
  return strategyRules
}

import assert from 'node:assert/strict'

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const secret = process.env.INBOUND_SHARED_SECRET || 'god-plan-demo-secret'
const patchedPrimaryRuntimeId = 'runtime_indie_a_growth'
const invalidPrimaryRuntimeId = 'runtime_not_exists_for_smoke'
const foreignGroupRuntimeId = 'runtime_seo_c_growth'

function buildTelegramMessageUpdate(updateId) {
  return {
    update_id: updateId,
    message: {
      message_id: 9001,
      date: 1777117200,
      text: '请问你们这个怎么收费？如果合适我想进一步了解合作方式',
      from: {
        id: 123456789,
        first_name: '测试',
        last_name: '用户',
        username: 'demo_user',
      },
      chat: {
        id: 987654321,
        type: 'private',
      },
    },
  }
}

function buildTelegramGroupMessageUpdate(updateId) {
  return {
    update_id: updateId,
    message: {
      message_id: 9101,
      date: 1777117202,
      text: '这个方案怎么收费？如果合适我想进一步合作',
      from: {
        id: 22334455,
        first_name: '群聊',
        last_name: '用户',
        username: 'group_demo_user',
      },
      chat: {
        id: -10017770001,
        type: 'supergroup',
        title: '独立开发者增长群',
      },
    },
  }
}
function buildTelegramCallbackUpdate(updateId) {
  return {
    update_id: updateId,
    callback_query: {
      id: `cb_${updateId}`,
      data: '我想进一步了解合作方式',
      from: {
        id: 123456789,
        first_name: '测试',
        last_name: '用户',
        username: 'demo_user',
      },
      message: {
        message_id: 9002,
        date: 1777117201,
        chat: {
          id: 987654321,
          type: 'private',
        },
      },
    },
  }
}

async function requestJson(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init)
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    text,
    json,
  }
}

async function postTelegram(update, token) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
  }

  if (token !== undefined) {
    headers.Authorization = `Bearer ${token}`
  }

  return requestJson('/api/inbound/telegram', {
    method: 'POST',
    headers,
    body: JSON.stringify(update),
  })
}

function assertArrayIncludesAll(actual, expected, label) {
  assert.ok(Array.isArray(actual), `${label} 必须是数组`)
  for (const item of expected) {
    assert.ok(actual.includes(item), `${label} 缺少 ${item}`)
  }
}

async function main() {
  const uniqueId = Date.now()
  const firstPayload = buildTelegramMessageUpdate(uniqueId)

  const failClosedSecret = await requestJson('/api/inbound/telegram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(firstPayload),
  })
  assert.equal(failClosedSecret.status, 401, `未携带 token 时 inbound 应 fail-closed 返回 401，实际是 ${failClosedSecret.status}`)

  const missingToken = await postTelegram(firstPayload, undefined)
  assert.equal(missingToken.status, 401, `缺失 token 应返回 401，实际是 ${missingToken.status}`)
  assert.equal(missingToken.json?.ok, false)

  const unauthorized = await postTelegram(firstPayload, 'wrong-secret')
  assert.equal(unauthorized.status, 401, `错误 token 应返回 401，实际是 ${unauthorized.status}`)
  assert.equal(unauthorized.json?.ok, false)

  const first = await postTelegram(firstPayload, secret)
  assert.equal(first.status, 200, `首次入链应返回 200，实际是 ${first.status}`)
  assert.ok(first.json, '首次入链返回必须是 JSON')
  assertArrayIncludesAll(first.json?.message?.signals, ['question', 'pricing', 'commercial_intent'], 'message.signals')
  assert.equal(first.json?.decision?.decision, 'dm_suggest', '首次入链 decision.decision 应为 dm_suggest')
  assert.equal(first.json?.decision?.engine?.engineVersion, 'decision-engine-v1', '首次入链 decision 应记录决策引擎版本')
  assert.equal(first.json?.decision?.engine?.selectedRule, 'high_intent_dm_suggest', '首次入链 decision 应命中高意图私聊建议规则')
  assert.equal(first.json?.decision?.strategy?.engineVersion, 'strategy-rules-v1', '首次入链 decision 应记录策略规则引擎版本')
  assert.equal(first.json?.decision?.strategy?.appliedRuleId, 'strategy_high_intent_private_followup', '首次入链 decision 应命中高意图策略规则')
  assert.equal(first.json?.decision?.engine?.reviewGate, 'human_review', '首次入链 decision 应进入人工审核闸口')
  assert.ok((first.json?.decision?.engine?.score ?? 0) >= 70, '首次入链 decision engine score 应 >= 70')
  assert.ok(Array.isArray(first.json?.decision?.engine?.rationale) && first.json.decision.engine.rationale.length > 0, '首次入链 decision 应包含决策依据')
  assert.equal(first.json?.context?.intelligence?.intentLevel, 'high', '首次入链 message intelligence 应识别为高意图')
  assert.equal(first.json?.context?.intelligence?.temperature, 'hot', '首次入链 message intelligence 应识别为热线索')
  assert.ok((first.json?.context?.intelligence?.intentScore ?? 0) >= 70, '首次入链 message intelligence intentScore 应 >= 70')
  assert.ok((first.json?.context?.intelligence?.riskScore ?? 100) < 60, '首次入链 message intelligence riskScore 应低于直接风控阈值')

  const firstDecisionId = first.json?.decision?.id
  const firstDraftId = first.json?.draft?.id
  const firstDecisionAccountId = first.json?.decision?.accountId ?? null
  const firstDecisionPersonaId = first.json?.decision?.personaId ?? null
  const firstDraftPersonaId = first.json?.draft?.personaId ?? null
  const firstReviewId = first.json?.review?.id
  const firstReviewRuntimeId = first.json?.review?.runtimeId ?? null
  const firstMessageId = first.json?.message?.id
  const firstGroupId = first.json?.message?.groupId
  const firstRuntimeId = first.json?.runtime?.id ?? null
  assert.ok(firstDecisionId, '首次入链必须返回 decision.id')
  assert.ok(firstDraftId, '首次入链必须返回 draft.id')
  assert.equal(firstDecisionAccountId, 'account_advisor_a', '首次入链 decision 应选择真实账号 id，而不是泛平台标识')
  assert.equal(firstDecisionPersonaId, 'persona_growth_operator', '首次入链 decision 应选择增长运营型人设')
  assert.equal(firstRuntimeId, patchedPrimaryRuntimeId, '私聊消息应通过 telegram_direct externalRef 映射到主绑定 runtime')
  assert.equal(firstReviewRuntimeId, patchedPrimaryRuntimeId, '首次入链 review 应继承主绑定 runtime')
  assert.equal(firstDraftPersonaId, firstDecisionPersonaId, '草稿 personaId 应继承 decision.personaId')
  assert.equal(first.json?.draft?.engine?.engineVersion, 'draft-engine-v1', '首次入链 draft 应记录草稿引擎版本')
  assert.equal(first.json?.draft?.engine?.selectedTemplate, 'high_intent_private_followup', '首次入链 draft 应命中高意图私聊模板')
  assert.equal(first.json?.draft?.strategy?.appliedRuleId, 'strategy_high_intent_private_followup', '首次入链 draft 应继承命中的策略规则')
  assert.equal(first.json?.draft?.ctaType, 'private_followup', '首次入链 draft ctaType 应为 private_followup')
  assert.ok(Array.isArray(first.json?.draft?.alternatives) && first.json.draft.alternatives.length >= 2, '首次入链 draft 应提供可选草稿')
  assert.match(first.json?.draft?.draftText ?? '', /收费/, '高意图询价草稿应回应收费上下文')
  assert.match(first.json?.draft?.draftText ?? '', /私聊/, '高意图询价草稿应低压引导私聊')
  assert.match(first.json?.draft?.styleNotes ?? '', /顾问号-A/, '草稿 styleNotes 应展示执行账号')
  assert.match(first.json?.draft?.styleNotes ?? '', /增长操盘手型/, '草稿 styleNotes 应展示执行人设')
  assert.match(first.json?.draft?.styleNotes ?? '', /草稿引擎/, '草稿 styleNotes 应展示草稿引擎模板')
  assert.ok(firstReviewId, '首次入链必须返回 review.id')
  assert.ok(firstMessageId, '首次入链必须返回 message.id')
  assert.ok(firstGroupId, '首次入链必须返回 message.groupId')
  assert.equal(first.json?.message?.rawPayload, null, 'Telegram inbound 不应在 message 中返回或持久化 rawPayload')
  assert.equal(String(first.json?.message?.platformUpdateId), String(uniqueId), 'Telegram inbound 应仅保留脱敏 update_id 作为 dedup key')
  assert.equal(String(first.json?.message?.platformMessageId), '9001', 'Telegram inbound 应仅保留脱敏 message_id')

  const second = await postTelegram(firstPayload, secret)
  assert.equal(second.status, 200, `重复 update_id 应返回 200，实际是 ${second.status}`)
  assert.equal(second.json?.ok, true)
  assert.equal(second.json?.deduplicated, true, '重复 update_id 应命中 deduplicated=true')
  assert.equal(String(second.json?.updateId), String(uniqueId), '返回的 updateId 应与请求一致')

  const callbackId = uniqueId + 1
  const callbackPayload = buildTelegramCallbackUpdate(callbackId)
  const callbackResult = await postTelegram(callbackPayload, secret)
  assert.equal(callbackResult.status, 200, `callback_query 入链应返回 200，实际是 ${callbackResult.status}`)
  assert.ok(callbackResult.json, 'callback_query 返回必须是 JSON')
  assert.equal(callbackResult.json?.message?.messageType, 'text', 'callback_query 当前应映射为 text')
  assert.ok(typeof callbackResult.json?.message?.text === 'string' && callbackResult.json.message.text.includes('合作方式'), 'callback_query 文本应来自 data')

  const groupUpdateId = uniqueId + 2
  const groupPayload = buildTelegramGroupMessageUpdate(groupUpdateId)
  const groupResult = await postTelegram(groupPayload, secret)
  assert.equal(groupResult.status, 200, `群聊消息入链应返回 200，实际是 ${groupResult.status}`)
  assert.ok(groupResult.json, '群聊消息返回必须是 JSON')
  assert.equal(groupResult.json?.message?.groupId, 'group_indie_hackers', '群聊消息应先映射到内部 groupId')
  assert.equal(groupResult.json?.runtime?.id, 'runtime_indie_a_growth', '群聊消息在配置 primaryRuntimeId 后应优先命中显式主绑定 runtime')

  const decisionList = await requestJson('/api/decisions?decision=dm_suggest&limit=10')
  assert.equal(decisionList.status, 200, `决策列表应返回 200，实际是 ${decisionList.status}`)
  assert.ok(Array.isArray(decisionList.json?.items), '决策列表 items 必须是数组')
  assert.ok(decisionList.json.items.some((item) => item.id === firstDecisionId), '决策列表中应包含首次入链生成的 decision')

  const groupList = await requestJson('/api/groups?primaryRuntimeId=runtime_indie_a_growth')
  assert.equal(groupList.status, 200, `群组列表应返回 200，实际是 ${groupList.status}`)
  assert.ok(Array.isArray(groupList.json?.items), '群组列表 items 必须是数组')
  const mappedGroup = groupList.json.items.find((item) => item.id === 'group_indie_hackers')
  assert.ok(mappedGroup, '按 primaryRuntimeId 过滤后的群组列表中应包含 group_indie_hackers')
  assert.equal(mappedGroup.primaryRuntimeId, 'runtime_indie_a_growth', '群组列表返回的 primaryRuntimeId 应与显式主绑定一致')

  const groupDetail = await requestJson('/api/groups/group_indie_hackers')
  assert.equal(groupDetail.status, 200, `群组详情应返回 200，实际是 ${groupDetail.status}`)
  assert.equal(groupDetail.json?.id, 'group_indie_hackers', '群组详情 id 应匹配')
  assert.equal(groupDetail.json?.primaryRuntimeId, 'runtime_indie_a_growth', '群组详情应直接暴露 primaryRuntimeId')

  const patchGroup = await requestJson('/api/groups/group_indie_hackers', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ primaryRuntimeId: patchedPrimaryRuntimeId }),
  })
  assert.equal(patchGroup.status, 200, `群组更新应返回 200，实际是 ${patchGroup.status}`)
  assert.equal(patchGroup.json?.id, 'group_indie_hackers', '群组更新返回 id 应匹配')
  assert.equal(patchGroup.json?.primaryRuntimeId, patchedPrimaryRuntimeId, '群组更新后应返回新的 primaryRuntimeId')

  const invalidPatchGroup = await requestJson('/api/groups/group_indie_hackers', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ primaryRuntimeId: invalidPrimaryRuntimeId }),
  })
  assert.equal(invalidPatchGroup.status, 400, `写入不存在的 runtime id 应返回 400，实际是 ${invalidPatchGroup.status}`)
  assert.ok(typeof invalidPatchGroup.json?.error === 'string' && invalidPatchGroup.json.error.includes(invalidPrimaryRuntimeId), '非法 runtime id 应返回包含该 id 的错误信息')

  const foreignRuntimePatchGroup = await requestJson('/api/groups/group_indie_hackers', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ primaryRuntimeId: foreignGroupRuntimeId }),
  })
  assert.equal(foreignRuntimePatchGroup.status, 400, `写入其他 group 的 runtime id 应返回 400，实际是 ${foreignRuntimePatchGroup.status}`)
  assert.ok(
    typeof foreignRuntimePatchGroup.json?.error === 'string' &&
      foreignRuntimePatchGroup.json.error.includes(foreignGroupRuntimeId) &&
      foreignRuntimePatchGroup.json.error.includes('group_indie_hackers'),
    '跨 group runtime 应返回包含 runtime id 与 group id 的错误信息',
  )

  const patchedGroupList = await requestJson(`/api/groups?primaryRuntimeId=${encodeURIComponent(patchedPrimaryRuntimeId)}`)
  assert.equal(patchedGroupList.status, 200, `更新后的群组列表应返回 200，实际是 ${patchedGroupList.status}`)
  assert.ok(Array.isArray(patchedGroupList.json?.items), '更新后的群组列表 items 必须是数组')
  assert.ok(patchedGroupList.json.items.some((item) => item.id === 'group_indie_hackers'), '更新后的群组列表中应包含 group_indie_hackers')

  const patchedGroupDetail = await requestJson('/api/groups/group_indie_hackers')
  assert.equal(patchedGroupDetail.status, 200, `更新后的群组详情应返回 200，实际是 ${patchedGroupDetail.status}`)
  assert.equal(patchedGroupDetail.json?.primaryRuntimeId, patchedPrimaryRuntimeId, '更新后的群组详情应暴露新的 primaryRuntimeId')

  const restoreGroup = await requestJson('/api/groups/group_indie_hackers', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ primaryRuntimeId: 'runtime_indie_a_growth' }),
  })
  assert.equal(restoreGroup.status, 200, `群组恢复应返回 200，实际是 ${restoreGroup.status}`)
  assert.equal(restoreGroup.json?.primaryRuntimeId, 'runtime_indie_a_growth', '群组恢复后应回到原始 primaryRuntimeId')

  const messageList = await requestJson(`/api/messages?groupId=${encodeURIComponent(firstGroupId)}&limit=10`)
  assert.equal(messageList.status, 200, `消息列表应返回 200，实际是 ${messageList.status}`)
  assert.ok(Array.isArray(messageList.json?.items), '消息列表 items 必须是数组')
  const firstMessage = messageList.json.items.find((item) => item.id === firstMessageId)
  assert.ok(firstMessage, '消息列表中应包含首次入链生成的 message')
  assert.equal(firstMessage.messageType, 'text', '消息列表中的首次 messageType 应为 text')
  assertArrayIncludesAll(firstMessage.signals, ['question', 'pricing', 'commercial_intent'], 'messageList.firstMessage.signals')

  const draftList = await requestJson(`/api/drafts?decisionId=${encodeURIComponent(firstDecisionId)}&limit=10`)
  assert.equal(draftList.status, 200, `草稿列表应返回 200，实际是 ${draftList.status}`)
  assert.ok(Array.isArray(draftList.json?.items), '草稿列表 items 必须是数组')
  const firstDraftFromList = draftList.json.items.find((item) => item.id === firstDraftId)
  assert.ok(firstDraftFromList, '草稿列表中应包含首次入链生成的 draft')
  assert.equal(firstDraftFromList?.personaId ?? null, firstDecisionPersonaId, '草稿列表中的 personaId 应与首次返回一致')
  assert.equal(firstDraftFromList?.engine?.selectedTemplate, 'high_intent_private_followup', '草稿列表应保留草稿引擎模板')
  assert.match(firstDraftFromList?.styleNotes ?? '', /顾问号-A/, '草稿列表 styleNotes 应展示执行账号')

  const decisionDetail = await requestJson(`/api/decisions/${encodeURIComponent(firstDecisionId)}`)
  assert.equal(decisionDetail.status, 200, `决策详情应返回 200，实际是 ${decisionDetail.status}`)
  assert.equal(decisionDetail.json?.id, firstDecisionId, '决策详情 id 应匹配')
  assert.equal(decisionDetail.json?.decision, 'dm_suggest', '决策详情 decision 应为 dm_suggest')
  assert.equal(decisionDetail.json?.engine?.selectedRule, 'high_intent_dm_suggest', '决策详情应保留决策引擎命中规则')
  assert.equal(decisionDetail.json?.strategy?.appliedRuleId, 'strategy_high_intent_private_followup', '决策详情应保留命中的策略规则')
  assert.match(decisionDetail.json?.reason ?? '', /决策引擎/, '决策详情 reason 应包含决策引擎说明')
  assert.equal(decisionDetail.json?.accountId, firstDecisionAccountId, '决策详情 accountId 应与首次返回一致')
  assert.equal(decisionDetail.json?.personaId, firstDecisionPersonaId, '决策详情 personaId 应与首次返回一致')
  assert.match(decisionDetail.json?.reason ?? '', /顾问号-A/, '决策详情 reason 应包含账号选择说明')
  assert.match(decisionDetail.json?.reason ?? '', /增长操盘手型/, '决策详情 reason 应包含人设选择说明')
  assertArrayIncludesAll(decisionDetail.json?.relatedSignals, ['question', 'pricing', 'commercial_intent'], 'decision.relatedSignals')

  const reviewQueue = await requestJson('/api/review/queue?status=pending')
  assert.equal(reviewQueue.status, 200, `审核队列应返回 200，实际是 ${reviewQueue.status}`)
  assert.ok(Array.isArray(reviewQueue.json?.items), '审核队列 items 必须是数组')
  const firstReview = reviewQueue.json.items.find((item) => item.id === firstReviewId)
  assert.ok(firstReview, '审核队列中应包含首次入链生成的 review')
  assert.equal(firstReview.runtimeId, firstReviewRuntimeId ?? 'runtime_unknown', '审核队列中的 runtimeId 应与首次返回一致')
  assert.equal(firstReview.accountId ?? null, firstDecisionAccountId, '审核队列应展示决策选择的账号')
  assert.equal(firstReview.personaId ?? null, firstDecisionPersonaId, '审核队列应展示决策选择的人设')
  assert.match(firstReview.styleNotes ?? '', /顾问号-A/, '审核队列 styleNotes 应展示执行账号')

  const approveReview = await requestJson(`/api/review/${encodeURIComponent(firstReviewId)}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      status: 'approved',
      comment: 'smoke 审核通过，仅记录待执行动作，不外发',
      actorId: 'smoke-reviewer',
      actorName: 'Smoke Reviewer',
    }),
  })
  assert.equal(approveReview.status, 200, `审核通过接口应返回 200，实际是 ${approveReview.status}`)
  assert.equal(approveReview.json?.ok, true, '审核通过接口应返回 ok=true')
  assert.equal(approveReview.json?.review?.status, 'approved', '审核通过后 review.status 应为 approved')
  const actionTrace = approveReview.json?.traceItems?.review?.find((item) => item.type === 'action_executed')
  assert.ok(actionTrace, '审核通过后应生成 action_executed 待执行记录')
  assert.equal(actionTrace?.after?.externalSent, false, '待执行记录必须标记 externalSent=false，smoke 不允许外发')
  assert.ok(typeof actionTrace?.after?.outboundJobId === 'string' && actionTrace.after.outboundJobId.startsWith('outbound_job_'), '审核通过后应关联 dry-run outbound job')
  assert.equal(actionTrace?.after?.outboundJobMode, 'dry_run', '审核通过后 outbound job 必须保持 dry-run 模式')
  assert.equal(actionTrace?.after?.externalSendAllowed, false, '本地 smoke 不允许真实外发')
  assert.equal(actionTrace?.after?.outboundGuardDecision, 'allow_dry_run', '本地 smoke 应通过 dry-run guard 评估')
  assert.equal(actionTrace?.after?.outboundEnvironmentMode, 'local', '本地 smoke 应标记 outbound guard 环境为 local')
  assert.deepEqual(actionTrace?.after?.outboundGuardBlockingReasons ?? [], [], '本地 dry-run guard 不应产生阻断原因')
  assert.equal(actionTrace?.after?.accountId ?? null, firstDecisionAccountId, '待执行记录应保留执行账号')
  assert.equal(actionTrace?.after?.personaId ?? null, firstDecisionPersonaId, '待执行记录应保留执行人设')
  assert.ok(typeof actionTrace?.after?.finalActionText === 'string' && actionTrace.after.finalActionText.length > 0, '待执行记录应包含最终动作文本')

  const outboundJobId = actionTrace?.after?.outboundJobId
  const outboundJobList = await requestJson('/api/outbound-jobs?mode=dry_run&status=guarded')
  assert.equal(outboundJobList.status, 200, `outbound job 队列应返回 200，实际是 ${outboundJobList.status}`)
  assert.ok(Array.isArray(outboundJobList.json?.items), 'outbound job 队列 items 必须是数组')
  const firstOutboundJob = outboundJobList.json.items.find((item) => item.id === outboundJobId)
  assert.ok(firstOutboundJob, 'outbound job 队列应包含审核通过生成的 dry-run job')
  assert.equal(firstOutboundJob.mode, 'dry_run', 'outbound job 队列中 job 必须保持 dry-run')
  assert.equal(firstOutboundJob.status, 'guarded', 'outbound job 队列中 job 必须保持 guarded')
  assert.equal(firstOutboundJob.externalSent, false, 'outbound job 队列中 job 不允许标记真实外发')
  assert.equal(firstOutboundJob.guardResult?.externalSendAllowed, false, 'outbound job guard 不允许真实外发')
  assert.equal(firstOutboundJob.guardResult?.decision, 'allow_dry_run', 'outbound job guard 应为 allow_dry_run')
  assert.equal(firstOutboundJob.guardResult?.environmentMode, 'local', 'outbound job guard 环境应为 local')
  assert.ok(Array.isArray(firstOutboundJob.guardResult?.blockingReasons), 'outbound job guard blockingReasons 必须是数组')
  assert.equal(firstOutboundJob.guardResult.blockingReasons.length, 0, 'local dry-run outbound job 不应有阻断原因')
  assert.ok(firstOutboundJob.guardResult.reasons.includes('local_mode_dry_run_only'), 'outbound job guard reasons 应包含 local_mode_dry_run_only')

  const outboundJobDetail = await requestJson(`/api/outbound-jobs/${encodeURIComponent(outboundJobId)}`)
  assert.equal(outboundJobDetail.status, 200, `outbound job 详情应返回 200，实际是 ${outboundJobDetail.status}`)
  assert.equal(outboundJobDetail.json?.id, outboundJobId, 'outbound job 详情 id 应匹配')
  assert.equal(outboundJobDetail.json?.reviewId, firstReviewId, 'outbound job 详情应关联审核项')
  assert.equal(outboundJobDetail.json?.guardResult?.externalSendAllowed, false, 'outbound job 详情应保持真实外发关闭')
  assert.equal(outboundJobDetail.json?.guardResult?.environmentMode, 'local', 'outbound job 详情应暴露 local 环境模式')
  assert.ok(typeof outboundJobDetail.json?.guardResult?.summary === 'string' && outboundJobDetail.json.guardResult.summary.includes('Local environment'), 'outbound job 详情应暴露 guard summary')

  const outboundGuardDiagnostics = await requestJson('/api/outbound-guard')
  assert.equal(outboundGuardDiagnostics.status, 200, `outbound guard 诊断 API 应返回 200，实际是 ${outboundGuardDiagnostics.status}`)
  assert.equal(outboundGuardDiagnostics.json?.environmentMode, 'local', 'outbound guard 诊断应暴露 local 环境模式')
  assert.equal(outboundGuardDiagnostics.json?.senderConfigured, false, '本地 smoke 默认不应配置真实 sender')
  assert.equal(outboundGuardDiagnostics.json?.productionOutboundEnabled, false, '本地 smoke 默认不应启用生产外发')
  assert.equal(outboundGuardDiagnostics.json?.externalSendPossible, false, '本地 smoke 不允许真实外发可能性')
  assert.equal(outboundGuardDiagnostics.json?.defaultDecision?.externalSendAllowed, false, 'outbound guard 默认决策不允许真实外发')
  assert.equal(outboundGuardDiagnostics.json?.defaultDecision?.decision, 'allow_dry_run', 'outbound guard local 默认决策应为 allow_dry_run')
  assert.ok(Array.isArray(outboundGuardDiagnostics.json?.nextActions), 'outbound guard 诊断应返回 nextActions')
  assert.ok(outboundGuardDiagnostics.json.nextActions.some((action) => action.key === 'keep_local_dry_run_guard'), 'outbound guard local 诊断应建议保持 dry-run guard')

  let firstRuntime = null
  let runtimeRestrictionStatus = null
  const analytics = await requestJson('/api/god-plan/analytics')
  assert.equal(analytics.status, 200, `Analytics API 应返回 200，实际是 ${analytics.status}`)
  assert.ok((analytics.json?.totals?.messages ?? 0) >= 3, 'Analytics 应统计入链消息数量')
  assert.ok((analytics.json?.totals?.decisions ?? 0) >= 3, 'Analytics 应统计决策数量')
  assert.ok(Array.isArray(analytics.json?.funnel), 'Analytics funnel 必须是数组')
  const funnelPendingExecutionStep = analytics.json.funnel.find((item) => item.key === 'pending_execution_traces')
  assert.ok(funnelPendingExecutionStep, 'Analytics funnel 应包含待执行 trace 节点')
  assert.ok((funnelPendingExecutionStep.count ?? 0) >= 1, 'Analytics funnel 应统计审核通过后的待执行 trace')
  assert.ok((funnelPendingExecutionStep.ratioFromMessages ?? 0) > 0, 'Analytics funnel 应提供消息到待执行 trace 的转化率')
  assert.ok(Array.isArray(analytics.json?.recentActivity), 'Analytics recentActivity 必须是数组')
  assert.ok(analytics.json.recentActivity.some((item) => item.type === 'action_executed' && item.externalSent === false), 'Analytics recentActivity 应展示未外发的待执行 trace')
  assert.ok(analytics.json.recentActivity.some((item) => item.type === 'action_executed' && item.externalSent === false && typeof item.href === 'string' && item.href.length > 0), 'Analytics recentActivity 中的待执行 trace 应提供关联对象链接')
  assert.equal(analytics.json?.health?.status, 'ok', '隔离 smoke DB 下 Analytics 整体健康状态应为 ok')
  assert.equal(analytics.json?.localTestingReadiness?.status, 'ready', '隔离 smoke DB 下本地测试就绪状态应为 ready')
  assert.equal(analytics.json?.localTestingReadiness?.canRunLocalTests, true, '隔离 smoke DB 下本地测试应允许继续')
  assert.ok(Array.isArray(analytics.json?.localTestingReadiness?.checks), 'Analytics 应返回本地测试就绪检查列表')
  assert.equal(analytics.json.localTestingReadiness.checks.every((check) => check.passed === true), true, '隔离 smoke DB 下本地测试就绪检查应全部通过')
  assert.equal(analytics.json.localTestingReadiness.blockers.length, 0, '隔离 smoke DB 下本地测试就绪不应有 blockers')
  assert.ok(Array.isArray(analytics.json.localTestingReadiness.nextActions), 'Analytics 应返回本地测试下一步动作列表')
  assert.ok(analytics.json.localTestingReadiness.nextActions.some((action) => action.key === 'continue_local_acceptance' && action.priority === 'low'), '本地测试 ready 时应建议继续本地验收')
  assert.ok(analytics.json.localTestingReadiness.nextActions.some((action) => action.key === 'inspect_review_queue_before_send' && action.href === '/review'), '本地测试 ready 时应提示外发前先检查审核队列')
  assert.equal(analytics.json?.productionRobotReadiness?.status, 'local_only', '本地 smoke 下生产机器人就绪度应为 local_only')
  assert.equal(analytics.json.productionRobotReadiness.canRunProductionRobot, false, '本地 smoke 不允许声明可运行生产机器人')
  assert.ok(Array.isArray(analytics.json.productionRobotReadiness.checks), 'Analytics 应返回生产机器人就绪检查列表')
  assert.ok(analytics.json.productionRobotReadiness.blockers.includes('non_local_environment_configured'), '生产机器人就绪度应暴露 local 环境 blocker')
  assert.ok(analytics.json.productionRobotReadiness.blockers.includes('sender_configured'), '生产机器人就绪度应暴露 sender 配置 blocker')
  const productionPersistenceCheck = analytics.json.productionRobotReadiness.checks.find((check) => check.key === 'production_persistence_not_file_backed')
  assert.ok(productionPersistenceCheck, '生产机器人就绪度应包含生产持久化检查')
  assert.equal(productionPersistenceCheck.category, 'persistence', '生产持久化检查应归类为 persistence')
  assert.equal(productionPersistenceCheck.priority, 'high', '生产持久化检查应为 high priority')
  assert.ok(productionPersistenceCheck.recommendedAction.includes('database schema'), '生产持久化检查应提供数据库迁移动作')
  const queueRollbackCheck = analytics.json.productionRobotReadiness.checks.find((check) => check.key === 'queue_retry_and_rollback_defined')
  assert.ok(queueRollbackCheck, '生产机器人就绪度应包含队列重试与回滚检查')
  assert.equal(queueRollbackCheck.category, 'queue', '队列重试与回滚检查应归类为 queue')
  assert.ok(queueRollbackCheck.recommendedAction.includes('idempotency'), '队列重试与回滚检查应提示幂等键')
  const accountRiskCheck = analytics.json.productionRobotReadiness.checks.find((check) => check.key === 'rate_limit_and_account_risk_controls_defined')
  assert.ok(accountRiskCheck, '生产机器人就绪度应包含账号风控检查')
  assert.equal(accountRiskCheck.category, 'account_risk', '账号风控检查应归类为 account_risk')
  assert.ok(accountRiskCheck.recommendedAction.includes('cooldowns'), '账号风控检查应提示冷却控制')
  assert.ok(Array.isArray(analytics.json.productionRobotReadiness.nextActions), 'Analytics 应返回生产机器人下一步动作列表')
  assert.ok(analytics.json.productionRobotReadiness.nextActions.some((action) => action.key === 'keep_current_package_local_only'), 'local_only 时应提示保持本地包 local-only')
  assert.ok(typeof analytics.json?.health?.summary === 'string' && analytics.json.health.summary.length > 0, 'Analytics 整体健康状态应提供摘要')
  assert.equal(analytics.json?.health?.criticalCount, 0, '隔离 smoke DB 下 Analytics critical 健康信号数应为 0')
  assert.equal(analytics.json?.health?.warningCount, 0, '隔离 smoke DB 下 Analytics warning 健康信号数应为 0')
  assert.equal(typeof analytics.json?.health?.activeSignalCount, 'number', 'Analytics health 应返回 activeSignalCount')
  assert.equal(analytics.json?.health?.hasBlockingSignals, false, '隔离 smoke DB 下 Analytics 不应存在 blocking 健康信号')
  assert.ok(Array.isArray(analytics.json?.health?.blockingSignalKeys), 'Analytics health 应返回 blockingSignalKeys')
  assert.equal(analytics.json.health.blockingSignalKeys.length, 0, '隔离 smoke DB 下 Analytics blockingSignalKeys 应为空')
  assert.ok(Array.isArray(analytics.json?.health?.activeSignalKeys), 'Analytics health 应返回 activeSignalKeys')
  assert.equal(analytics.json.health.activeSignalCount, analytics.json.health.activeSignalKeys.length, 'Analytics health activeSignalCount 应等于 activeSignalKeys 长度')
  assert.equal(analytics.json.health.activeSignalKeys.includes('runtime_unknown'), false, '隔离 smoke DB 下 Analytics activeSignalKeys 不应包含 runtime_unknown')
  assert.equal(analytics.json.health.activeSignalKeys.includes('external_send_guard'), false, '隔离 smoke DB 下 Analytics activeSignalKeys 不应包含 external_send_guard')

  assert.ok(Array.isArray(analytics.json?.dataQuality), 'Analytics dataQuality 必须是数组')
  const runtimeUnknownSignal = analytics.json.dataQuality.find((item) => item.key === 'runtime_unknown')
  assert.ok(runtimeUnknownSignal, 'Analytics dataQuality 应返回 runtime_unknown 健康信号')
  assert.equal(runtimeUnknownSignal.count ?? 0, 0, '隔离 smoke DB 下 runtime_unknown 健康信号应为 0')
  assert.equal(runtimeUnknownSignal.href, '/runtime', 'Analytics runtime_unknown 健康信号应提供 runtime 定位链接')
  assert.equal(runtimeUnknownSignal.actionPriority, 'none', 'runtime_unknown 为 0 时不应要求处理动作')
  assert.ok(typeof runtimeUnknownSignal.recommendedAction === 'string' && runtimeUnknownSignal.recommendedAction.length > 0, 'runtime_unknown 健康信号应提供推荐处理动作')
  const externalSendGuardSignal = analytics.json.dataQuality.find((item) => item.key === 'external_send_guard')
  assert.ok(externalSendGuardSignal, 'Analytics dataQuality 应返回外发护栏信号')
  assert.equal(externalSendGuardSignal.count, 0, 'Analytics dataQuality 外发护栏计数应为 0')
  assert.equal(externalSendGuardSignal.actionPriority, 'none', '外发护栏为 0 时不应要求处理动作')
  assert.ok(externalSendGuardSignal.recommendedAction.includes('pending execution traces'), '外发护栏健康信号应提示继续保持内部待执行 trace')
  assert.equal(externalSendGuardSignal.href, '/review', 'Analytics 外发护栏信号应提供审核队列定位链接')
  assert.ok(Array.isArray(analytics.json?.strategyRules), 'Analytics strategyRules 必须是数组')
  assert.ok(analytics.json.strategyRules.some((item) => item.appliedRuleId === 'strategy_high_intent_private_followup' && item.count >= 1), 'Analytics 应统计高意图策略规则命中')
  assert.ok(Array.isArray(analytics.json?.strategyRuleCatalog), 'Analytics strategyRuleCatalog 必须是数组')
  assert.equal(analytics.json.strategyRuleCatalog[0]?.id, 'strategy_high_intent_private_followup', 'Analytics 策略规则库应将最近命中的高意图规则置顶')
  assert.equal(analytics.json.strategyRuleCatalog[0]?.displayRank, 1, 'Analytics 策略规则库顶部规则应返回 displayRank=1')
  assert.equal(analytics.json.strategyRuleCatalog[0]?.rankReason, 'recent_match', 'Analytics 策略规则库顶部规则应说明置顶原因为最近命中')
  const highIntentRuleCatalogItem = analytics.json.strategyRuleCatalog.find((item) => item.id === 'strategy_high_intent_private_followup')
  assert.ok(highIntentRuleCatalogItem, 'Analytics 应返回高意图策略规则配置')
  assert.equal(highIntentRuleCatalogItem.matched, true, 'Analytics 策略规则库应标记高意图规则已命中')
  assert.equal(highIntentRuleCatalogItem.displayRank, 1, 'Analytics 策略规则库应返回高意图规则展示排名')
  assert.equal(highIntentRuleCatalogItem.rankReason, 'recent_match', 'Analytics 策略规则库应返回高意图规则排序原因')
  assert.ok(typeof highIntentRuleCatalogItem.recommendedFollowUp === 'string' && highIntentRuleCatalogItem.recommendedFollowUp.length > 0, 'Analytics 策略规则库应返回高意图规则后续建议')
  assert.equal(highIntentRuleCatalogItem.recommendedFollowUpHref, '/review', 'Analytics 高意图规则存在待执行 trace 时应建议进入审核队列')
  assert.equal(highIntentRuleCatalogItem.recommendedFollowUpKind, 'review', 'Analytics 高意图规则存在待执行 trace 时应返回 review 类型后续建议')
  assert.equal(highIntentRuleCatalogItem.recommendedFollowUpLabel, 'Review queue', 'Analytics 高意图规则存在待执行 trace 时应返回可读的后续建议标签')
  assert.equal(highIntentRuleCatalogItem.needsAttention, true, 'Analytics 高意图规则存在待执行 trace 时应标记需要关注')
  assert.equal(highIntentRuleCatalogItem.attentionReason, 'pending_execution_trace', 'Analytics 高意图规则应说明需要关注的原因为待执行 trace')
  assert.equal(highIntentRuleCatalogItem.attentionLabel, 'Review pending trace', 'Analytics 高意图规则存在待执行 trace 时应返回可读的关注标签')
  assert.equal(highIntentRuleCatalogItem.attentionCategory, 'review', 'Analytics 高意图规则存在待执行 trace 时应返回 review 关注分类')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryLabel, 'Review', 'Analytics 高意图规则存在待执行 trace 时应返回可读的关注分类标签')
  assert.ok(typeof highIntentRuleCatalogItem.attentionCategorySummary === 'string' && highIntentRuleCatalogItem.attentionCategorySummary.includes('human inspection'), 'Analytics 高意图规则应返回可读的关注分类说明')
  assert.ok(typeof highIntentRuleCatalogItem.attentionCategoryAction === 'string' && highIntentRuleCatalogItem.attentionCategoryAction.includes('review queue'), 'Analytics 高意图规则应返回可读的关注分类动作建议')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionKind, 'review_queue', 'Analytics 高意图规则存在待执行 trace 时应返回稳定的关注分类动作类型')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionHref, '/review', 'Analytics 高意图规则存在待执行 trace 时应返回关注分类动作入口')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionPriority, 'high', 'Analytics 高意图规则存在待执行 trace 时应返回高优先级关注分类动作')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionPriorityRank, 3, 'Analytics 高意图规则存在待执行 trace 时应返回高优先级关注分类动作排序值')
  assert.ok(typeof highIntentRuleCatalogItem.attentionCategoryActionPriorityReason === 'string' && highIntentRuleCatalogItem.attentionCategoryActionPriorityReason.includes('pending execution trace'), 'Analytics 高意图规则存在待执行 trace 时应返回可解释的关注分类动作优先级原因')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionPriorityLabel, 'High priority', 'Analytics 高意图规则存在待执行 trace 时应返回可读的关注分类动作优先级标签')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionBadge, 'urgent', 'Analytics 高意图规则存在待执行 trace 时应返回紧急关注分类动作徽标')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionBadgeLabel, 'Urgent', 'Analytics 高意图规则存在待执行 trace 时应返回可读的关注分类动作徽标标签')
  assert.ok(typeof highIntentRuleCatalogItem.attentionCategoryActionBadgeSummary === 'string' && highIntentRuleCatalogItem.attentionCategoryActionBadgeSummary.includes('human review'), 'Analytics 高意图规则存在待执行 trace 时应返回可读的关注分类动作徽标说明')
  assert.ok(typeof highIntentRuleCatalogItem.attentionCategoryActionBadgeAriaLabel === 'string' && highIntentRuleCatalogItem.attentionCategoryActionBadgeAriaLabel.includes('Urgent attention'), 'Analytics 高意图规则存在待执行 trace 时应返回可读的关注分类动作徽标无障碍标签')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionBadgeIcon, 'alert', 'Analytics 高意图规则存在待执行 trace 时应返回稳定的关注分类动作徽标图标 token')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionDisplayGroup, 'human_review', 'Analytics 高意图规则存在待执行 trace 时应返回稳定的人审展示分组')
  assert.equal(highIntentRuleCatalogItem.attentionCategoryActionLabel, 'Review queue', 'Analytics 高意图规则存在待执行 trace 时应返回可读的关注分类动作标签')
  assert.ok(typeof highIntentRuleCatalogItem.attentionSummary === 'string' && highIntentRuleCatalogItem.attentionSummary.includes('pending execution trace'), 'Analytics 高意图规则应返回可读的关注原因说明')
  assert.equal(highIntentRuleCatalogItem.attentionSeverity, 'warning', 'Analytics 高意图规则存在待执行 trace 时应标记 warning 关注级别')
  assert.ok((highIntentRuleCatalogItem.hitCount ?? 0) >= 1, 'Analytics 策略规则库应统计高意图规则命中次数')
  assert.ok((highIntentRuleCatalogItem.reviewCount ?? 0) >= 1, 'Analytics 策略规则库应统计规则关联 review 数量')
  assert.ok((highIntentRuleCatalogItem.approvedReviewCount ?? 0) >= 1, 'Analytics 策略规则库应统计规则关联审核通过数量')
  assert.ok((highIntentRuleCatalogItem.pendingExecutionCount ?? 0) >= 1, 'Analytics 策略规则库应统计规则关联待执行 trace 数量')
  assert.ok((highIntentRuleCatalogItem.approvalRate ?? 0) > 0, 'Analytics 策略规则库应统计规则审核通过率')
  assert.ok(typeof highIntentRuleCatalogItem.lastMatchedAt === 'string' && highIntentRuleCatalogItem.lastMatchedAt.length > 0, 'Analytics 策略规则库应返回高意图规则最近命中时间')
  assert.equal(new Date(highIntentRuleCatalogItem.lastMatchedAt).toString() === 'Invalid Date', false, 'Analytics 策略规则库最近命中时间应可解析')
  assert.equal(highIntentRuleCatalogItem.isRecentlyMatched, true, 'Analytics 策略规则库应标记高意图规则为最近命中')
  assert.ok(analytics.json.strategyRuleCatalog.some((item) => item.id === 'strategy_risk_sensitive_handoff' && item.matched === false), 'Analytics 策略规则库应展示未命中的风险兜底规则')
  assert.equal(analytics.json?.safety?.externalSentCount, 0, 'Analytics 应确认 smoke 链路未发生外发')
  assert.ok((analytics.json?.safety?.pendingExecutionCount ?? 0) >= 1, 'Analytics 应统计审核通过后的待执行记录')
  assert.ok((analytics.json?.safety?.outboundJobCount ?? 0) >= 1, 'Analytics 应统计 dry-run outbound job')
  assert.ok((analytics.json?.safety?.dryRunOutboundJobCount ?? 0) >= 1, 'Analytics 应统计 dry-run outbound job 数量')
  assert.ok((analytics.json?.safety?.guardedOutboundJobCount ?? 0) >= 1, 'Analytics 应统计 guarded outbound job 数量')

  if (first.json?.runtime?.id) {
    const runtimeDetail = await requestJson(`/api/runtime/${encodeURIComponent(first.json.runtime.id)}`)
    assert.equal(runtimeDetail.status, 200, `runtime 详情应返回 200，实际是 ${runtimeDetail.status}`)
    assert.equal(runtimeDetail.json?.id, first.json.runtime.id, 'runtime 详情 id 应匹配')
    runtimeRestrictionStatus = runtimeDetail.json?.restrictionStatus ?? null

    const runtimeQueue = await requestJson('/api/runtime/queue?queue=review')
    assert.equal(runtimeQueue.status, 200, `runtime 队列应返回 200，实际是 ${runtimeQueue.status}`)
    assert.ok(Array.isArray(runtimeQueue.json?.items), 'runtime 队列 items 必须是数组')
    firstRuntime = runtimeQueue.json.items.find((item) => item.id === first.json.runtime.id) ?? null
    if (!firstRuntime) {
      const runtimeList = await requestJson('/api/runtime')
      assert.equal(runtimeList.status, 200, `runtime 列表应返回 200，实际是 ${runtimeList.status}`)
      assert.ok(Array.isArray(runtimeList.json?.items), 'runtime 列表 items 必须是数组')
      firstRuntime = runtimeList.json.items.find((item) => item.id === first.json.runtime.id) ?? null
    }
    assert.ok(firstRuntime, 'runtime 列表中应包含首次入链命中的 runtime')
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    updateId: uniqueId,
    missingTokenStatus: missingToken.status,
    unauthorizedStatus: unauthorized.status,
    firstDecision: first.json?.decision?.decision,
    firstDecisionId,
    firstDraftId,
    firstDecisionAccountId,
    firstDecisionPersonaId,
    firstDecisionEngineRule: first.json?.decision?.engine?.selectedRule ?? null,
    firstDecisionReviewGate: first.json?.decision?.engine?.reviewGate ?? null,
    firstStrategyRule: first.json?.decision?.strategy?.appliedRuleId ?? null,
    firstDraftEngineTemplate: first.json?.draft?.engine?.selectedTemplate ?? null,
    firstDraftCtaType: first.json?.draft?.ctaType ?? null,
    firstDraftPersonaId,
    firstReviewId,
    firstReviewRuntimeId,
    firstRuntimeId,
    firstSignals: first.json?.message?.signals,
    firstIntentLevel: first.json?.context?.intelligence?.intentLevel ?? null,
    firstIntentScore: first.json?.context?.intelligence?.intentScore ?? null,
    firstRiskScore: first.json?.context?.intelligence?.riskScore ?? null,
    firstTemperature: first.json?.context?.intelligence?.temperature ?? null,
    deduplicated: second.json?.deduplicated,
    callbackMessageType: callbackResult.json?.message?.messageType,
    listMessageFound: Boolean(firstMessage),
    listDecisionFound: decisionList.json.items.some((item) => item.id === firstDecisionId),
    listGroupFound: Boolean(mappedGroup),
    groupPrimaryRuntimeId: groupDetail.json?.primaryRuntimeId ?? null,
    patchedGroupPrimaryRuntimeId: patchedGroupDetail.json?.primaryRuntimeId ?? null,
    invalidPatchStatus: invalidPatchGroup.status,
    invalidPatchError: invalidPatchGroup.json?.error ?? null,
    foreignRuntimePatchStatus: foreignRuntimePatchGroup.status,
    foreignRuntimePatchError: foreignRuntimePatchGroup.json?.error ?? null,
    listDraftFound: draftList.json.items.some((item) => item.id === firstDraftId),
    reviewFound: Boolean(firstReview),
    reviewApproved: approveReview.json?.review?.status === 'approved',
    actionTraceFound: Boolean(actionTrace),
    actionTraceExternalSent: actionTrace?.after?.externalSent ?? null,
    analyticsStrategyRuleFound: analytics.json.strategyRules.some((item) => item.appliedRuleId === 'strategy_high_intent_private_followup'),
    analyticsFunnelPendingExecutionCount: funnelPendingExecutionStep?.count ?? null,
    analyticsRecentActivitySize: analytics.json.recentActivity.length,
    analyticsActionTraceVisible: analytics.json.recentActivity.some((item) => item.type === 'action_executed' && item.externalSent === false),
    analyticsActionTraceHrefFound: analytics.json.recentActivity.some((item) => item.type === 'action_executed' && item.externalSent === false && typeof item.href === 'string' && item.href.length > 0),
    outboundJobQueueFound: Boolean(firstOutboundJob),
    outboundJobDetailFound: outboundJobDetail.json?.id === outboundJobId,
    outboundJobExternalSendAllowed: outboundJobDetail.json?.guardResult?.externalSendAllowed ?? null,
    outboundJobGuardEnvironmentMode: outboundJobDetail.json?.guardResult?.environmentMode ?? null,
    outboundJobGuardBlockingReasonCount: outboundJobDetail.json?.guardResult?.blockingReasons?.length ?? null,
    outboundGuardDiagnosticsEnvironmentMode: outboundGuardDiagnostics.json?.environmentMode ?? null,
    outboundGuardDiagnosticsExternalSendPossible: outboundGuardDiagnostics.json?.externalSendPossible ?? null,
    analyticsHealthStatus: analytics.json?.health?.status ?? null,
    analyticsLocalTestingReadinessStatus: analytics.json?.localTestingReadiness?.status ?? null,
    analyticsLocalTestingReadinessCanRun: analytics.json?.localTestingReadiness?.canRunLocalTests ?? null,
    analyticsLocalTestingReadinessBlockerCount: analytics.json?.localTestingReadiness?.blockers?.length ?? null,
    analyticsLocalTestingReadinessCheckCount: analytics.json?.localTestingReadiness?.checks?.length ?? null,
    analyticsLocalTestingReadinessNextActionCount: analytics.json?.localTestingReadiness?.nextActions?.length ?? null,
    analyticsLocalTestingReadinessNextActionKeys: analytics.json?.localTestingReadiness?.nextActions?.map((action) => action.key) ?? null,
    analyticsProductionRobotReadinessStatus: analytics.json?.productionRobotReadiness?.status ?? null,
    analyticsProductionRobotReadinessCanRun: analytics.json?.productionRobotReadiness?.canRunProductionRobot ?? null,
    analyticsProductionRobotReadinessBlockerCount: analytics.json?.productionRobotReadiness?.blockers?.length ?? null,
    analyticsProductionRobotReadinessCheckCount: analytics.json?.productionRobotReadiness?.checks?.length ?? null,
    analyticsProductionRobotReadinessNextActionKeys: analytics.json?.productionRobotReadiness?.nextActions?.map((action) => action.key) ?? null,
    analyticsProductionRobotReadinessCheckCategories: analytics.json?.productionRobotReadiness?.checks?.map((check) => `${check.key}:${check.category}:${check.priority}`) ?? null,
    analyticsProductionRobotPersistenceAction: analytics.json?.productionRobotReadiness?.checks?.find((check) => check.key === 'production_persistence_not_file_backed')?.recommendedAction ?? null,
    analyticsProductionRobotQueueAction: analytics.json?.productionRobotReadiness?.checks?.find((check) => check.key === 'queue_retry_and_rollback_defined')?.recommendedAction ?? null,
    analyticsProductionRobotAccountRiskAction: analytics.json?.productionRobotReadiness?.checks?.find((check) => check.key === 'rate_limit_and_account_risk_controls_defined')?.recommendedAction ?? null,
    analyticsHealthCriticalCount: analytics.json?.health?.criticalCount ?? null,
    analyticsHealthWarningCount: analytics.json?.health?.warningCount ?? null,
    analyticsHealthActiveSignalCount: analytics.json?.health?.activeSignalCount ?? null,
    analyticsHealthHasBlockingSignals: analytics.json?.health?.hasBlockingSignals ?? null,
    analyticsHealthBlockingSignalCount: analytics.json?.health?.blockingSignalKeys?.length ?? null,

    analyticsRuntimeUnknownSignalCount: runtimeUnknownSignal?.count ?? null,
    analyticsRuntimeUnknownHref: runtimeUnknownSignal?.href ?? null,
    analyticsExternalSendGuardCount: externalSendGuardSignal?.count ?? null,
    analyticsExternalSendGuardHref: externalSendGuardSignal?.href ?? null,
    analyticsRuntimeUnknownActionPriority: runtimeUnknownSignal?.actionPriority ?? null,
    analyticsExternalSendGuardActionPriority: externalSendGuardSignal?.actionPriority ?? null,
    analyticsStrategyRuleCatalogSize: analytics.json.strategyRuleCatalog.length,
    analyticsTopStrategyRuleId: analytics.json.strategyRuleCatalog[0]?.id ?? null,
    analyticsHighIntentRuleDisplayRank: highIntentRuleCatalogItem?.displayRank ?? null,
    analyticsHighIntentRuleRankReason: highIntentRuleCatalogItem?.rankReason ?? null,
    analyticsHighIntentRuleFollowUpHref: highIntentRuleCatalogItem?.recommendedFollowUpHref ?? null,
    analyticsHighIntentRuleFollowUpKind: highIntentRuleCatalogItem?.recommendedFollowUpKind ?? null,
    analyticsHighIntentRuleFollowUpLabel: highIntentRuleCatalogItem?.recommendedFollowUpLabel ?? null,
    analyticsHighIntentRuleNeedsAttention: highIntentRuleCatalogItem?.needsAttention ?? null,
    analyticsHighIntentRuleAttentionReason: highIntentRuleCatalogItem?.attentionReason ?? null,
    analyticsHighIntentRuleAttentionLabel: highIntentRuleCatalogItem?.attentionLabel ?? null,
    analyticsHighIntentRuleAttentionCategory: highIntentRuleCatalogItem?.attentionCategory ?? null,
    analyticsHighIntentRuleAttentionCategoryLabel: highIntentRuleCatalogItem?.attentionCategoryLabel ?? null,
    analyticsHighIntentRuleAttentionCategorySummary: highIntentRuleCatalogItem?.attentionCategorySummary ?? null,
    analyticsHighIntentRuleAttentionCategoryAction: highIntentRuleCatalogItem?.attentionCategoryAction ?? null,
    analyticsHighIntentRuleAttentionCategoryActionKind: highIntentRuleCatalogItem?.attentionCategoryActionKind ?? null,
    analyticsHighIntentRuleAttentionCategoryActionHref: highIntentRuleCatalogItem?.attentionCategoryActionHref ?? null,
    analyticsHighIntentRuleAttentionCategoryActionPriority: highIntentRuleCatalogItem?.attentionCategoryActionPriority ?? null,
    analyticsHighIntentRuleAttentionCategoryActionPriorityRank: highIntentRuleCatalogItem?.attentionCategoryActionPriorityRank ?? null,
    analyticsHighIntentRuleAttentionCategoryActionPriorityReason: highIntentRuleCatalogItem?.attentionCategoryActionPriorityReason ?? null,
    analyticsHighIntentRuleAttentionCategoryActionPriorityLabel: highIntentRuleCatalogItem?.attentionCategoryActionPriorityLabel ?? null,
    analyticsHighIntentRuleAttentionCategoryActionBadge: highIntentRuleCatalogItem?.attentionCategoryActionBadge ?? null,
    analyticsHighIntentRuleAttentionCategoryActionBadgeLabel: highIntentRuleCatalogItem?.attentionCategoryActionBadgeLabel ?? null,
    analyticsHighIntentRuleAttentionCategoryActionBadgeSummary: highIntentRuleCatalogItem?.attentionCategoryActionBadgeSummary ?? null,
    analyticsHighIntentRuleAttentionCategoryActionBadgeAriaLabel: highIntentRuleCatalogItem?.attentionCategoryActionBadgeAriaLabel ?? null,
    analyticsHighIntentRuleAttentionCategoryActionBadgeIcon: highIntentRuleCatalogItem?.attentionCategoryActionBadgeIcon ?? null,
    analyticsHighIntentRuleAttentionCategoryActionDisplayGroup: highIntentRuleCatalogItem?.attentionCategoryActionDisplayGroup ?? null,
    analyticsHighIntentRuleAttentionCategoryActionLabel: highIntentRuleCatalogItem?.attentionCategoryActionLabel ?? null,
    analyticsHighIntentRuleAttentionSummary: highIntentRuleCatalogItem?.attentionSummary ?? null,
    analyticsHighIntentRuleAttentionSeverity: highIntentRuleCatalogItem?.attentionSeverity ?? null,
    analyticsHighIntentRuleReviewCount: highIntentRuleCatalogItem?.reviewCount ?? null,
    analyticsHighIntentRuleApprovedReviewCount: highIntentRuleCatalogItem?.approvedReviewCount ?? null,
    analyticsHighIntentRulePendingExecutionCount: highIntentRuleCatalogItem?.pendingExecutionCount ?? null,
    analyticsHighIntentRuleApprovalRate: highIntentRuleCatalogItem?.approvalRate ?? null,
    analyticsHighIntentRuleLastMatchedAt: highIntentRuleCatalogItem?.lastMatchedAt ?? null,
    analyticsHighIntentRuleIsRecentlyMatched: highIntentRuleCatalogItem?.isRecentlyMatched ?? null,
    analyticsUnmatchedRiskRuleFound: analytics.json.strategyRuleCatalog.some((item) => item.id === 'strategy_risk_sensitive_handoff' && item.matched === false),
    analyticsExternalSentCount: analytics.json?.safety?.externalSentCount ?? null,
    runtimeFound: Boolean(firstRuntime),
    runtimeRestrictionStatus,
    groupMappedRuntimeId: groupResult.json?.runtime?.id ?? null,
    groupMappedGroupId: groupResult.json?.message?.groupId ?? null,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exit(1)
})

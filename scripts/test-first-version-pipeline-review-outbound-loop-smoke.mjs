import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'

const repoRoot = process.cwd()
const tempDbFile = path.join(os.tmpdir(), `god-plan-first-version-loop-${process.pid}-${Date.now()}.json`)
process.env.GOD_PLAN_DB_FILE = tempDbFile
process.env.GOD_PLAN_ENVIRONMENT_MODE = 'local'
process.env.GOD_PLAN_ENABLE_PRODUCTION_OUTBOUND = 'false'
process.env.GOD_PLAN_SENDER_CONFIGURED = 'false'

function loadTsModule(relativePath) {
  const absolutePathWithoutExtension = path.join(repoRoot, relativePath)
  const absolutePath = fs.existsSync(absolutePathWithoutExtension)
    ? absolutePathWithoutExtension
    : `${absolutePathWithoutExtension}.ts`
  const source = fs.readFileSync(absolutePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      strict: true,
      baseUrl: repoRoot,
      paths: { '@/*': ['./*'] },
    },
    fileName: absolutePath,
  }).outputText

  const testModule = new Module(absolutePath)
  testModule.filename = absolutePath
  testModule.paths = Module._nodeModulePaths(path.dirname(absolutePath))
  testModule.require = function requireWithAlias(request) {
    if (request.startsWith('@/')) {
      return loadTsModule(request.slice(2))
    }
    return Module.prototype.require.call(this, request)
  }
  testModule._compile(transpiled, absolutePath)
  return testModule.exports
}

const { firstVersionLoopService } = loadTsModule('lib/god-plan/services/first-version-loop-service.ts')

const result = await firstVersionLoopService.runLocalDryRunLoop({
  message: {
    id: 'msg_first_version_loop_001',
    groupId: 'group_indie_hackers',
    runtimeId: 'runtime_indie_a_growth',
    accountId: 'account_advisor_a',
    senderId: 'tg_user_founder_001',
    senderName: 'Founder Lead',
    senderUsername: 'founder_lead',
    text: '我们正在找能做 Telegram 社群获客和合规线索筛选的自动化方案，最好先看 demo 和报价。',
    messageType: 'text',
    language: 'zh-CN',
    sentAt: '2026-05-11T23:30:00.000Z',
    signals: ['question', 'need', 'commercial_intent', 'pricing', 'contact_intent'],
    rawPayload: null,
  },
  now: '2026-05-11T23:31:00.000Z',
  humanReviewer: {
    actorId: 'human_reviewer_local',
    actorName: 'Local reviewer',
  },
})

assert.equal(result.mode, 'local_dry_run')
assert.equal(result.externalNetworkUsed, false)
assert.equal(result.realTelegramSenderUsed, false)
assert.equal(result.message.id, 'msg_first_version_loop_001')
assert.equal(result.lead.stage, 'detected')
assert.equal(result.decision.requiresReview, true)
assert.equal(result.decision.decision, 'dm_suggest')
assert.equal(result.draft.draftType, 'dm_suggest')
assert.equal(result.review.status, 'approved')
assert.equal(result.outboundJob.mode, 'dry_run')
assert.equal(result.outboundJob.status, 'guarded')
assert.equal(result.outboundJob.externalSent, false)
assert.equal(result.outboundJob.guardResult.environmentMode, 'local')
assert.equal(result.outboundJob.guardResult.externalSendAllowed, false)
assert.equal(result.sendGate.decision, 'dry_run_only')
assert.equal(result.sendGate.allowedToMarkExternalSent, false)
assert.equal(result.sendGate.dryRunOnly, true)
assert.ok(result.sendGate.reasons.includes('local_mode_dry_run_only'))
assert.ok(result.sendGate.reasons.includes('dry_run_job_only'))
assert.ok(result.trace.after.externalSent === false)
assert.equal(result.analytics.totals.messages, 1)
assert.equal(result.analytics.totals.leads, 1)
assert.equal(result.analytics.totals.decisions, 1)
assert.equal(result.analytics.totals.drafts, 1)
assert.equal(result.analytics.totals.reviews, 1)
assert.equal(result.analytics.totals.outboundJobs, 1)
assert.equal(result.analytics.safety.externalSentCount, 0)
assert.equal(result.analytics.safety.dryRunOutboundJobCount, 1)
assert.equal(result.analytics.safety.guardedOutboundJobCount, 1)
assert.equal(result.analytics.localTestingReadiness.canRunLocalTests, true)
assert.equal(result.analytics.productionRobotReadiness.status, 'local_only')

const funnelCounts = Object.fromEntries(result.analytics.funnel.map((step) => [step.key, step.count]))
assert.equal(funnelCounts.messages, 1)
assert.equal(funnelCounts.decisions, 1)
assert.equal(funnelCounts.drafts, 1)
assert.equal(funnelCounts.reviews, 1)
assert.equal(funnelCounts.approved_reviews, 1)
assert.equal(funnelCounts.pending_execution_traces, 1)
assert.equal(funnelCounts.dry_run_outbound_jobs, 1)

console.log(JSON.stringify({
  ok: true,
  loop: ['message', 'lead', 'decision', 'draft', 'review', 'trace', 'outbound_job', 'analytics'],
  mode: result.mode,
  externalNetworkUsed: result.externalNetworkUsed,
  realTelegramSenderUsed: result.realTelegramSenderUsed,
  outboundJob: {
    mode: result.outboundJob.mode,
    status: result.outboundJob.status,
    externalSent: result.outboundJob.externalSent,
    guardDecision: result.outboundJob.guardResult.decision,
    externalSendAllowed: result.outboundJob.guardResult.externalSendAllowed,
  },
  sendGateDecision: result.sendGate.decision,
  analyticsSafety: result.analytics.safety,
  funnelCounts,
}, null, 2))

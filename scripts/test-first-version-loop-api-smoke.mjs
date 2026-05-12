import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'

const repoRoot = process.cwd()
const tempDbFile = path.join(os.tmpdir(), `god-plan-first-version-loop-api-${process.pid}-${Date.now()}.json`)
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
    if (request === 'next/server') {
      return {
        NextResponse: {
          json(body, init = {}) {
            return Response.json(body, init)
          },
        },
      }
    }
    if (request.startsWith('@/')) {
      return loadTsModule(request.slice(2))
    }
    return Module.prototype.require.call(this, request)
  }
  testModule._compile(transpiled, absolutePath)
  return testModule.exports
}

const { POST } = loadTsModule('app/api/god-plan/first-version-loop/dry-run/route.ts')

const response = await POST(new Request('http://local.test/api/god-plan/first-version-loop/dry-run', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    message: {
      id: 'msg_first_version_loop_api_001',
      groupId: 'group_indie_hackers',
      runtimeId: 'runtime_indie_a_growth',
      accountId: 'account_advisor_a',
      senderId: 'tg_user_founder_api_001',
      senderName: 'API Founder Lead',
      senderUsername: 'api_founder_lead',
      text: '我们需要一个 Telegram 群聊线索筛选和合规跟进方案，想先看 demo 和报价。',
      messageType: 'text',
      language: 'zh-CN',
      sentAt: '2026-05-12T00:20:00.000Z',
      signals: ['question', 'need', 'commercial_intent', 'pricing', 'contact_intent'],
      rawPayload: null,
    },
    humanReviewer: {
      actorId: 'human_reviewer_api_local',
      actorName: 'API local reviewer',
    },
    now: '2026-05-12T00:21:00.000Z',
  }),
}))

assert.equal(response.status, 200)
const result = await response.json()

assert.equal(result.ok, true)
assert.equal(result.mode, 'local_dry_run')
assert.equal(result.externalNetworkUsed, false)
assert.equal(result.realTelegramSenderUsed, false)
assert.equal(result.outboundJob.mode, 'dry_run')
assert.equal(result.outboundJob.status, 'guarded')
assert.equal(result.outboundJob.externalSent, false)
assert.equal(result.outboundJob.guardResult.externalSendAllowed, false)
assert.equal(result.sendGate.decision, 'dry_run_only')
assert.equal(result.sendGate.allowedToMarkExternalSent, false)
assert.equal(result.analytics.safety.externalSentCount, 0)
assert.equal(result.analytics.safety.dryRunOutboundJobCount, 1)
assert.equal(result.analytics.productionRobotReadiness.status, 'local_only')
assert.equal(result.message.rawPayload, null)
assert.equal(result.review.status, 'approved')

const blockedResponse = await POST(new Request('http://example.com/api/god-plan/first-version-loop/dry-run', {
  method: 'POST',
  headers: { 'content-type': 'application/json', host: 'example.com' },
  body: JSON.stringify({ message: { id: 'blocked' } }),
}))
assert.equal(blockedResponse.status, 403)

const invalidResponse = await POST(new Request('http://local.test/api/god-plan/first-version-loop/dry-run', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ message: { id: 'missing_required_fields' } }),
}))
assert.equal(invalidResponse.status, 400)

const pendingResponse = await POST(new Request('http://local.test/api/god-plan/first-version-loop/dry-run', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    message: {
      id: 'msg_first_version_loop_api_002',
      groupId: 'group_indie_hackers',
      runtimeId: 'runtime_indie_a_growth',
      accountId: 'account_advisor_a',
      senderId: 'tg_user_founder_api_002',
      senderName: 'API Founder Lead 2',
      senderUsername: 'api_founder_lead_2',
      text: '也想看一个本地 dry-run 演示。',
      messageType: 'text',
      language: 'zh-CN',
      sentAt: '2026-05-12T00:22:00.000Z',
      signals: ['question', 'need'],
      rawPayload: { shouldBeStored: false },
    },
    now: '2026-05-12T00:23:00.000Z',
  }),
}))
assert.equal(pendingResponse.status, 200)
const pendingResult = await pendingResponse.json()
assert.equal(pendingResult.review.status, 'pending')
assert.equal(pendingResult.outboundJob.status, 'blocked')
assert.equal(pendingResult.message.rawPayload, null)
assert.equal(pendingResult.analytics.safety.dryRunOutboundJobCount, 2)

console.log(JSON.stringify({
  ok: true,
  endpoint: '/api/god-plan/first-version-loop/dry-run',
  mode: result.mode,
  externalNetworkUsed: result.externalNetworkUsed,
  realTelegramSenderUsed: result.realTelegramSenderUsed,
  outboundJob: {
    mode: result.outboundJob.mode,
    status: result.outboundJob.status,
    externalSent: result.outboundJob.externalSent,
    externalSendAllowed: result.outboundJob.guardResult.externalSendAllowed,
  },
  sendGateDecision: result.sendGate.decision,
  analyticsSafety: result.analytics.safety,
}, null, 2))

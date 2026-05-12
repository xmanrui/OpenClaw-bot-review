import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import ts from 'typescript'

const repoRoot = process.cwd()
const servicePath = path.join(repoRoot, 'lib/god-plan/services/outbound-send-gate-service.ts')
const serviceSource = fs.readFileSync(servicePath, 'utf8')

const transpiled = ts.transpileModule(serviceSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
    strict: true,
  },
  fileName: servicePath,
}).outputText

const testModule = new Module(servicePath)
testModule.filename = servicePath
testModule.paths = Module._nodeModulePaths(path.dirname(servicePath))
testModule._compile(transpiled, servicePath)

const { outboundSendGateService } = testModule.exports

function buildJob(overrides = {}) {
  return {
    id: 'outbound_job_test',
    reviewId: 'review_test',
    runtimeId: 'runtime_test',
    actionType: 'dm_suggest',
    status: 'guarded',
    mode: 'dry_run',
    accountId: 'account_advisor_a',
    personaId: 'persona_growth_operator',
    targetName: 'Lead A',
    finalActionText: 'Dry-run draft text',
    externalSent: false,
    guardResult: {
      allowed: true,
      mode: 'dry_run',
      environmentMode: 'local',
      decision: 'allow_dry_run',
      externalSendAllowed: false,
      reasons: ['human_review_approved', 'local_mode_dry_run_only', 'external_send_guarded'],
      blockingReasons: [],
      summary: 'Local environment only permits guarded dry-run outbound jobs; no external sender may run.',
      evaluatedAt: '2026-05-02T00:00:00.000Z',
    },
    createdAt: '2026-05-02T00:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
    ...overrides,
  }
}

const localDryRun = outboundSendGateService.evaluate({ job: buildJob() })
assert.equal(localDryRun.decision, 'dry_run_only')
assert.equal(localDryRun.allowedToMarkExternalSent, false)
assert.equal(localDryRun.dryRunOnly, true)
assert.ok(localDryRun.reasons.includes('local_mode_dry_run_only'))
assert.ok(localDryRun.reasons.includes('dry_run_job_only'))
assert.ok(localDryRun.reasons.includes('guard_external_send_disabled'))
assert.ok(localDryRun.reasons.includes('no_runtime_sender_implemented'))
assert.ok(localDryRun.reasons.includes('sender_success_required'))
assert.ok(localDryRun.reasons.includes('missing_platform_message_id'))
assert.ok(localDryRun.reasons.includes('missing_sender_attempt_ref'))

const blockedNonLocal = outboundSendGateService.evaluate({
  job: buildJob({
    mode: 'staging',
    guardResult: {
      allowed: true,
      mode: 'staging',
      environmentMode: 'staging',
      decision: 'allow_send',
      externalSendAllowed: true,
      reasons: ['human_review_approved', 'external_send_guarded'],
      blockingReasons: [],
      summary: 'Outbound guard conditions are satisfied for a configured non-local sender.',
      evaluatedAt: '2026-05-02T00:00:00.000Z',
    },
  }),
})
assert.equal(blockedNonLocal.decision, 'blocked')
assert.equal(blockedNonLocal.allowedToMarkExternalSent, false)
assert.ok(blockedNonLocal.reasons.includes('no_runtime_sender_implemented'))
assert.ok(blockedNonLocal.reasons.includes('sender_success_required'))
assert.ok(blockedNonLocal.reasons.includes('missing_platform_message_id'))
assert.ok(blockedNonLocal.reasons.includes('missing_sender_attempt_ref'))

const eligibleFutureSender = outboundSendGateService.evaluate({
  job: buildJob({
    mode: 'staging',
    guardResult: {
      allowed: true,
      mode: 'staging',
      environmentMode: 'staging',
      decision: 'allow_send',
      externalSendAllowed: true,
      reasons: ['human_review_approved', 'external_send_guarded'],
      blockingReasons: [],
      summary: 'Outbound guard conditions are satisfied for a configured non-local sender.',
      evaluatedAt: '2026-05-02T00:00:00.000Z',
    },
  }),
  hasRuntimeSenderImplementation: true,
  platformMessageId: 'platform_message_test',
  senderAttemptRef: 'sender_attempt_test',
  senderReportedSuccess: true,
})
assert.equal(eligibleFutureSender.decision, 'eligible_for_sender')
assert.equal(eligibleFutureSender.allowedToMarkExternalSent, true)
assert.equal(eligibleFutureSender.reasons.length, 0)

const terminal = outboundSendGateService.evaluate({
  job: buildJob({ status: 'sent' }),
  hasRuntimeSenderImplementation: true,
  platformMessageId: 'platform_message_test',
  senderAttemptRef: 'sender_attempt_test',
  senderReportedSuccess: true,
})
assert.equal(terminal.allowedToMarkExternalSent, false)
assert.ok(terminal.reasons.includes('job_already_terminal'))
assert.ok(terminal.reasons.includes('job_not_guarded'))

console.log(JSON.stringify({
  ok: true,
  coveredDecisions: ['dry_run_only', 'blocked', 'eligible_for_sender'],
  localDryRunExternalSentAllowed: localDryRun.allowedToMarkExternalSent,
  futureSenderRequiresPlatformMessageId: true,
  futureSenderRequiresSenderAttemptRef: true,
  futureSenderRequiresSenderSuccess: true,
}, null, 2))

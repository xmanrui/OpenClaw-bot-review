import assert from 'node:assert/strict'
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import ts from 'typescript'

const repoRoot = process.cwd()

function loadTsModule(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  const source = fs.readFileSync(absolutePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      strict: true,
    },
    fileName: absolutePath,
  }).outputText

  const testModule = new Module(absolutePath)
  testModule.filename = absolutePath
  testModule.paths = Module._nodeModulePaths(path.dirname(absolutePath))
  testModule._compile(transpiled, absolutePath)
  return testModule.exports
}

const { outboundSendGateService } = loadTsModule('lib/god-plan/services/outbound-send-gate-service.ts')

function buildJob(overrides = {}) {
  return {
    id: 'mvp_job_test',
    reviewId: 'mvp_review_test',
    runtimeId: 'mvp_runtime_test',
    actionType: 'dm_suggest',
    status: 'guarded',
    mode: 'dry_run',
    accountId: 'account_advisor_a',
    personaId: 'persona_growth_operator',
    targetName: 'Lead A',
    finalActionText: '本地 dry-run 草稿：先记录需求，等待人工审核，不做真实发送。',
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
      evaluatedAt: '2026-05-11T00:00:00.000Z',
    },
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
    ...overrides,
  }
}

const localDryRun = outboundSendGateService.evaluate({
  job: buildJob(),
  hasRuntimeSenderImplementation: false,
  platformMessageId: null,
  senderAttemptRef: null,
  senderReportedSuccess: false,
})
assert.equal(localDryRun.decision, 'dry_run_only')
assert.equal(localDryRun.allowedToMarkExternalSent, false)
assert.equal(localDryRun.dryRunOnly, true)
assert.ok(localDryRun.reasons.includes('local_mode_dry_run_only'))
assert.ok(localDryRun.reasons.includes('dry_run_job_only'))
assert.ok(localDryRun.reasons.includes('guard_external_send_disabled'))
assert.ok(localDryRun.reasons.includes('no_runtime_sender_implemented'))

const approvedButNoSenderEvidence = outboundSendGateService.evaluate({
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
      summary: 'Non-local guard says send could proceed, but sender-owned evidence is still required.',
      evaluatedAt: '2026-05-11T00:00:00.000Z',
    },
  }),
  hasRuntimeSenderImplementation: true,
  senderReportedSuccess: true,
  platformMessageId: null,
  senderAttemptRef: null,
})
assert.equal(approvedButNoSenderEvidence.decision, 'blocked')
assert.equal(approvedButNoSenderEvidence.allowedToMarkExternalSent, false)
assert.ok(approvedButNoSenderEvidence.reasons.includes('missing_platform_message_id'))
assert.ok(approvedButNoSenderEvidence.reasons.includes('missing_sender_attempt_ref'))

const highRiskActionTypes = ['dm_suggest', 'cta', 'followup']
for (const actionType of highRiskActionTypes) {
  const result = outboundSendGateService.evaluate({ job: buildJob({ actionType }) })
  assert.equal(result.allowedToMarkExternalSent, false, `${actionType} must not finalize externalSent in MVP local mode`)
  assert.equal(result.dryRunOnly, true, `${actionType} must remain dry-run only in MVP local mode`)
}

const pagePath = path.join(repoRoot, 'app/telegram-acquisition-local-control/page.tsx')
const pageSource = fs.readFileSync(pagePath, 'utf8')
for (const requiredSurface of [
  '/groups',
  '/leads',
  '/review',
  '/outbound-guard',
  '/outbound-jobs',
  '/stats',
]) {
  assert.ok(pageSource.includes(`href="${requiredSurface}"`) || pageSource.includes(`href='${requiredSurface}'`), `MVP workbench should link ${requiredSurface}`)
}
for (const requiredCopy of [
  'human review',
  'dry-run',
  'externalSent=false',
  'not bulk messaging',
]) {
  assert.ok(pageSource.toLowerCase().includes(requiredCopy.toLowerCase()), `MVP workbench should display safety copy: ${requiredCopy}`)
}

console.log(JSON.stringify({
  ok: true,
  mvpLocalControlLinks: ['groups', 'leads', 'review', 'outbound-guard', 'outbound-jobs', 'stats'],
  localDryRunExternalSentAllowed: localDryRun.allowedToMarkExternalSent,
  highRiskActionTypesDryRunOnly: highRiskActionTypes,
  requiresSenderOwnedEvidence: ['platform_message_id', 'sender_attempt_ref', 'sender_success'],
}, null, 2))

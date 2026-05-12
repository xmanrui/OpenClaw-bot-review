import { ensureSchema } from '@/lib/god-plan/storage/schema'
import { readState, replaceState, type DbState } from '@/lib/god-plan/storage/db'
import {
  getAccountStore,
  getGroupStore,
  getLeadDetailStore,
  getLeadStore,
  getReviewStore,
  getRiskStore,
  getRuntimeDetailStore,
  getPersonaStore,
  getRuntimeStore,
  getTraceStore,
  getStrategyRuleStore,
} from '@/lib/god-plan/seed-source'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function buildSeedState(): DbState {
  return {
    groups: clone(getGroupStore()),
    accounts: clone(getAccountStore()),
    personas: clone(getPersonaStore()),
    runtimes: clone(getRuntimeStore()),
    runtimeDetails: clone(getRuntimeDetailStore()),
    leads: clone(getLeadStore()),
    leadDetails: clone(getLeadDetailStore()),
    reviews: clone(getReviewStore()),
    risks: clone(getRiskStore()),
    traces: clone(getTraceStore()),
    strategyRules: clone(getStrategyRuleStore()),
    messageEvents: [],
    messageContexts: [],
    decisions: [],
    drafts: [],
    outboundJobs: [],
    senderAttemptRecords: [],
    seededAt: new Date().toISOString(),
  }
}

export function seedInitialData() {
  const schema = ensureSchema()
  const current = readState()
  const hasData =
    current.groups.length > 0 ||
    current.accounts.length > 0 ||
    current.personas.length > 0 ||
    current.runtimes.length > 0 ||
    current.runtimeDetails.length > 0 ||
    current.leads.length > 0 ||
    current.leadDetails.length > 0 ||
    current.reviews.length > 0 ||
    current.risks.length > 0 ||
    current.traces.length > 0 ||
    current.strategyRules.length > 0 ||
    current.messageEvents.length > 0 ||
    current.messageContexts.length > 0 ||
    current.decisions.length > 0 ||
    current.drafts.length > 0 ||
    current.outboundJobs.length > 0 ||
    current.senderAttemptRecords.length > 0

  const state = hasData ? current : replaceState(buildSeedState())
  return {
    ...schema,
    counts: {
      groups: state.groups.length,
      accounts: state.accounts.length,
      personas: state.personas.length,
      runtimes: state.runtimes.length,
      leads: state.leads.length,
      reviews: state.reviews.length,
      risks: state.risks.length,
      traces: state.traces.length,
      strategyRules: state.strategyRules.length,
      outboundJobs: state.outboundJobs.length,
      senderAttemptRecords: state.senderAttemptRecords.length,
    },
  }
}

export function resetAndSeed() {
  const schema = ensureSchema()
  const state = replaceState(buildSeedState())
  return {
    ...schema,
    counts: {
      groups: state.groups.length,
      accounts: state.accounts.length,
      personas: state.personas.length,
      runtimes: state.runtimes.length,
      leads: state.leads.length,
      reviews: state.reviews.length,
      risks: state.risks.length,
      traces: state.traces.length,
      strategyRules: state.strategyRules.length,
      outboundJobs: state.outboundJobs.length,
      senderAttemptRecords: state.senderAttemptRecords.length,
    },
  }
}

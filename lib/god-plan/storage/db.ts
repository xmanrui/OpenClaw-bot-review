import fs from 'node:fs'
import path from 'node:path'
import type { AccountRecord, GroupRecord, PersonaRecord } from '@/lib/god-plan/seed-source'
import type {
  DecisionItem,
  DraftItem,
  LeadDetailViewModel,
  LeadListItem,
  MessageContext,
  MessageEvent,
  ReviewDetailViewModel,
  RiskQueueListItem,
  RuntimeDetailViewModel,
  StrategyRule,
  RuntimeListItem,
  TraceEvent,
  OutboundJob,
  SenderAttemptRecord,
} from '@/lib/god-plan/types'

declare global {
  // eslint-disable-next-line no-var
  var __godPlanDb__: DbHandle | undefined
}

export interface DbState {
  groups: GroupRecord[]
  accounts: AccountRecord[]
  personas: PersonaRecord[]
  runtimes: RuntimeListItem[]
  runtimeDetails: RuntimeDetailViewModel[]
  leads: LeadListItem[]
  leadDetails: LeadDetailViewModel[]
  reviews: ReviewDetailViewModel[]
  risks: RiskQueueListItem[]
  messageEvents: MessageEvent[]
  messageContexts: MessageContext[]
  decisions: DecisionItem[]
  drafts: DraftItem[]
  traces: TraceEvent[]
  strategyRules: StrategyRule[]
  outboundJobs: OutboundJob[]
  senderAttemptRecords: SenderAttemptRecord[]
  seededAt: string | null
}

export interface DbHandle {
  kind: 'file-backed-json-v1'
  filePath: string
  state: DbState
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createEmptyState(): DbState {
  return {
    groups: [],
    accounts: [],
    personas: [],
    runtimes: [],
    runtimeDetails: [],
    leads: [],
    leadDetails: [],
    reviews: [],
    risks: [],
    messageEvents: [],
    messageContexts: [],
    decisions: [],
    drafts: [],
    traces: [],
    strategyRules: [],
    outboundJobs: [],
    senderAttemptRecords: [],
    seededAt: null,
  }
}

function getStorageFilePath() {
  const explicitFile = process.env.GOD_PLAN_DB_FILE
  if (explicitFile && explicitFile.trim()) {
    return path.resolve(explicitFile)
  }

  const cwd = process.cwd()
  const standaloneMarker = `${path.sep}.next${path.sep}standalone`
  const projectRoot = cwd.includes(standaloneMarker)
    ? cwd.slice(0, cwd.lastIndexOf(standaloneMarker))
    : cwd

  return path.join(projectRoot, 'logs', 'god-plan-db.json')
}

function ensureStorageDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function loadState(filePath: string): DbState {
  ensureStorageDir(filePath)
  if (!fs.existsSync(filePath)) {
    return createEmptyState()
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    if (!raw.trim()) return createEmptyState()
    const parsed = JSON.parse(raw) as Partial<DbState>
    return {
      groups: parsed.groups ?? [],
      accounts: parsed.accounts ?? [],
      personas: parsed.personas ?? [],
      runtimes: parsed.runtimes ?? [],
      runtimeDetails: parsed.runtimeDetails ?? [],
      leads: parsed.leads ?? [],
      leadDetails: parsed.leadDetails ?? [],
      reviews: parsed.reviews ?? [],
      risks: parsed.risks ?? [],
      messageEvents: parsed.messageEvents ?? [],
      messageContexts: parsed.messageContexts ?? [],
      decisions: parsed.decisions ?? [],
      drafts: parsed.drafts ?? [],
      traces: parsed.traces ?? [],
      strategyRules: parsed.strategyRules ?? [],
      outboundJobs: parsed.outboundJobs ?? [],
      senderAttemptRecords: parsed.senderAttemptRecords ?? [],
      seededAt: parsed.seededAt ?? null,
    }
  } catch {
    return createEmptyState()
  }
}

function persistState(db: DbHandle) {
  ensureStorageDir(db.filePath)
  fs.writeFileSync(db.filePath, JSON.stringify(db.state, null, 2), 'utf8')
}

const db: DbHandle =
  globalThis.__godPlanDb__ ??
  {
    kind: 'file-backed-json-v1',
    filePath: getStorageFilePath(),
    state: createEmptyState(),
  }

db.state = loadState(db.filePath)
globalThis.__godPlanDb__ = db

export function getDb(): DbHandle {
  return db
}

export function readState(): DbState {
  db.state = loadState(db.filePath)
  return db.state
}

export function replaceState(nextState: DbState): DbState {
  db.state = clone(nextState)
  persistState(db)
  return db.state
}

export function updateState(mutator: (state: DbState) => void): DbState {
  const nextState = clone(readState())
  mutator(nextState)
  db.state = nextState
  persistState(db)
  return db.state
}

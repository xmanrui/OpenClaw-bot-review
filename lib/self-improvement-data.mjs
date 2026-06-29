import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateCouncilProposals } from './council-model.mjs';

export const REPO_ROOT = process.env.OPENCLAW_BOT_REVIEW_REPO_ROOT ?? process.cwd();
export const COUNCIL_ITEMS_PATH = path.join(REPO_ROOT, 'rd-council-items.json');
export const IDEA_LEDGER_PATH = path.join(REPO_ROOT, 'idea_ledger.json');
export const COUNCIL_WORK_ORDERS_PATH = path.join(REPO_ROOT, 'rd-council-work-orders.json');
export const ACTIVE_PROJECTS_ENV_VAR = 'OPENCLAW_ACTIVE_PROJECTS_PATH';
export const ACTIVE_PROJECTS_PATH = path.join(os.homedir(), '.openclaw', 'workspace', 'memory', 'active_projects.json');

export const COMMAND_AUDIT_LOG_PATH = path.join(REPO_ROOT, 'self-improvement-command-log.jsonl');
export const RD_COUNCIL_AUDIT_LOG_PATH = path.join(REPO_ROOT, 'rd-council-decision-log.jsonl');
export const RD_COUNCIL_DECISION_LEDGER_BUCKETS = {
  approved: 'adopted',
  rejected: 'rejected',
  snoozed: 'dormant',
};

export const SELF_IMPROVEMENT_COMMANDS = {
  'proactive-real': {
    id: 'proactive-real',
    label: 'Run Proactive Analysis',
    description: 'Analyze available usage/session text and write deduped R&D council items plus proposed ledger entries.',
    sideEffect: 'writes',
    requiresConfirmation: true,
    confirmationText: 'This will write deduped proactive ideas to rd-council-items.json and idea_ledger.json.',
  },
  'ingest-usage': {
    id: 'ingest-usage',
    label: 'Ingest Usage Data',
    description: 'Run canonical usage ingestion from available session data.',
    sideEffect: 'writes',
    requiresConfirmation: true,
    confirmationText: 'This will update the local R&D council and idea ledger from usage signals.',
  },
  'dry-run': {
    id: 'dry-run',
    label: 'Dry Run',
    description: 'Preview ingestion output without writing files.',
    sideEffect: 'none',
    requiresConfirmation: false,
    confirmationText: '',
  },
  'weekly-review': {
    id: 'weekly-review',
    label: 'Weekly Review',
    description: 'Summarize current council/ledger/project state without mutating records.',
    sideEffect: 'none',
    requiresConfirmation: false,
    confirmationText: '',
  },
};

export function getCommandConfig(commandId) {
  return SELF_IMPROVEMENT_COMMANDS[commandId] ?? null;
}

export function validateCommandRequest(commandId, body = {}) {
  const config = getCommandConfig(commandId);
  if (!config) {
    return { ok: false, status: 404, message: `Unknown self-improvement command: ${commandId}` };
  }
  if (config.requiresConfirmation && body.confirm !== true) {
    return {
      ok: false,
      status: 409,
      message: 'Confirmation required before running this side-effecting command.',
      confirmationRequired: true,
      confirmationText: config.confirmationText,
      command: config,
    };
  }
  return { ok: true, command: config };
}

export function appendCommandAudit(entry, filePath = COMMAND_AUDIT_LOG_PATH) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const safeEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  fs.appendFileSync(filePath, `${JSON.stringify(safeEntry)}\n`);
  return safeEntry;
}

export function commandOk({ command, message, output = [], details = {}, version = '2.4.0' }) {
  const normalizedOutput = Array.isArray(output) ? output.map(String) : [String(output)];
  return {
    success: true,
    command_id: command?.id ?? null,
    command_label: command?.label ?? null,
    message,
    version,
    output: normalizedOutput.join('\n'),
    log_lines: normalizedOutput,
    details,
    timestamp: new Date().toISOString(),
  };
}

export function commandError({ commandId, message, code = 'COMMAND_FAILED', details = {}, status = 500 }) {
  return {
    success: false,
    command_id: commandId ?? null,
    code,
    message,
    log_lines: [`ERROR ${code}: ${message}`],
    details,
    status,
    timestamp: new Date().toISOString(),
  };
}

const LOCAL_OPERATOR_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function hostnameFromHostHeader(value) {
  const raw = nonEmptyString(value);
  if (!raw) return null;
  if (raw.startsWith('[')) return raw.slice(0, raw.indexOf(']') + 1);
  return raw.split(':')[0];
}

function constantTimeEqual(left, right) {
  const leftValue = nonEmptyString(left);
  const rightValue = nonEmptyString(right);
  if (!leftValue || !rightValue) return false;
  const leftBuffer = Buffer.from(leftValue);
  const rightBuffer = Buffer.from(rightValue);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function validateLocalOperatorRequest(request, opts = {}) {
  const expectedToken = nonEmptyString(process.env.OPENCLAW_OPERATOR_TOKEN);
  const allowUnauthenticatedLocal = process.env.OPENCLAW_ALLOW_UNAUTHENTICATED_LOCAL_OPERATOR_UI === 'true' || opts.allowUnauthenticatedLocal === true;
  const authHeader = nonEmptyString(request?.headers?.get?.('authorization'));
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;
  const headerToken = nonEmptyString(request?.headers?.get?.('x-openclaw-operator-token')) || bearerToken;
  if (expectedToken && constantTimeEqual(headerToken, expectedToken)) {
    return { ok: true, reason: null };
  }
  if (expectedToken && !constantTimeEqual(headerToken, expectedToken)) {
    return { ok: false, status: 401, reason: 'R&D Council operator token is missing or invalid.' };
  }
  if (!allowUnauthenticatedLocal) {
    return {
      ok: false,
      status: 401,
      reason: 'Set OPENCLAW_OPERATOR_TOKEN or explicitly enable OPENCLAW_ALLOW_UNAUTHENTICATED_LOCAL_OPERATOR_UI=true for trusted local development.',
    };
  }
  if (process.env.OPENCLAW_ALLOW_REMOTE_OPERATOR_UI === 'true' || opts.allowRemote === true) {
    return { ok: true, reason: null };
  }
  const urlHost = (() => {
    try {
      return hostnameFromHostHeader(new URL(request?.url ?? 'http://invalid.local').host);
    } catch {
      return null;
    }
  })();
  const headerHost = hostnameFromHostHeader(request?.headers?.get?.('host'));
  const forwardedHost = hostnameFromHostHeader(request?.headers?.get?.('x-forwarded-host'));
  const forwardedFor = hostnameFromHostHeader(request?.headers?.get?.('x-forwarded-for'));
  const candidates = [urlHost, headerHost, forwardedHost].filter(Boolean);
  const hostIsLocal = candidates.length > 0 && candidates.every((host) => LOCAL_OPERATOR_HOSTS.has(host));
  const forwardIsLocal = !forwardedFor || LOCAL_OPERATOR_HOSTS.has(forwardedFor);
  if (hostIsLocal && forwardIsLocal) return { ok: true, reason: null };
  return {
    ok: false,
    status: 403,
    reason: 'R&D Council operator APIs are restricted to localhost by default.',
  };
}

export function localOperatorDeniedPayload(reason = 'R&D Council operator APIs are restricted to localhost by default.') {
  return {
    success: false,
    code: 'LOCAL_OPERATOR_ONLY',
    message: reason,
  };
}


export const SESSION_PATHS = [
  path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions', 'sessions.json'),
  path.join(os.homedir(), '.openclaw', 'agents', 'sessions.json'),
  path.join(os.homedir(), '.openclaw', 'agents', 'main', 'session.json'),
];

const LENSES = {
  efficiency: { tag: '⚙️ Efficiency Gap', confidence: 'high' },
  infrastructure: { tag: '🏗️ Infrastructure Idea', confidence: 'medium' },
  pattern: { tag: '🔍 Pattern Detected', confidence: 'medium' },
  external: { tag: '🌐 External Opportunity', confidence: 'low' },
};

const COUNCIL_ROLE_ORDER = ['proposer', 'skeptic', 'cost_risk_reviewer', 'implementation_planner', 'final_recommendation'];

const DELIBERATION_TEMPLATES = {
  efficiency: {
    proposer: 'Repeated evidence suggests a focused workflow improvement could reduce operator effort and tighten execution speed.',
    skeptic: 'The same topics may recur in planning conversations without proving the workflow is painful enough to automate yet.',
    costRisk: 'A broad rollout could add maintenance burden, hidden coupling, and cost overhead if it grows before telemetry exists.',
    planner: 'Instrument the current path, pilot one narrow workflow, and keep approvals plus rollback controls in place until the signal is stable.',
    disagreement: 'Whether the repeated signal reflects real operational drag or just concentrated design chatter.',
    resolution: 'Use a reversible pilot with telemetry so expansion depends on measured usage, not discussion volume.',
  },
  infrastructure: {
    proposer: 'The evidence points to infrastructure friction that would benefit from a more reliable and observable execution path.',
    skeptic: 'Infrastructure changes can look attractive in theory while adding operational surface area and new failure modes in practice.',
    costRisk: 'Queueing, idempotency, retries, and operator visibility must be constrained so the first release does not become a platform project.',
    planner: 'Ship the smallest path with idempotent boundaries, explicit state transitions, and read-first observability before automation widens.',
    disagreement: 'Whether reliability gains justify the additional moving parts required for a durable infrastructure workflow.',
    resolution: 'Limit the first version to one controlled path with clear failure handling and operator visibility.',
  },
  pattern: {
    proposer: 'A repeated pattern across sessions suggests there is enough signal to turn ad hoc review into a repeatable local workflow.',
    skeptic: 'Patterns in conversation can be noisy and may encode preferences rather than durable problems worth codifying.',
    costRisk: 'If the pattern is formalized too early, the team may create process overhead that outlasts the original need.',
    planner: 'Codify only the minimum review structure, keep the outputs inspectable, and defer any wider automation until the pattern repeats again.',
    disagreement: 'Whether the pattern is stable enough to deserve a permanent workflow instead of lightweight manual review.',
    resolution: 'Keep the implementation local, deterministic, and easy to revise while more evidence accumulates.',
  },
  external: {
    proposer: 'External opportunity signals may open useful leverage if the team can evaluate them without committing to a large build.',
    skeptic: 'External demand can shift quickly, so acting too soon may distract from more validated internal priorities.',
    costRisk: 'Exploration should stay bounded so external experimentation does not consume roadmap capacity without proof of value.',
    planner: 'Start with a lightweight investigation, define a go/no-go threshold, and only proceed if evidence survives that screen.',
    disagreement: 'Whether the external opportunity is concrete enough to compete with current internal priorities.',
    resolution: 'Time-box discovery and require explicit thresholds before resourcing a broader implementation.',
  },
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function nonEmptyString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeIsoTimestamp(value) {
  const normalized = nonEmptyString(value);
  if (!normalized) return null;
  const millis = Date.parse(normalized);
  if (!Number.isFinite(millis)) return null;
  return new Date(millis).toISOString();
}

function normalizeDecisionValue(value) {
  const normalized = normalizeText(value);
  if (normalized === 'approved' || normalized === 'rejected' || normalized === 'snoozed') return normalized;
  return null;
}

function normalizeDecisionHistory(history = []) {
  return safeArray(history)
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      decision: normalizeDecisionValue(entry.decision),
      note: nonEmptyString(entry.note),
      actor: nonEmptyString(entry.actor),
      at: nonEmptyString(entry.at) ?? new Date().toISOString(),
      snooze_until: nonEmptyString(entry.snooze_until),
    }))
    .filter((entry) => entry.decision);
}

function messageText(message) {
  if (typeof message === 'string') return message;
  if (!message || typeof message !== 'object') return '';
  return String(message.message ?? message.content ?? message.text ?? message.prompt ?? '');
}

function allSessionMessages(sessionsData) {
  const messages = safeArray(sessionsData?.messages);
  const input = messages.length > 0 ? messages : Array.isArray(sessionsData) ? sessionsData : [sessionsData];
  const normalized = input
    .map((message, index) => {
      const text = String(messageText(message) || '').trim();
      if (!text) return null;
      return {
        text,
        sourceId:
          nonEmptyString(message?.id) ??
          nonEmptyString(message?.message_id) ??
          nonEmptyString(message?.source_id) ??
          `session-message-${index + 1}`,
        timestamp: normalizeIsoTimestamp(
          message?.created_at ?? message?.timestamp ?? message?.at ?? message?.updated_at ?? message?.date
        ),
      };
    })
    .filter(Boolean);
  return normalized.length > 0
    ? normalized
    : [
        {
          text: JSON.stringify(sessionsData ?? {}),
          sourceId: 'session-message-1',
          timestamp: null,
        },
      ];
}

function countEvidenceMessages(messages, terms) {
  return messages.reduce((count, message) => {
    const lower = String(message?.text ?? '').toLowerCase();
    return count + (terms.some((term) => lower.includes(term)) ? 1 : 0);
  }, 0);
}

function collectEvidenceMessages(messages, terms, limit = 3) {
  const matches = [];
  for (const message of messages) {
    const normalizedMessage = String(message?.text ?? '').trim();
    if (!normalizedMessage) continue;
    const lower = normalizedMessage.toLowerCase();
    if (!terms.some((term) => lower.includes(term))) continue;
    matches.push(normalizedMessage);
    if (matches.length >= limit) break;
  }
  return matches;
}

function collectEvidenceSourceIds(messages, terms) {
  const sourceIds = [];
  const seen = new Set();
  for (const message of messages) {
    const normalizedMessage = String(message?.text ?? '').trim();
    if (!normalizedMessage) continue;
    const lower = normalizedMessage.toLowerCase();
    if (!terms.some((term) => lower.includes(term))) continue;
    const sourceId = nonEmptyString(message?.sourceId);
    if (!sourceId || seen.has(sourceId)) continue;
    seen.add(sourceId);
    sourceIds.push(sourceId);
  }
  return sourceIds;
}

function collectEvidenceTimestamps(messages, terms) {
  return messages
    .filter((message) => {
      const lower = String(message?.text ?? '').toLowerCase();
      return terms.some((term) => lower.includes(term));
    })
    .map((message) => normalizeIsoTimestamp(message?.timestamp))
    .filter(Boolean);
}

function confidenceFromEvidence(evidenceCount, fallback = 'medium') {
  if (evidenceCount >= 4) return 'high';
  if (evidenceCount >= 2) return 'medium';
  return fallback;
}

function confidenceLabelFromScore(score, fallback = 'medium') {
  if (score >= 0.78) return 'high';
  if (score >= 0.48) return 'medium';
  return fallback === 'high' && score >= 0.4 ? 'medium' : 'low';
}

function roleSummaryLine(label, summary) {
  return `${label}: ${summary}`;
}

function normalizeCouncilRole(role, fallbackRole) {
  const normalizedRole = nonEmptyString(role?.role) ?? fallbackRole;
  return {
    role: normalizedRole,
    summary: nonEmptyString(role?.summary) ?? 'No deliberation summary recorded.',
    points: safeArray(role?.points).map((point) => String(point)).filter(Boolean),
  };
}

function extractDelimitedList(points = [], prefix) {
  const normalizedPrefix = normalizeText(prefix);
  return safeArray(points)
    .map((point) => String(point ?? '').trim())
    .filter(Boolean)
    .filter((point) => normalizeText(point).startsWith(normalizedPrefix))
    .map((point) => point.slice(prefix.length).trim())
    .filter(Boolean);
}

function councilWorkOrderId(item) {
  const itemId = nonEmptyString(item?.id);
  if (itemId) return `work-order-${itemId}`;
  const titleSlug = slugify(item?.title) || 'untitled-improvement';
  return `work-order-${titleSlug}`;
}

function councilWorkOrderIdempotencyKey(item) {
  const itemKey = nonEmptyString(item?.id) ?? slugify(item?.title) ?? 'untitled-improvement';
  return `${itemKey}:${slugify(item?.title) || 'untitled-improvement'}`;
}

function isFutureTimestamp(value, now) {
  const normalizedValue = normalizeIsoTimestamp(value);
  const normalizedNow = normalizeIsoTimestamp(now) ?? new Date().toISOString();
  if (!normalizedValue) return false;
  return Date.parse(normalizedValue) > Date.parse(normalizedNow);
}

function decisionVerb(decision) {
  return decision === 'approved' ? 'Approve' : decision === 'rejected' ? 'Reject' : 'Snooze';
}

export function buildEvidenceTelemetry(input = {}) {
  const title = nonEmptyString(input.title) ?? 'Untitled Improvement';
  const evidenceSnippets = safeArray(input.evidence)
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
    .slice(0, 3);
  const sourceIds = [];
  const seenSourceIds = new Set();
  for (const entry of safeArray(input.sourceIds)) {
    const sourceId = nonEmptyString(entry);
    if (!sourceId || seenSourceIds.has(sourceId)) continue;
    seenSourceIds.add(sourceId);
    sourceIds.push(sourceId);
  }
  const timestamps = safeArray(input.timestamps).map(normalizeIsoTimestamp).filter(Boolean);
  const recurrenceCount = Math.max(
    Number.isFinite(input.recurrenceCount) ? Number(input.recurrenceCount) : 0,
    sourceIds.length,
    evidenceSnippets.length,
    1
  );
  const sortedTimestamps = [...timestamps].sort();
  const mostRecentAt = sortedTimestamps.at(-1) ?? null;
  const oldestAt = sortedTimestamps[0] ?? null;
  const now = normalizeIsoTimestamp(input.now) ?? new Date().toISOString();
  const stalenessDays = mostRecentAt
    ? Math.max(0, Math.floor((Date.parse(now) - Date.parse(mostRecentAt)) / (24 * 60 * 60 * 1000)))
    : 0;
  const staleSignalDecay = Number(Math.max(0.25, 1 - stalenessDays / 30).toFixed(3));
  const recurrenceFactor = Math.min(recurrenceCount, 5) / 5;
  const evidenceFactor = Math.min(evidenceSnippets.length, 3) / 3;
  const confidenceScore = Number(
    Math.min(1, 0.65 * recurrenceFactor + 0.2 * evidenceFactor + 0.15 * staleSignalDecay).toFixed(3)
  );
  return {
    title,
    evidence_snippets: evidenceSnippets,
    source_ids: sourceIds,
    recurrence_count: recurrenceCount,
    most_recent_at: mostRecentAt,
    oldest_at: oldestAt,
    staleness_days: stalenessDays,
    stale_signal_decay: staleSignalDecay,
    confidence_score: confidenceScore,
    confidence_label: confidenceLabelFromScore(confidenceScore),
  };
}

export function buildCouncilDeliberation(input = {}) {
  const title = nonEmptyString(input.title) ?? 'Untitled Improvement';
  const summary = nonEmptyString(input.summary) ?? 'No summary provided.';
  const lens = input.proactive_lens ?? input.lens ?? 'pattern';
  const lensMeta = LENSES[lens] ?? LENSES.pattern;
  const template = DELIBERATION_TEMPLATES[lens] ?? DELIBERATION_TEMPLATES.pattern;
  const evidence = safeArray(input.evidence).map((entry) => String(entry)).filter(Boolean);
  const evidenceTelemetry = buildEvidenceTelemetry({
    title,
    evidence: input?.evidence_telemetry?.evidence_snippets ?? evidence,
    sourceIds: input?.evidence_telemetry?.source_ids ?? input?.source_ids,
    recurrenceCount: input?.evidence_telemetry?.recurrence_count ?? input.evidenceCount,
    timestamps: [
      ...(safeArray(input?.evidence_telemetry?.most_recent_at).filter(Boolean)),
      ...(safeArray(input?.evidence_telemetry?.oldest_at).filter(Boolean)),
      ...(safeArray(input?.timestamps).filter(Boolean)),
    ],
    now: input.now,
  });
  const evidenceCount = evidenceTelemetry.recurrence_count;
  const confidence =
    input.confidence ??
    evidenceTelemetry.confidence_label ??
    input.council_confidence ??
    confidenceFromEvidence(evidenceCount, lensMeta.confidence);
  const evidenceLine =
    safeArray(input.debate_summary).find((line) => String(line).startsWith('Evidence:')) ??
    `Evidence: ${evidenceCount} matching usage signal${evidenceCount === 1 ? '' : 's'} from ${Math.max(
      evidenceTelemetry.source_ids.length,
      1
    )} source${evidenceTelemetry.source_ids.length === 1 ? '' : 's'} for ${title}`;
  const recommendation =
    nonEmptyString(input.recommendation) ??
    nonEmptyString(input.council_recommendation) ??
    `Pilot ${title} as a narrow, reversible workflow with telemetry, approvals, and rollback before broader rollout.`;
  const passingReasoning =
    nonEmptyString(input.passing_reasoning) ??
    `${confidence} confidence based on ${evidenceCount} observed signal${evidenceCount === 1 ? '' : 's'}, telemetry score ${evidenceTelemetry.confidence_score}, stale decay ${evidenceTelemetry.stale_signal_decay}, ${lens} lens alignment, and a staged rollout path.`;
  const generatedRoles = [
    {
      role: 'proposer',
      summary: `${template.proposer} ${summary}`,
      points: [evidenceLine, `Lens: ${lens}`],
    },
    {
      role: 'skeptic',
      summary: template.skeptic,
      points: [
        `Primary challenge: ${template.disagreement}`,
        evidence[0] ? `Representative evidence: ${evidence[0]}` : 'Representative evidence: repeated session text rather than direct task telemetry.',
      ],
    },
    {
      role: 'cost_risk_reviewer',
      summary: template.costRisk,
      points: [
        `Confidence: ${confidence}`,
        'Scope constraint: keep the first iteration local, deterministic, and easy to reverse.',
      ],
    },
    {
      role: 'implementation_planner',
      summary: template.planner,
      points: [
        'Plan: begin with a narrow release, explicit success criteria, and operator-visible outputs.',
        'Guardrails: avoid external model calls and preserve reviewable local state.',
      ],
    },
    {
      role: 'final_recommendation',
      summary: recommendation,
      points: [passingReasoning],
    },
  ];
  const roles = COUNCIL_ROLE_ORDER.map((roleName, index) =>
    normalizeCouncilRole(safeArray(input.roles)[index], roleName) ?? generatedRoles[index]
  ).map((role, index) => {
    const generated = generatedRoles[index];
    return {
      role: role.role,
      summary: role.summary === 'No deliberation summary recorded.' ? generated.summary : role.summary,
      points: role.points.length > 0 ? role.points : generated.points,
    };
  });
  const keyDisagreements = safeArray(input.key_disagreements).length
    ? safeArray(input.key_disagreements)
    : [
        {
          model: 'skeptic',
          concern: template.disagreement,
          resolution: template.resolution,
        },
      ];
  const debateSummary = safeArray(input.debate_summary).length
    ? safeArray(input.debate_summary)
    : [
        evidenceLine,
        roleSummaryLine('Proposer', roles[0].summary),
        roleSummaryLine('Skeptic', roles[1].summary),
        roleSummaryLine('Cost/Risk', roles[2].summary),
        roleSummaryLine('Implementation Plan', roles[3].summary),
        roleSummaryLine('Recommendation', recommendation),
      ];

  return {
    roles,
    key_disagreements: keyDisagreements,
    recommendation,
    confidence,
    passing_reasoning: passingReasoning,
    debate_summary: debateSummary,
    evidence_telemetry: evidenceTelemetry,
  };
}

export function summarizeCouncilItemOperatorState(raw, opts = {}) {
  const now = opts.now ?? new Date().toISOString();
  const item = normalizeCouncilItem(raw, { now });
  const latestDecision =
    safeArray(item.decision_history).at(-1) ??
    (item.decision
      ? {
          decision: item.decision,
          note: item.decision_note,
          actor: null,
          at: item.decision_at,
          snooze_until: item.snooze_until,
        }
      : null);
  const hiddenUntil = nonEmptyString(item.hidden_until);
  const workOrderId = nonEmptyString(item.work_order_id) ?? nonEmptyString(item.work_order_handoff_id);
  const badges = [];
  let summary = 'Awaiting operator decision';

  if (item.decision === 'approved') {
    summary = workOrderId ? 'Approved and handed off' : 'Approved';
    badges.push({ tone: 'success', label: 'Approved' });
    if (workOrderId) badges.push({ tone: 'success', label: 'Work order ready' });
  } else if (item.decision === 'rejected') {
    summary = 'Rejected';
    badges.push({ tone: 'danger', label: 'Rejected' });
  } else if (item.decision === 'snoozed' || item.is_hidden) {
    summary = item.is_hidden ? 'Snoozed and hidden' : 'Snoozed';
    if (item.decision === 'snoozed') badges.push({ tone: 'warning', label: 'Snoozed' });
    if (item.is_hidden) badges.push({ tone: 'muted', label: 'Hidden' });
  } else {
    badges.push({ tone: 'muted', label: 'Undecided' });
  }

  return {
    summary,
    badges,
    workOrderLabel: workOrderId,
    hiddenLabel: hiddenUntil ? `Until ${hiddenUntil}` : item.is_hidden ? 'Hidden' : null,
    decisionHistoryCount: safeArray(item.decision_history).length,
    latestDecisionActor: nonEmptyString(latestDecision?.actor),
    latestDecisionNote: nonEmptyString(latestDecision?.note),
    latestDecisionAt: nonEmptyString(latestDecision?.at),
    evidenceConfidenceLabel: item?.evidence_telemetry?.confidence_label ?? item.council_confidence,
    evidenceConfidenceScore: item?.evidence_telemetry?.confidence_score ?? item.confidence_score ?? null,
    recurrenceCount: item?.evidence_telemetry?.recurrence_count ?? item.recurrence_count ?? 0,
    sourceCount: safeArray(item?.evidence_telemetry?.source_ids ?? item.source_ids).length,
    stalenessDays: item?.evidence_telemetry?.staleness_days ?? null,
  };
}

export function getCouncilItemActionAvailability(raw, opts = {}) {
  const now = opts.now ?? new Date().toISOString();
  const item = normalizeCouncilItem(raw, { now });
  const hiddenUntil = nonEmptyString(item.hidden_until) ?? nonEmptyString(item.snooze_until);
  const hiddenUntilIsFuture = isFutureTimestamp(hiddenUntil, now);
  const workOrderId = nonEmptyString(item.work_order_id) ?? nonEmptyString(item.work_order_handoff_id);

  return {
    approve: item.decision === 'approved'
      ? {
          disabled: true,
          label: 'Approved',
          reason: workOrderId
            ? `Already approved and handed off to work order ${workOrderId}.`
            : 'Already approved.',
        }
      : {
          disabled: false,
          label: 'Approve',
          reason: null,
        },
    reject: item.decision === 'rejected'
      ? {
          disabled: true,
          label: 'Rejected',
          reason: 'Already rejected.',
        }
      : {
          disabled: false,
          label: 'Reject',
          reason: null,
        },
    snooze: item.is_hidden || hiddenUntilIsFuture || item.decision === 'snoozed'
      ? {
          disabled: true,
          label: hiddenUntil ? `Snoozed until ${hiddenUntil}` : item.is_hidden ? 'Hidden' : 'Snoozed',
          reason: hiddenUntil ? `Item is hidden until ${hiddenUntil}.` : 'Item is already hidden.',
        }
      : {
          disabled: false,
          label: 'Snooze 7d',
          reason: null,
        },
  };
}

export function formatCouncilDecisionApiError(decision, input = {}) {
  const action = decisionVerb(normalizeDecisionValue(decision) ?? decision);
  const status = Number.isFinite(input?.response?.status) ? Number(input.response.status) : null;
  const message =
    nonEmptyString(input?.payload?.message) ??
    nonEmptyString(input?.payload?.error) ??
    nonEmptyString(input?.payload?.details?.message) ??
    nonEmptyString(input?.error?.message) ??
    nonEmptyString(input?.response?.statusText) ??
    'Request failed';

  return `${action} failed${status ? ` (${status})` : ''}: ${message}`;
}

function makeItem({ title, summary, lens, evidence = [], evidenceCount, sourceIds = [], timestamps = [], recommendation, now }) {
  const lensMeta = LENSES[lens] ?? LENSES.pattern;
  const idBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const evidenceTelemetry = buildEvidenceTelemetry({
    title,
    evidence,
    sourceIds,
    recurrenceCount: evidenceCount,
    timestamps,
    now,
  });
  const deliberation = buildCouncilDeliberation({
    title,
    summary,
    proactive_lens: lens,
    evidence,
    evidenceCount: evidenceTelemetry.recurrence_count,
    evidence_telemetry: evidenceTelemetry,
    recommendation,
    now,
  });
  return {
    id: `ingestion-${idBase}`,
    title,
    summary,
    created_at: now,
    stage: deliberation.confidence === 'high' ? 'opportunity' : 'trending',
    council_session_id: 'auto-ingestion',
    promotion_reason: `Detected from usage pattern analysis (${evidenceTelemetry.recurrence_count} signal${evidenceTelemetry.recurrence_count === 1 ? '' : 's'})`,
    proposing_model: 'ollama-cloud/qwen3.5:397b-cloud',
    origin_type: 'proactive',
    origin_tags: [lensMeta.tag, evidenceTelemetry.recurrence_count >= 2 ? '🔍 Pattern Detected' : '📊 Early Signal'],
    proactive_lens: lens,
    idea_ledger_id: `ledger-${idBase}`,
    evidence_telemetry: evidenceTelemetry,
    source_ids: evidenceTelemetry.source_ids,
    recurrence_count: evidenceTelemetry.recurrence_count,
    confidence_score: evidenceTelemetry.confidence_score,
    stale_signal_decay: evidenceTelemetry.stale_signal_decay,
    deliberation,
    council_confidence: deliberation.confidence,
    debate_summary: deliberation.debate_summary,
    key_disagreements: deliberation.key_disagreements,
    council_recommendation: deliberation.recommendation,
    passing_reasoning: deliberation.passing_reasoning,
    escalation_type: 'auto',
    session_type: 'scheduled',
    scheduled_for: now,
    session_time_of_day: 'evening',
    decision: null,
    is_hidden: false,
  };
}

export function buildCouncilItemsFromUsage(sessionsData = {}, opts = {}) {
  const now = opts.now ?? new Date().toISOString();
  const messages = allSessionMessages(sessionsData);
  const specs = [
    {
      title: 'OpenClaw Model Routing Optimization',
      summary: 'Frequent model/routing discussion suggests smarter model selection based on task complexity, latency, and cost.',
      lens: 'efficiency',
      terms: ['model', 'routing', 'fallback', 'token', 'cost', 'provider'],
      recommendation: 'Add read-only model routing telemetry first, then A/B test routing rules by task class and cost/latency outcome.',
    },
    {
      title: 'Telegram Webhook Integration',
      summary: 'Telegram-heavy operations would benefit from async processing, idempotency, and status feedback.',
      lens: 'infrastructure',
      terms: ['telegram', 'webhook', 'message', 'chat', 'async', 'queue'],
      recommendation: 'Back Telegram-triggered long jobs with the detached runner/outbox pattern, idempotency keys, and confirmation gates for side effects.',
    },
    {
      title: 'Docker Deployment Pipeline',
      summary: 'Repeated build/deploy signals suggest a repo-specific CI/CD pipeline with caching and approval gates.',
      lens: 'efficiency',
      terms: ['docker', 'build', 'deploy', 'pipeline', 'ci', 'registry'],
      recommendation: 'Start with one dashboard repository workflow: build, cache dependencies, run tests, and require approval for production pushes.',
    },
    {
      title: 'Self-Improvement Automation',
      summary: 'Self-improvement dashboard changes should flow from real usage evidence into reviewable improvement items.',
      lens: 'pattern',
      terms: ['self-improvement', 'dashboard', 'ingest', 'usage', 'r&d', 'council'],
      recommendation: 'Use this canonical ingestion API as the single source of truth, with dedupe, complete schema, and evidence snippets.',
    },
  ];

  return specs
    .map((spec, index) => ({
      spec,
      evidence: collectEvidenceMessages(messages, spec.terms),
      evidenceCount: countEvidenceMessages(messages, spec.terms),
      sourceIds: collectEvidenceSourceIds(messages, spec.terms),
      timestamps: collectEvidenceTimestamps(messages, spec.terms),
    }))
    .filter(({ evidenceCount }, index) => evidenceCount > 0 || index < 4)
    .map(({ spec, evidence, evidenceCount, sourceIds, timestamps }, index) =>
      makeItem({
        ...spec,
        index,
        evidence,
        evidenceCount: Math.max(evidenceCount, 1),
        sourceIds,
        timestamps,
        now,
      })
    );
}

// Real-model variant: asks a configured OpenClaw model to generate proposals from
// the operator's usage profile, then shapes them into the same item schema so the
// rest of the pipeline (normalize/merge/append/ledger) is unchanged. Falls back to
// the deterministic template proposals on any failure or when no model is available.
// Returns { items, mode: 'model' | 'template', model, reason }.
export async function buildCouncilItemsFromUsageWithModel(sessionsData = {}, opts = {}) {
  const now = opts.now ?? new Date().toISOString();

  let generation;
  try {
    generation = await generateCouncilProposals(sessionsData, {
      now,
      max: opts.max ?? 5,
      timeoutMs: opts.timeoutMs,
    });
  } catch (error) {
    generation = { ok: false, model: null, proposals: [], reason: error?.message || 'Council model error' };
  }

  if (!generation.ok || safeArray(generation.proposals).length === 0) {
    return {
      items: buildCouncilItemsFromUsage(sessionsData, { now }),
      mode: 'template',
      model: generation?.model ?? null,
      reason: generation?.reason ?? 'Fell back to template proposals',
    };
  }

  const items = generation.proposals.map((proposal, index) => {
    const lensMeta = LENSES[proposal.lens] ?? LENSES.pattern;
    const evidenceLine = `Evidence: model-generated from operator usage profile (${proposal.lens} lens)`;
    const debateSummary = safeArray(proposal.debate_summary).length
      ? [evidenceLine, ...proposal.debate_summary]
      : [evidenceLine];

    const base = makeItem({
      title: proposal.title,
      summary: proposal.summary,
      lens: proposal.lens,
      evidence: safeArray(proposal.debate_summary),
      evidenceCount: Math.max(safeArray(proposal.debate_summary).length, 1),
      sourceIds: [`council-model-${index + 1}`],
      timestamps: [now],
      recommendation: proposal.recommendation,
      now,
    });

    const keyDisagreements = safeArray(proposal.key_disagreements).length
      ? proposal.key_disagreements
      : base.key_disagreements;
    const recommendation = nonEmptyString(proposal.recommendation) ?? base.council_recommendation;
    const passingReasoning = nonEmptyString(proposal.passing_reasoning) ?? base.passing_reasoning;

    return {
      ...base,
      proposing_model: generation.model,
      council_session_id: 'council-model',
      promotion_reason: `Generated by ${generation.model} from operator usage profile`,
      origin_tags: [lensMeta.tag, '🤖 Model-generated'],
      council_confidence: proposal.confidence,
      stage: proposal.confidence === 'high' ? 'opportunity' : 'trending',
      summary: proposal.summary,
      debate_summary: debateSummary,
      key_disagreements: keyDisagreements,
      council_recommendation: recommendation,
      passing_reasoning: passingReasoning,
      // Mirror into deliberation so normalizeCouncilItem honours the model output.
      deliberation: {
        ...base.deliberation,
        confidence: proposal.confidence,
        debate_summary: debateSummary,
        key_disagreements: keyDisagreements,
        recommendation,
        passing_reasoning: passingReasoning,
      },
    };
  });

  return { items, mode: 'model', model: generation.model, reason: null };
}

export function normalizeCouncilItem(raw, opts = {}) {
  const now = opts.now ?? new Date().toISOString();
  const title = raw?.title ?? 'Untitled Improvement';
  const lens = raw?.proactive_lens ?? 'pattern';
  const lensMeta = LENSES[lens] ?? LENSES.pattern;
  const idBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
  const decision = normalizeDecisionValue(raw?.decision);
  const snoozeUntil = nonEmptyString(raw?.snooze_until);
  const hiddenUntil = nonEmptyString(raw?.hidden_until);
  const decisionHistory = normalizeDecisionHistory(raw?.decision_history);
  const legacyEvidence = safeArray(raw?.deliberation?.evidence).length
    ? safeArray(raw.deliberation.evidence)
    : safeArray(raw?.evidence).length
      ? safeArray(raw.evidence)
      : safeArray(raw?.debate_summary);
  const evidenceTelemetry = buildEvidenceTelemetry({
    title,
    evidence: raw?.evidence_telemetry?.evidence_snippets ?? raw?.deliberation?.evidence_telemetry?.evidence_snippets ?? legacyEvidence,
    sourceIds:
      raw?.evidence_telemetry?.source_ids ??
      raw?.deliberation?.evidence_telemetry?.source_ids ??
      raw?.source_ids ??
      [raw?.id ?? `ingestion-${idBase}`],
    recurrenceCount:
      raw?.evidence_telemetry?.recurrence_count ??
      raw?.deliberation?.evidence_telemetry?.recurrence_count ??
      raw?.recurrence_count ??
      safeArray(raw?.deliberation?.evidence).length ??
      safeArray(raw?.evidence).length,
    timestamps: [
      raw?.evidence_telemetry?.most_recent_at,
      raw?.evidence_telemetry?.oldest_at,
      raw?.deliberation?.evidence_telemetry?.most_recent_at,
      raw?.deliberation?.evidence_telemetry?.oldest_at,
      raw?.created_at,
    ],
    now,
  });
  const deliberation = buildCouncilDeliberation({
    title,
    summary: raw?.summary ?? 'No summary provided',
    proactive_lens: lens,
    evidence: legacyEvidence,
    evidenceCount: evidenceTelemetry.recurrence_count,
    evidence_telemetry: evidenceTelemetry,
    roles: raw?.deliberation?.roles,
    confidence: raw?.deliberation?.confidence,
    council_confidence: raw?.council_confidence,
    debate_summary: safeArray(raw?.deliberation?.debate_summary).length ? raw.deliberation.debate_summary : raw?.debate_summary,
    key_disagreements: safeArray(raw?.deliberation?.key_disagreements).length ? raw.deliberation.key_disagreements : raw?.key_disagreements,
    recommendation: raw?.deliberation?.recommendation ?? raw?.council_recommendation,
    passing_reasoning: raw?.deliberation?.passing_reasoning ?? raw?.passing_reasoning,
    now,
  });
  return {
    id: raw?.id ?? `ingestion-${idBase}`,
    title,
    summary: raw?.summary ?? 'No summary provided',
    created_at: raw?.created_at ?? now,
    stage: raw?.stage ?? 'trending',
    council_session_id: raw?.council_session_id ?? 'auto-ingestion',
    promotion_reason: raw?.promotion_reason ?? 'Detected from usage pattern analysis',
    proposing_model: raw?.proposing_model ?? 'ollama-cloud/qwen3.5:397b-cloud',
    origin_type: raw?.origin_type ?? 'proactive',
    origin_tags: safeArray(raw?.origin_tags).length ? raw.origin_tags : [lensMeta.tag],
    proactive_lens: lens,
    idea_ledger_id: raw?.idea_ledger_id ?? `ledger-${idBase}`,
    evidence_telemetry: evidenceTelemetry,
    source_ids: evidenceTelemetry.source_ids,
    recurrence_count: evidenceTelemetry.recurrence_count,
    confidence_score: evidenceTelemetry.confidence_score,
    stale_signal_decay: evidenceTelemetry.stale_signal_decay,
    deliberation,
    council_confidence: deliberation.confidence,
    debate_summary: deliberation.debate_summary,
    key_disagreements: deliberation.key_disagreements,
    council_recommendation: deliberation.recommendation,
    passing_reasoning: deliberation.passing_reasoning,
    escalation_type: raw?.escalation_type ?? 'auto',
    session_type: raw?.session_type ?? 'scheduled',
    scheduled_for: raw?.scheduled_for ?? now,
    session_time_of_day: raw?.session_time_of_day ?? 'evening',
    decision,
    decision_note: nonEmptyString(raw?.decision_note),
    decision_at: nonEmptyString(raw?.decision_at),
    decision_history: decisionHistory,
    snooze_until: snoozeUntil,
    hidden_until: hiddenUntil,
    is_hidden: decision === 'snoozed' ? true : Boolean(raw?.is_hidden),
    work_order_id: nonEmptyString(raw?.work_order_id),
    work_order_handoff_id: nonEmptyString(raw?.work_order_handoff_id),
  };
}

function itemRichness(item) {
  let score = 0;
  if (safeArray(item?.debate_summary).some((line) => String(line).startsWith('Evidence:'))) score += 4;
  if (safeArray(item?.key_disagreements).length > 0) score += 2;
  if (item?.council_recommendation && item.council_recommendation !== item.summary) score += 2;
  if (item?.passing_reasoning && !String(item.passing_reasoning).startsWith('Imported into')) score += 2;
  if (item?.council_confidence === 'high') score += 1;
  if (safeArray(item?.source_ids).length > 0) score += 2;
  if (item?.confidence_score > 0) score += 1;
  return score;
}

export function mergeCouncilItems(existing = [], incoming = [], opts = {}) {
  const byTitle = new Map();
  for (const item of [...safeArray(existing), ...safeArray(incoming)]) {
    const normalized = normalizeCouncilItem(item, opts);
    const key = normalizeText(normalized.title);
    const current = byTitle.get(key);
    if (!current) {
      byTitle.set(key, normalized);
      continue;
    }
    const richer = itemRichness(normalized) >= itemRichness(current) ? normalized : current;
    byTitle.set(key, {
      ...current,
      ...richer,
      id: current.id,
      created_at: current.created_at,
    });
  }
  return Array.from(byTitle.values());
}

export function transformActiveProjects(activeProjects = {}) {
  return Object.entries(activeProjects)
    .filter(([, project]) => project && typeof project === 'object')
    .filter(([, project]) => !['archived', 'completed', 'rejected', 'cancelled', 'canceled'].includes(normalizeText(project.status)))
    .map(([id, project]) => {
      const name = project.name || id;
      const tasks = safeArray(project.tasks);
      const completed = tasks.filter((task) => normalizeText(task?.status) === 'completed').length;
      return {
        id,
        title: String(name).replace(/-v\d+$/i, '').replace(/_/g, ' '),
        description: project.description || project.notes || 'No description available',
        status: normalizeText(project.status) === 'approved' ? 'Approved' : 'Pending',
        date: project.last_run || project.updated_at || project.created_at || project.started || new Date(0).toISOString(),
        created_at: project.created_at || project.started || null,
        completed_at: project.completed_at || null,
        tasks,
        completed_tasks: completed,
        agent_routing: project.agent_routing || null,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getActiveProjectsSourceCandidates(opts = {}) {
  const env = opts.env ?? process.env;
  const homeDir = opts.homeDir ?? os.homedir();
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const envPath = nonEmptyString(env?.[ACTIVE_PROJECTS_ENV_VAR]);
  const candidates = [
    envPath ? { type: 'env', path: envPath, label: ACTIVE_PROJECTS_ENV_VAR } : null,
    {
      type: 'workspace-memory',
      path: path.join(homeDir, '.openclaw', 'workspace', 'memory', 'active_projects.json'),
      label: 'workspace memory',
    },
    {
      type: 'repo-root',
      path: path.join(repoRoot, 'active_projects.json'),
      label: 'repo root',
    },
    {
      type: 'repo-memory',
      path: path.join(repoRoot, 'memory', 'active_projects.json'),
      label: 'repo memory',
    },
  ].filter(Boolean);

  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = nonEmptyString(candidate.path);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function discoverActiveProjectsSource(opts = {}) {
  const existsSync = opts.existsSync ?? fs.existsSync;
  const candidates = getActiveProjectsSourceCandidates(opts);
  const source = candidates.find((candidate) => existsSync(candidate.path)) ?? null;
  if (source) {
    return {
      status: 'found',
      source: { ...source, exists: true },
      candidates,
      reason: null,
    };
  }
  return {
    status: 'missing',
    source: candidates[0] ? { ...candidates[0], exists: false } : null,
    candidates,
    reason: 'No active projects source file found in preferred locations.',
  };
}

export function readActiveProjectsInventory(opts = {}) {
  const discovery = discoverActiveProjectsSource(opts);
  if (!discovery.source || discovery.status !== 'found') {
    return {
      projects: [],
      total: 0,
      status: 'missing',
      source: discovery.source,
      reason: discovery.reason,
      candidates: discovery.candidates,
    };
  }

  const data = readJsonFile(discovery.source.path, null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      projects: [],
      total: 0,
      status: 'invalid',
      source: discovery.source,
      reason: 'Active projects source did not contain the expected object map.',
      candidates: discovery.candidates,
    };
  }

  const projects = transformActiveProjects(data);
  if (projects.length === 0) {
    return {
      projects,
      total: 0,
      status: 'empty',
      source: discovery.source,
      reason: 'No active projects found in selected source.',
      candidates: discovery.candidates,
    };
  }

  return {
    projects,
    total: projects.length,
    status: 'ok',
    source: discovery.source,
    reason: null,
    candidates: discovery.candidates,
  };
}

export function findSessionFile(paths = SESSION_PATHS) {
  return paths.find((p) => fs.existsSync(p)) ?? null;
}

export function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function readCouncilItems(filePath = COUNCIL_ITEMS_PATH) {
  return mergeCouncilItems(readJsonFile(filePath, []), []);
}

export function buildCouncilWorkOrder(item, opts = {}) {
  const now = opts.now ?? new Date().toISOString();
  const normalizedItem = normalizeCouncilItem(item, { now });
  const plannerRole = safeArray(normalizedItem?.deliberation?.roles).find((role) => role?.role === 'implementation_planner') ?? null;
  const implementationSteps = extractDelimitedList(plannerRole?.points, 'Implementation step:');
  const acceptanceCriteria = extractDelimitedList(plannerRole?.points, 'Acceptance criteria:');

  return {
    id: councilWorkOrderId(normalizedItem),
    idempotency_key: councilWorkOrderIdempotencyKey(normalizedItem),
    council_item_id: normalizedItem.id,
    idea_ledger_id: normalizedItem.idea_ledger_id,
    title: normalizedItem.title,
    summary: normalizedItem.summary,
    description: `${normalizedItem.summary}\n\nRecommendation: ${normalizedItem.council_recommendation}`,
    status: normalizedItem.decision ?? 'approved',
    priority: normalizedItem.council_confidence,
    confidence: normalizedItem.council_confidence,
    created_at: normalizedItem.decision_at ?? now,
    updated_at: now,
    source_ids: safeArray(normalizedItem.source_ids),
    evidence_snippets: safeArray(normalizedItem?.evidence_telemetry?.evidence_snippets),
    recommendation: normalizedItem.council_recommendation,
    implementation_steps: implementationSteps,
    acceptance_criteria: acceptanceCriteria,
    decision_note: normalizedItem.decision_note,
    links: {
      council_item_id: normalizedItem.id,
      idea_ledger_id: normalizedItem.idea_ledger_id,
    },
    references: {
      council_item_title: normalizedItem.title,
      council_item_created_at: normalizedItem.created_at,
      council_decision_at: normalizedItem.decision_at ?? now,
    },
    deliberation: {
      roles: safeArray(normalizedItem?.deliberation?.roles),
      debate_summary: safeArray(normalizedItem.debate_summary),
      key_disagreements: safeArray(normalizedItem.key_disagreements),
      passing_reasoning: normalizedItem.passing_reasoning,
    },
  };
}

export function upsertCouncilWorkOrder(item, filePath = COUNCIL_WORK_ORDERS_PATH, opts = {}) {
  const workOrder = buildCouncilWorkOrder(item, opts);
  const existing = safeArray(readJsonFile(filePath, []));
  const matchIndex = existing.findIndex((entry) => {
    const sameId = nonEmptyString(entry?.id) === workOrder.id;
    const sameIdempotencyKey = nonEmptyString(entry?.idempotency_key) === workOrder.idempotency_key;
    const sameCouncilItem = nonEmptyString(entry?.council_item_id) === workOrder.council_item_id;
    return sameId || sameIdempotencyKey || sameCouncilItem;
  });

  const nextEntries = [...existing];
  if (matchIndex >= 0) {
    const current = nextEntries[matchIndex];
    nextEntries[matchIndex] = {
      ...current,
      ...workOrder,
      created_at: current?.created_at ?? workOrder.created_at,
      updated_at: opts.now ?? workOrder.updated_at,
    };
  } else {
    nextEntries.push(workOrder);
  }

  writeJsonFile(filePath, nextEntries);
  return nextEntries[matchIndex >= 0 ? matchIndex : nextEntries.length - 1];
}

export function appendCouncilItems(incoming, filePath = COUNCIL_ITEMS_PATH) {
  const existing = readJsonFile(filePath, []);
  const merged = mergeCouncilItems(existing, incoming);
  writeJsonFile(filePath, merged);
  return merged;
}

function normalizeIdeaLedger(ledger = {}) {
  return {
    proposed: safeArray(ledger.proposed),
    adopted: safeArray(ledger.adopted),
    rejected: safeArray(ledger.rejected),
    dormant: safeArray(ledger.dormant),
  };
}

export function upsertLedgerProposed(items, ledgerPath = IDEA_LEDGER_PATH) {
  const ledger = normalizeIdeaLedger(readJsonFile(ledgerPath, { proposed: [], adopted: [], rejected: [], dormant: [] }));
  const seen = new Set(ledger.proposed.map((item) => normalizeText(item.title)));
  for (const item of items) {
    const key = normalizeText(item.title);
    if (seen.has(key)) continue;
    seen.add(key);
    ledger.proposed.push({ ...item, added_at: new Date().toISOString() });
  }
  writeJsonFile(ledgerPath, ledger);
  return ledger;
}

export function appendCouncilDecisionAudit(entry, filePath = RD_COUNCIL_AUDIT_LOG_PATH) {
  return appendCommandAudit(
    {
      kind: 'rd-council-decision',
      ...entry,
    },
    filePath
  );
}

function moveIdeaLedgerEntryForDecision(ledger, item, historyEntry, now, workOrder = null) {
  const normalizedLedger = normalizeIdeaLedger(ledger);
  const targetBucket = RD_COUNCIL_DECISION_LEDGER_BUCKETS[historyEntry.decision];
  const entries = Object.values(normalizedLedger).flat();
  const matchingEntry = entries.find((entry) => entry?.idea_ledger_id === item.idea_ledger_id) ?? null;
  const workOrderId =
    nonEmptyString(workOrder?.id) ?? nonEmptyString(item?.work_order_id) ?? nonEmptyString(matchingEntry?.work_order_id);

  for (const bucket of Object.values(RD_COUNCIL_DECISION_LEDGER_BUCKETS)) {
    normalizedLedger[bucket] = normalizedLedger[bucket].filter((entry) => entry?.idea_ledger_id !== item.idea_ledger_id);
  }
  normalizedLedger.proposed = normalizedLedger.proposed.filter((entry) => entry?.idea_ledger_id !== item.idea_ledger_id);

  const nextEntry = {
    ...(matchingEntry ?? {}),
    id: matchingEntry?.id ?? item.id,
    title: matchingEntry?.title ?? item.title,
    summary: matchingEntry?.summary ?? item.summary,
    idea_ledger_id: item.idea_ledger_id,
    decision: historyEntry.decision,
    decision_note: historyEntry.note,
    decision_at: now,
    decision_history: item.decision_history,
    snooze_until: historyEntry.snooze_until,
    hidden_until: item.hidden_until,
    status: targetBucket,
    updated_at: now,
    work_order_id: workOrderId,
    work_order_handoff_id: workOrderId,
  };
  normalizedLedger[targetBucket].push(nextEntry);
  return normalizedLedger;
}

export function applyCouncilDecision(args = {}) {
  const {
    itemId,
    decision,
    note = null,
    actor = 'system',
    snoozeUntil = null,
    now = new Date().toISOString(),
    councilPath = COUNCIL_ITEMS_PATH,
    ledgerPath = IDEA_LEDGER_PATH,
    auditPath = RD_COUNCIL_AUDIT_LOG_PATH,
    workOrdersPath = COUNCIL_WORK_ORDERS_PATH,
  } = args;

  if (!nonEmptyString(itemId)) {
    throw new Error('R&D Council item id is required.');
  }

  const normalizedDecision = normalizeDecisionValue(decision);
  if (!normalizedDecision) {
    throw new Error(`Unsupported R&D Council decision: ${decision}`);
  }

  const items = safeArray(readJsonFile(councilPath, [])).map((item) => normalizeCouncilItem(item, { now }));
  const itemIndex = items.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) {
    throw new Error(`R&D Council item not found: ${itemId}`);
  }

  const currentItem = items[itemIndex];
  const historyEntry = {
    decision: normalizedDecision,
    note: nonEmptyString(note),
    actor: nonEmptyString(actor) ?? 'system',
    at: now,
    snooze_until: normalizedDecision === 'snoozed' ? nonEmptyString(snoozeUntil) : null,
  };

  const nextItemInput = {
    ...currentItem,
    decision: normalizedDecision,
    decision_note: historyEntry.note,
    decision_at: now,
    decision_history: [...safeArray(currentItem.decision_history), historyEntry],
    snooze_until: historyEntry.snooze_until,
    hidden_until: historyEntry.snooze_until,
    is_hidden: normalizedDecision === 'snoozed',
  };

  const approvedWorkOrder = normalizedDecision === 'approved' ? upsertCouncilWorkOrder(nextItemInput, workOrdersPath, { now }) : null;
  const updatedItem = normalizeCouncilItem(
    {
      ...nextItemInput,
      work_order_id: approvedWorkOrder?.id ?? currentItem.work_order_id,
      work_order_handoff_id: approvedWorkOrder?.id ?? currentItem.work_order_handoff_id,
    },
    { now }
  );

  items[itemIndex] = updatedItem;
  writeJsonFile(councilPath, items);

  const ledger = moveIdeaLedgerEntryForDecision(readJsonFile(ledgerPath, {}), updatedItem, historyEntry, now, approvedWorkOrder);
  writeJsonFile(ledgerPath, ledger);

  const auditEntry = appendCouncilDecisionAudit(
    {
      item_id: updatedItem.id,
      idea_ledger_id: updatedItem.idea_ledger_id,
      title: updatedItem.title,
      decision: normalizedDecision,
      note: historyEntry.note,
      actor: historyEntry.actor,
      snooze_until: historyEntry.snooze_until,
    },
    auditPath
  );

  return {
    item: updatedItem,
    ledger,
    auditEntry,
    workOrder: approvedWorkOrder,
  };
}

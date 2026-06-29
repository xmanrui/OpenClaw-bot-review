export const REPO_ROOT: string;
export const COUNCIL_ITEMS_PATH: string;
export const IDEA_LEDGER_PATH: string;
export const COUNCIL_WORK_ORDERS_PATH: string;
export const ACTIVE_PROJECTS_ENV_VAR: string;
export const ACTIVE_PROJECTS_PATH: string;
export const COMMAND_AUDIT_LOG_PATH: string;
export const RD_COUNCIL_AUDIT_LOG_PATH: string;
export const RD_COUNCIL_DECISION_LEDGER_BUCKETS: Record<string, string>;
export const SELF_IMPROVEMENT_COMMANDS: Record<string, any>;
export function getCommandConfig(commandId: string): any | null;
export function validateCommandRequest(commandId: string, body?: Record<string, any>): any;
export function appendCommandAudit(entry: Record<string, any>, filePath?: string): Record<string, any>;
export function appendCouncilDecisionAudit(entry: Record<string, any>, filePath?: string): Record<string, any>;
export function commandOk(args: { command?: any; message: string; output?: string[] | string; details?: Record<string, any>; version?: string }): any;
export function commandError(args: { commandId?: string; message: string; code?: string; details?: Record<string, any>; status?: number }): any;
export function validateLocalOperatorRequest(request: any, opts?: { allowRemote?: boolean; allowUnauthenticatedLocal?: boolean }): any;
export function localOperatorDeniedPayload(reason?: string): any;
export function buildEvidenceTelemetry(input?: any): any;
export function buildCouncilDeliberation(input?: any): any;
export function summarizeCouncilItemOperatorState(raw: any, opts?: any): any;
export function getCouncilItemActionAvailability(raw: any, opts?: any): any;
export function formatCouncilDecisionApiError(decision: string, input?: any): string;
export function buildCouncilItemsFromUsage(sessionsData?: any, opts?: any): any[];
export function buildCouncilItemsFromUsageWithModel(
  sessionsData?: any,
  opts?: { now?: string; max?: number; timeoutMs?: number }
): Promise<{ items: any[]; mode: "model" | "template"; model: string | null; reason: string | null }>;
export function normalizeCouncilItem(raw: any, opts?: any): any;
export function mergeCouncilItems(existing?: any[], incoming?: any[], opts?: any): any[];
export function transformActiveProjects(activeProjects?: Record<string, any>): any[];
export function getActiveProjectsSourceCandidates(opts?: any): any[];
export function discoverActiveProjectsSource(opts?: any): any;
export function readActiveProjectsInventory(opts?: any): any;
export function findSessionFile(paths?: string[]): string | null;
export function readJsonFile(filePath: string, fallback: any): any;
export function writeJsonFile(filePath: string, value: any): void;
export function readCouncilItems(filePath?: string): any[];
export function buildCouncilWorkOrder(item: any, opts?: any): any;
export function upsertCouncilWorkOrder(item: any, filePath?: string, opts?: any): any;
export function appendCouncilItems(incoming: any[], filePath?: string): any[];
export function upsertLedgerProposed(items: any[], ledgerPath?: string): any;
export function applyCouncilDecision(args?: {
  itemId: string;
  decision: string;
  note?: string | null;
  actor?: string | null;
  snoozeUntil?: string | null;
  now?: string;
  councilPath?: string;
  ledgerPath?: string;
  auditPath?: string;
  workOrdersPath?: string;
}): {
  item: any;
  ledger: any;
  auditEntry: any;
  workOrder: any;
};

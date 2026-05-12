import { getTelegramAcquisitionLocalControlSummary } from '@/lib/god-plan/services/telegram-acquisition-local-control-service'

function tone(status: string) {
  if (status.includes('ready')) return 'border-emerald-500/50 text-emerald-300'
  if (status.includes('blocked')) return 'border-amber-500/50 text-amber-200'
  return 'border-sky-500/50 text-sky-200'
}
export default function TelegramAcquisitionLocalControlPage() {
  const control = getTelegramAcquisitionLocalControlSummary()

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Telegram Acquisition Local Control</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            One local-only dashboard for TG acquisition readiness, user-login handoff, post-login acceptance, and send authorization separation.
          </p>
        </div>
        <span className={'rounded-lg border px-3 py-2 text-sm ' + tone(control.status)}>status: {control.status}</span>
      </div>

      <section className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{control.summary}</p>
      </section>

      <section className="mb-4 rounded-xl border border-emerald-500/30 bg-[var(--card)] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-semibold">First-version MVP safety loop</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Authorized visible messages become lead context, agent proposals, human review, guarded dry-run outbound jobs, and analytics. This is not bulk messaging; externalSent=false remains the default in local mode.
            </p>
          </div>
          <span className="rounded-lg border border-amber-500/50 px-3 py-2 text-sm text-amber-200">human review required</span>
        </div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-6">
          <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-emerald-300 hover:border-emerald-500/50" href="/groups">Groups</a>
          <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-emerald-300 hover:border-emerald-500/50" href="/leads">Leads</a>
          <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-emerald-300 hover:border-emerald-500/50" href="/review">Review</a>
          <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-emerald-300 hover:border-emerald-500/50" href="/outbound-guard">Outbound guard</a>
          <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-emerald-300 hover:border-emerald-500/50" href="/outbound-jobs">Outbound jobs</a>
          <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-emerald-300 hover:border-emerald-500/50" href="/stats">Stats</a>
        </div>
      </section>

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs uppercase text-[var(--text-muted)]">Local only</p><p className="mt-2 text-xl font-semibold">{String(control.localOnly)}</p></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs uppercase text-[var(--text-muted)]">Dry-run only</p><p className="mt-2 text-xl font-semibold">{String(control.dryRunOnly)}</p></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs uppercase text-[var(--text-muted)]">User login</p><p className="mt-2 text-xl font-semibold">required</p></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs uppercase text-[var(--text-muted)]">Send authorized</p><p className="mt-2 text-xl font-semibold">{String(control.sendAuthorized)}</p></div>
      </section>

      <section className="mb-4 grid gap-3 md:grid-cols-2">
        {control.steps.map((step) => (
          <a key={step.key} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-emerald-500/50" href={step.href}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{step.label}</h2>
              <span className={'rounded border px-2 py-1 text-xs ' + tone(step.status)}>{step.status}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{step.summary}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">readyForNextStep={String(step.readyForNextStep)}</p>
          </a>
        ))}
      </section>

      <section className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">Completion estimate</h2>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-access-plan">Open admin customer access plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-access-plan-evidence">Open admin customer access plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-access-plan-evidence-acceptance-gate">Open admin customer access evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-port-allocation-plan">Open admin port allocation plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-port-allocation-plan-evidence">Open admin port allocation plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-port-allocation-plan-evidence-acceptance-gate">Open admin port allocation evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-registry">Open admin local registry</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-self-use-access">Open admin local self-use access</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-entitlement-plan">Open admin customer entitlement plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-entitlement-plan-evidence">Open admin customer entitlement plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-entitlement-plan-evidence-acceptance-gate">Open admin customer entitlement evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-entitlement-registry">Open admin entitlement registry</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-access-activation-plan">Open admin customer access activation plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-access-activation-plan-evidence">Open admin customer access activation plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-access-activation-plan-evidence-acceptance-gate">Open admin customer access activation evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-activation-ledger">Open admin activation ledger</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-suspension-board">Open admin suspension board</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-kill-switch-board">Open admin kill switch board</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-audit-timeline">Open admin audit timeline</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-operator-dashboard">Open admin operator dashboard</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-health-summary">Open admin health summary</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-access-readiness-matrix">Open admin access readiness matrix</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-preflight">Open admin local runtime preflight</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-scaffold-contract">Open admin local runtime scaffold contract</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-scaffold-contract-evidence">Open admin local runtime scaffold contract evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-scaffold-contract-evidence-acceptance-gate">Open admin local runtime scaffold contract evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-skeleton-plan">Open admin local runtime skeleton plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-skeleton-plan-evidence">Open admin local runtime skeleton plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-skeleton-plan-evidence-acceptance-gate">Open admin local runtime skeleton evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-dry-run-harness-plan">Open admin local runtime dry-run harness plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-dry-run-harness-plan-evidence">Open admin local runtime dry-run harness plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-dry-run-harness-plan-evidence-acceptance-gate">Open admin local runtime dry-run harness evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-dry-run-harness-closure-plan">Open admin local runtime dry-run harness closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-dry-run-harness-closure-plan-evidence">Open admin local runtime dry-run harness closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-dry-run-harness-closure-plan-evidence-acceptance-gate">Open admin local runtime dry-run harness closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-dry-run-completion-plan">Open admin local runtime admin access dry-run completion plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-dry-run-completion-plan-evidence">Open admin local runtime admin access dry-run completion plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-dry-run-completion-plan-evidence-acceptance-gate">Open admin local runtime admin access dry-run completion evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-dry-run-completion-closure-plan">Open admin local runtime admin access dry-run completion closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-dry-run-completion-closure-plan-evidence">Open admin local runtime admin access dry-run completion closure evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-dry-run-completion-closure-plan-evidence-acceptance-gate">Open admin local runtime admin access dry-run completion closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-operational-readiness-plan">Open admin local runtime admin access operational readiness plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-operational-readiness-plan-evidence">Open admin local runtime admin access operational readiness plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-operational-readiness-plan-evidence-acceptance-gate">Open admin local runtime admin access operational readiness evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-plan">Open admin local runtime admin access service contract plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-plan-evidence">Open admin local runtime admin access service contract plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-closure-plan">Open admin local runtime admin access service contract closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-closure-plan-evidence">Open admin local runtime admin access service contract closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-closure-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-plan">Open admin local runtime admin access service contract completion plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-plan-evidence">Open admin local runtime admin access service contract completion plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-plan">Open admin local runtime admin access service contract completion closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-plan-evidence">Open admin local runtime admin access service contract completion closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-plan">Open admin local runtime admin access service contract completion closure acceptance plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion closure acceptance evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-plan">Open admin local runtime admin access service contract completion closure acceptance closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion closure acceptance closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-closure-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-closure-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-closure-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-closure-closure-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-local-runtime-admin-access-service-contract-completion-closure-acceptance-closure-closure-closure-closure-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c4-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c5-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c5-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c5-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c6-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c6-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c6-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c7-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c7-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c7-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c8-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c8-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c8-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c9-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c9-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c9-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c10-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c10-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c10-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c11-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c11-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c11-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c12-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c12-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c12-plan-evidence-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c13-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c13-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c13-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c14-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c14-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c14-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c15-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c15-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c15-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c16-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c16-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c16-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c17-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c17-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c17-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c18-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c18-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c18-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c19-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c19-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c19-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c20-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c20-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c20-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c21-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c21-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c21-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c22-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c22-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c22-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c23-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c23-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c23-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c24-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c24-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c24-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c25-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c25-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c25-plan-evidence-gate">Open admin local runtime access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c26-plan">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c26-plan-evidence">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c26-plan-evidence-acceptance-gate">Open admin local runtime admin access service contract completion closure acceptance closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure closure accept</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c27-plan">Open admin local runtime c27 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c27-plan-evidence">Open admin local runtime c27 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c27-plan-evidence-acceptance-gate">Open admin local runtime c27 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c28-plan">Open admin local runtime c28 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c28-plan-evidence">Open admin local runtime c28 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c28-plan-evidence-acceptance-gate">Open admin local runtime c28 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c29-plan">Open admin local runtime c29 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c29-plan-evidence">Open admin local runtime c29 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c29-plan-evidence-acceptance-gate">Open admin local runtime c29 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c30-plan">Open admin local runtime c30 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c30-plan-evidence">Open admin local runtime c30 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c30-plan-evidence-acceptance-gate">Open admin local runtime c30 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c31-plan">Open admin local runtime c31 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c31-plan-evidence">Open admin local runtime c31 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c31-plan-evidence-acceptance-gate">Open admin local runtime c31 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c32-plan">Open admin local runtime c32 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c32-plan-evidence">Open admin local runtime c32 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c32-plan-evidence-acceptance-gate">Open admin local runtime c32 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c33-plan">Open admin local runtime c33 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c33-plan-evidence">Open admin local runtime c33 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c33-plan-evidence-acceptance-gate">Open admin local runtime c33 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c34-plan">Open admin local runtime c34 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c34-plan-evidence">Open admin local runtime c34 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c34-plan-evidence-acceptance-gate">Open admin local runtime c34 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c35-plan">Open admin local runtime c35 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c35-plan-evidence">Open admin local runtime c35 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c35-plan-evidence-acceptance-gate">Open admin local runtime c35 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c36-plan">Open admin local runtime c36 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c36-plan-evidence">Open admin local runtime c36 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c36-plan-evidence-acceptance-gate">Open admin local runtime c36 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c37-plan">Open admin local runtime c37 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c37-plan-evidence">Open admin local runtime c37 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c37-plan-evidence-acceptance-gate">Open admin local runtime c37 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c38-plan">Open admin local runtime c38 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c38-plan-evidence">Open admin local runtime c38 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c38-plan-evidence-acceptance-gate">Open admin local runtime c38 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c39-plan">Open admin local runtime c39 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c39-plan-evidence">Open admin local runtime c39 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c39-plan-evidence-acceptance-gate">Open admin local runtime c39 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c40-plan">Open admin local runtime c40 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c40-plan-evidence">Open admin local runtime c40 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c40-plan-evidence-acceptance-gate">Open admin local runtime c40 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c41-plan">Open admin local runtime c41 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c41-plan-evidence">Open admin local runtime c41 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c41-plan-evidence-acceptance-gate">Open admin local runtime c41 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c42-plan">Open admin local runtime c42 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c42-plan-evidence">Open admin local runtime c42 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c42-plan-evidence-acceptance-gate">Open admin local runtime c42 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c43-plan">Open admin local runtime c43 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c43-plan-evidence">Open admin local runtime c43 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c43-plan-evidence-acceptance-gate">Open admin local runtime c43 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c44-plan">Open admin local runtime c44 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c44-plan-evidence">Open admin local runtime c44 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c44-plan-evidence-acceptance-gate">Open admin local runtime c44 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c45-plan">Open admin local runtime c45 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c45-plan-evidence">Open admin local runtime c45 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c45-plan-evidence-acceptance-gate">Open admin local runtime c45 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c46-plan">Open admin local runtime c46 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c46-plan-evidence">Open admin local runtime c46 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c46-plan-evidence-acceptance-gate">Open admin local runtime c46 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c47-plan">Open admin local runtime c47 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c47-plan-evidence">Open admin local runtime c47 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c47-plan-evidence-acceptance-gate">Open admin local runtime c47 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c48-plan">Open admin local runtime c48 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c48-plan-evidence">Open admin local runtime c48 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c48-plan-evidence-acceptance-gate">Open admin local runtime c48 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c49-plan">Open admin local runtime c49 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c49-plan-evidence">Open admin local runtime c49 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c49-plan-evidence-acceptance-gate">Open admin local runtime c49 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c50-plan">Open admin local runtime c50 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c50-plan-evidence">Open admin local runtime c50 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c50-plan-evidence-acceptance-gate">Open admin local runtime c50 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c51-plan">Open admin local runtime c51 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c51-plan-evidence">Open admin local runtime c51 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c51-plan-evidence-acceptance-gate">Open admin local runtime c51 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c52-plan">Open admin local runtime c52 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c52-plan-evidence">Open admin local runtime c52 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c52-plan-evidence-acceptance-gate">Open admin local runtime c52 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c53-plan">Open admin local runtime c53 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c53-plan-evidence">Open admin local runtime c53 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c53-plan-evidence-acceptance-gate">Open admin local runtime c53 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c54-plan">Open admin local runtime c54 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c54-plan-evidence">Open admin local runtime c54 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c54-plan-evidence-acceptance-gate">Open admin local runtime c54 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c55-plan">Open admin local runtime c55 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c55-plan-evidence">Open admin local runtime c55 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c55-plan-evidence-acceptance-gate">Open admin local runtime c55 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c56-plan">Open admin local runtime c56 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c56-plan-evidence">Open admin local runtime c56 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c56-plan-evidence-acceptance-gate">Open admin local runtime c56 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c57-plan">Open admin local runtime c57 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c57-plan-evidence">Open admin local runtime c57 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c57-plan-evidence-acceptance-gate">Open admin local runtime c57 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c58-plan">Open admin local runtime c58 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c58-plan-evidence">Open admin local runtime c58 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c58-plan-evidence-acceptance-gate">Open admin local runtime c58 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c59-plan">Open admin local runtime c59 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c59-plan-evidence">Open admin local runtime c59 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c59-plan-evidence-acceptance-gate">Open admin local runtime c59 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c60-plan">Open admin local runtime c60 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c60-plan-evidence">Open admin local runtime c60 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c60-plan-evidence-acceptance-gate">Open admin local runtime c60 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c61-plan">Open admin local runtime c61 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c61-plan-evidence">Open admin local runtime c61 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c61-plan-evidence-acceptance-gate">Open admin local runtime c61 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c62-plan">Open admin local runtime c62 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c62-plan-evidence">Open admin local runtime c62 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c62-plan-evidence-acceptance-gate">Open admin local runtime c62 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c63-plan">Open admin local runtime c63 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c63-plan-evidence">Open admin local runtime c63 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c63-plan-evidence-acceptance-gate">Open admin local runtime c63 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c64-plan">Open admin local runtime c64 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c64-plan-evidence">Open admin local runtime c64 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c64-plan-evidence-acceptance-gate">Open admin local runtime c64 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c65-plan">Open admin local runtime c65 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c65-plan-evidence">Open admin local runtime c65 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c65-plan-evidence-acceptance-gate">Open admin local runtime c65 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c66-plan">Open admin local runtime c66 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c66-plan-evidence">Open admin local runtime c66 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c66-plan-evidence-acceptance-gate">Open admin local runtime c66 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c67-plan">Open admin local runtime c67 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c67-plan-evidence">Open admin local runtime c67 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c67-plan-evidence-acceptance-gate">Open admin local runtime c67 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c68-plan">Open admin local runtime c68 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c68-plan-evidence">Open admin local runtime c68 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c68-plan-evidence-acceptance-gate">Open admin local runtime c68 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c69-plan">Open admin local runtime c69 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c69-plan-evidence">Open admin local runtime c69 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c69-plan-evidence-acceptance-gate">Open admin local runtime c69 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c70-plan">Open admin local runtime c70 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c70-plan-evidence">Open admin local runtime c70 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c70-plan-evidence-acceptance-gate">Open admin local runtime c70 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c71-plan">Open admin local runtime c71 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c71-plan-evidence">Open admin local runtime c71 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c71-plan-evidence-acceptance-gate">Open admin local runtime c71 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c72-plan">Open admin local runtime c72 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c72-plan-evidence">Open admin local runtime c72 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c72-plan-evidence-acceptance-gate">Open admin local runtime c72 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c73-plan">Open admin local runtime c73 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c73-plan-evidence">Open admin local runtime c73 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c73-plan-evidence-acceptance-gate">Open admin local runtime c73 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c74-plan">Open admin local runtime c74 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c74-plan-evidence">Open admin local runtime c74 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c74-plan-evidence-acceptance-gate">Open admin local runtime c74 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c75-plan">Open admin local runtime c75 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c75-plan-evidence">Open admin local runtime c75 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c75-plan-evidence-acceptance-gate">Open admin local runtime c75 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c76-plan">Open admin local runtime c76 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c76-plan-evidence">Open admin local runtime c76 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c76-plan-evidence-acceptance-gate">Open admin local runtime c76 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c77-plan">Open admin local runtime c77 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c77-plan-evidence">Open admin local runtime c77 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c77-plan-evidence-acceptance-gate">Open admin local runtime c77 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c78-plan">Open admin local runtime c78 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c78-plan-evidence">Open admin local runtime c78 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c78-plan-evidence-acceptance-gate">Open admin local runtime c78 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c79-plan">Open admin local runtime c79 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c79-plan-evidence">Open admin local runtime c79 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c79-plan-evidence-acceptance-gate">Open admin local runtime c79 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c80-plan">Open admin local runtime c80 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c80-plan-evidence">Open admin local runtime c80 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c80-plan-evidence-acceptance-gate">Open admin local runtime c80 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c81-plan">Open admin local runtime c81 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c81-plan-evidence">Open admin local runtime c81 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c81-plan-evidence-acceptance-gate">Open admin local runtime c81 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c82-plan">Open admin local runtime c82 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c82-plan-evidence">Open admin local runtime c82 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c82-plan-evidence-acceptance-gate">Open admin local runtime c82 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c83-plan">Open admin local runtime c83 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c83-plan-evidence">Open admin local runtime c83 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c83-plan-evidence-acceptance-gate">Open admin local runtime c83 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c84-plan">Open admin local runtime c84 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c84-plan-evidence">Open admin local runtime c84 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c84-plan-evidence-acceptance-gate">Open admin local runtime c84 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c85-plan">Open admin local runtime c85 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c85-plan-evidence">Open admin local runtime c85 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c85-plan-evidence-acceptance-gate">Open admin local runtime c85 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c86-plan">Open admin local runtime c86 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c86-plan-evidence">Open admin local runtime c86 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c86-plan-evidence-acceptance-gate">Open admin local runtime c86 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c87-plan">Open admin local runtime c87 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c87-plan-evidence">Open admin local runtime c87 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c87-plan-evidence-acceptance-gate">Open admin local runtime c87 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c88-plan">Open admin local runtime c88 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c88-plan-evidence">Open admin local runtime c88 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c88-plan-evidence-acceptance-gate">Open admin local runtime c88 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c89-plan">Open admin local runtime c89 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c89-plan-evidence">Open admin local runtime c89 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c89-plan-evidence-acceptance-gate">Open admin local runtime c89 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c90-plan">Open admin local runtime c90 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c90-plan-evidence">Open admin local runtime c90 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c90-plan-evidence-acceptance-gate">Open admin local runtime c90 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c91-plan">Open admin local runtime c91 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c91-plan-evidence">Open admin local runtime c91 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c91-plan-evidence-acceptance-gate">Open admin local runtime c91 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c92-plan">Open admin local runtime c92 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c92-plan-evidence">Open admin local runtime c92 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c92-plan-evidence-acceptance-gate">Open admin local runtime c92 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c93-plan">Open admin local runtime c93 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c93-plan-evidence">Open admin local runtime c93 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c93-plan-evidence-acceptance-gate">Open admin local runtime c93 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c94-plan">Open admin local runtime c94 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c94-plan-evidence">Open admin local runtime c94 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c94-plan-evidence-acceptance-gate">Open admin local runtime c94 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c95-plan">Open admin local runtime c95 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c95-plan-evidence">Open admin local runtime c95 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c95-plan-evidence-acceptance-gate">Open admin local runtime c95 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c96-plan">Open admin local runtime c96 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c96-plan-evidence">Open admin local runtime c96 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c96-plan-evidence-acceptance-gate">Open admin local runtime c96 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c97-plan">Open admin local runtime c97 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c97-plan-evidence">Open admin local runtime c97 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c97-plan-evidence-acceptance-gate">Open admin local runtime c97 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c98-plan">Open admin local runtime c98 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c98-plan-evidence">Open admin local runtime c98 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c98-plan-evidence-acceptance-gate">Open admin local runtime c98 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c99-plan">Open admin local runtime c99 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c99-plan-evidence">Open admin local runtime c99 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c99-plan-evidence-acceptance-gate">Open admin local runtime c99 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c100-plan">Open admin local runtime c100 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c100-plan-evidence">Open admin local runtime c100 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c100-plan-evidence-acceptance-gate">Open admin local runtime c100 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c101-plan">Open admin local runtime c101 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c101-plan-evidence">Open admin local runtime c101 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c101-plan-evidence-acceptance-gate">Open admin local runtime c101 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c102-plan">Open admin local runtime c102 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c102-plan-evidence">Open admin local runtime c102 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c102-plan-evidence-acceptance-gate">Open admin local runtime c102 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c103-plan">Open admin local runtime c103 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c103-plan-evidence">Open admin local runtime c103 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c103-plan-evidence-acceptance-gate">Open admin local runtime c103 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c104-plan">Open admin local runtime c104 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c104-plan-evidence">Open admin local runtime c104 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c104-plan-evidence-acceptance-gate">Open admin local runtime c104 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c105-plan">Open admin local runtime c105 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c105-plan-evidence">Open admin local runtime c105 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c105-plan-evidence-acceptance-gate">Open admin local runtime c105 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c106-plan">Open admin local runtime c106 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c106-plan-evidence">Open admin local runtime c106 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c106-plan-evidence-acceptance-gate">Open admin local runtime c106 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c107-plan">Open admin local runtime c107 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c107-plan-evidence">Open admin local runtime c107 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c107-plan-evidence-acceptance-gate">Open admin local runtime c107 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c108-plan">Open admin local runtime c108 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c108-plan-evidence">Open admin local runtime c108 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c108-plan-evidence-acceptance-gate">Open admin local runtime c108 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c109-plan">Open admin local runtime c109 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c109-plan-evidence">Open admin local runtime c109 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c109-plan-evidence-acceptance-gate">Open admin local runtime c109 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c110-plan">Open admin local runtime c110 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c110-plan-evidence">Open admin local runtime c110 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c110-plan-evidence-acceptance-gate">Open admin local runtime c110 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c111-plan">Open admin local runtime c111 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c111-plan-evidence">Open admin local runtime c111 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c111-plan-evidence-acceptance-gate">Open admin local runtime c111 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c112-plan">Open admin local runtime c112 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c112-plan-evidence">Open admin local runtime c112 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c112-plan-evidence-acceptance-gate">Open admin local runtime c112 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c113-plan">Open admin local runtime c113 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c113-plan-evidence">Open admin local runtime c113 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c113-plan-evidence-acceptance-gate">Open admin local runtime c113 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c114-plan">Open admin local runtime c114 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c114-plan-evidence">Open admin local runtime c114 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c114-plan-evidence-acceptance-gate">Open admin local runtime c114 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c115-plan">Open admin local runtime c115 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c115-plan-evidence">Open admin local runtime c115 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c115-plan-evidence-acceptance-gate">Open admin local runtime c115 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c116-plan">Open admin local runtime c116 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c116-plan-evidence">Open admin local runtime c116 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c116-plan-evidence-acceptance-gate">Open admin local runtime c116 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c117-plan">Open admin local runtime c117 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c117-plan-evidence">Open admin local runtime c117 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c117-plan-evidence-acceptance-gate">Open admin local runtime c117 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c118-plan">Open admin local runtime c118 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c118-plan-evidence">Open admin local runtime c118 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c118-plan-evidence-acceptance-gate">Open admin local runtime c118 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c119-plan">Open admin local runtime c119 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c119-plan-evidence">Open admin local runtime c119 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c119-plan-evidence-acceptance-gate">Open admin local runtime c119 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c120-plan">Open admin local runtime c120 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c120-plan-evidence">Open admin local runtime c120 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c120-plan-evidence-acceptance-gate">Open admin local runtime c120 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c121-plan">Open admin local runtime c121 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c121-plan-evidence">Open admin local runtime c121 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c121-plan-evidence-acceptance-gate">Open admin local runtime c121 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c122-plan">Open admin local runtime c122 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c122-plan-evidence">Open admin local runtime c122 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c122-plan-evidence-acceptance-gate">Open admin local runtime c122 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c123-plan">Open admin local runtime c123 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c123-plan-evidence">Open admin local runtime c123 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c123-plan-evidence-acceptance-gate">Open admin local runtime c123 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c124-plan">Open admin local runtime c124 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c124-plan-evidence">Open admin local runtime c124 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c124-plan-evidence-acceptance-gate">Open admin local runtime c124 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c125-plan">Open admin local runtime c125 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c125-plan-evidence">Open admin local runtime c125 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c125-plan-evidence-acceptance-gate">Open admin local runtime c125 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c126-plan">Open admin local runtime c126 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c126-plan-evidence">Open admin local runtime c126 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c126-plan-evidence-acceptance-gate">Open admin local runtime c126 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c127-plan">Open admin local runtime c127 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c127-plan-evidence">Open admin local runtime c127 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c127-plan-evidence-acceptance-gate">Open admin local runtime c127 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c128-plan">Open admin local runtime c128 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c128-plan-evidence">Open admin local runtime c128 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c128-plan-evidence-acceptance-gate">Open admin local runtime c128 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c129-plan">Open admin local runtime c129 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c129-plan-evidence">Open admin local runtime c129 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c129-plan-evidence-acceptance-gate">Open admin local runtime c129 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c130-plan">Open admin local runtime c130 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c130-plan-evidence">Open admin local runtime c130 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c130-plan-evidence-acceptance-gate">Open admin local runtime c130 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c131-plan">Open admin local runtime c131 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c131-plan-evidence">Open admin local runtime c131 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c131-plan-evidence-acceptance-gate">Open admin local runtime c131 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c132-plan">Open admin local runtime c132 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c132-plan-evidence">Open admin local runtime c132 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c132-plan-evidence-acceptance-gate">Open admin local runtime c132 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c133-plan">Open admin local runtime c133 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c133-plan-evidence">Open admin local runtime c133 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c133-plan-evidence-acceptance-gate">Open admin local runtime c133 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c134-plan">Open admin local runtime c134 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c134-plan-evidence">Open admin local runtime c134 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c134-plan-evidence-acceptance-gate">Open admin local runtime c134 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c135-plan">Open admin local runtime c135 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c135-plan-evidence">Open admin local runtime c135 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c135-plan-evidence-acceptance-gate">Open admin local runtime c135 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c136-plan">Open admin local runtime c136 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c136-plan-evidence">Open admin local runtime c136 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c136-plan-evidence-acceptance-gate">Open admin local runtime c136 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c137-plan">Open admin local runtime c137 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c137-plan-evidence">Open admin local runtime c137 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c137-plan-evidence-acceptance-gate">Open admin local runtime c137 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c138-plan">Open admin local runtime c138 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c138-plan-evidence">Open admin local runtime c138 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c138-plan-evidence-acceptance-gate">Open admin local runtime c138 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c139-plan">Open admin local runtime c139 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c139-plan-evidence">Open admin local runtime c139 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c139-plan-evidence-acceptance-gate">Open admin local runtime c139 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c140-plan">Open admin local runtime c140 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c140-plan-evidence">Open admin local runtime c140 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c140-plan-evidence-acceptance-gate">Open admin local runtime c140 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c141-plan">Open admin local runtime c141 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c141-plan-evidence">Open admin local runtime c141 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c141-plan-evidence-acceptance-gate">Open admin local runtime c141 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c142-plan">Open admin local runtime c142 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c142-plan-evidence">Open admin local runtime c142 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c142-plan-evidence-acceptance-gate">Open admin local runtime c142 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c143-plan">Open admin local runtime c143 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c143-plan-evidence">Open admin local runtime c143 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c143-plan-evidence-acceptance-gate">Open admin local runtime c143 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c144-plan">Open admin local runtime c144 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c144-plan-evidence">Open admin local runtime c144 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c144-plan-evidence-acceptance-gate">Open admin local runtime c144 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c145-plan">Open admin local runtime c145 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c145-plan-evidence">Open admin local runtime c145 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c145-plan-evidence-acceptance-gate">Open admin local runtime c145 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c146-plan">Open admin local runtime c146 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c146-plan-evidence">Open admin local runtime c146 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c146-plan-evidence-acceptance-gate">Open admin local runtime c146 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c147-plan">Open admin local runtime c147 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c147-plan-evidence">Open admin local runtime c147 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c147-plan-evidence-acceptance-gate">Open admin local runtime c147 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c148-plan">Open admin local runtime c148 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c148-plan-evidence">Open admin local runtime c148 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c148-plan-evidence-acceptance-gate">Open admin local runtime c148 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c149-plan">Open admin local runtime c149 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c149-plan-evidence">Open admin local runtime c149 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c149-plan-evidence-acceptance-gate">Open admin local runtime c149 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c150-plan">Open admin local runtime c150 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c150-plan-evidence">Open admin local runtime c150 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c150-plan-evidence-acceptance-gate">Open admin local runtime c150 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c151-plan">Open admin local runtime c151 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c151-plan-evidence">Open admin local runtime c151 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c151-plan-evidence-acceptance-gate">Open admin local runtime c151 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c152-plan">Open admin local runtime c152 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c152-plan-evidence">Open admin local runtime c152 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c152-plan-evidence-acceptance-gate">Open admin local runtime c152 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c153-plan">Open admin local runtime c153 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c153-plan-evidence">Open admin local runtime c153 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c153-plan-evidence-acceptance-gate">Open admin local runtime c153 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c154-plan">Open admin local runtime c154 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c154-plan-evidence">Open admin local runtime c154 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c154-plan-evidence-acceptance-gate">Open admin local runtime c154 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c155-plan">Open admin local runtime c155 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c155-plan-evidence">Open admin local runtime c155 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c155-plan-evidence-acceptance-gate">Open admin local runtime c155 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c156-plan">Open admin local runtime c156 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c156-plan-evidence">Open admin local runtime c156 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c156-plan-evidence-acceptance-gate">Open admin local runtime c156 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c157-plan">Open admin local runtime c157 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c157-plan-evidence">Open admin local runtime c157 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c157-plan-evidence-acceptance-gate">Open admin local runtime c157 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c158-plan">Open admin local runtime c158 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c158-plan-evidence">Open admin local runtime c158 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c158-plan-evidence-acceptance-gate">Open admin local runtime c158 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c159-plan">Open admin local runtime c159 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c159-plan-evidence">Open admin local runtime c159 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c159-plan-evidence-acceptance-gate">Open admin local runtime c159 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c160-plan">Open admin local runtime c160 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c160-plan-evidence">Open admin local runtime c160 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c160-plan-evidence-acceptance-gate">Open admin local runtime c160 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c161-plan">Open admin local runtime c161 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c161-plan-evidence">Open admin local runtime c161 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c161-plan-evidence-acceptance-gate">Open admin local runtime c161 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c162-plan">Open admin local runtime c162 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c162-plan-evidence">Open admin local runtime c162 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c162-plan-evidence-acceptance-gate">Open admin local runtime c162 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c163-plan">Open admin local runtime c163 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c163-plan-evidence">Open admin local runtime c163 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c163-plan-evidence-acceptance-gate">Open admin local runtime c163 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c164-plan">Open admin local runtime c164 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c164-plan-evidence">Open admin local runtime c164 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c164-plan-evidence-acceptance-gate">Open admin local runtime c164 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c165-plan">Open admin local runtime c165 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c165-plan-evidence">Open admin local runtime c165 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c165-plan-evidence-acceptance-gate">Open admin local runtime c165 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c166-plan">Open admin local runtime c166 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c166-plan-evidence">Open admin local runtime c166 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c166-plan-evidence-acceptance-gate">Open admin local runtime c166 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c167-plan">Open admin local runtime c167 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c167-plan-evidence">Open admin local runtime c167 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c167-plan-evidence-acceptance-gate">Open admin local runtime c167 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c168-plan">Open admin local runtime c168 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c168-plan-evidence">Open admin local runtime c168 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c168-plan-evidence-acceptance-gate">Open admin local runtime c168 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c169-plan">Open admin local runtime c169 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c169-plan-evidence">Open admin local runtime c169 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c169-plan-evidence-acceptance-gate">Open admin local runtime c169 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c170-plan">Open admin local runtime c170 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c170-plan-evidence">Open admin local runtime c170 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c170-plan-evidence-acceptance-gate">Open admin local runtime c170 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c171-plan">Open admin local runtime c171 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c171-plan-evidence">Open admin local runtime c171 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c171-plan-evidence-acceptance-gate">Open admin local runtime c171 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c172-plan">Open admin local runtime c172 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c172-plan-evidence">Open admin local runtime c172 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c172-plan-evidence-acceptance-gate">Open admin local runtime c172 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c173-plan">Open admin local runtime c173 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c173-plan-evidence">Open admin local runtime c173 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c173-plan-evidence-acceptance-gate">Open admin local runtime c173 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c174-plan">Open admin local runtime c174 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c174-plan-evidence">Open admin local runtime c174 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c174-plan-evidence-acceptance-gate">Open admin local runtime c174 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c175-plan">Open admin local runtime c175 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c175-plan-evidence">Open admin local runtime c175 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c175-plan-evidence-acceptance-gate">Open admin local runtime c175 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c176-plan">Open admin local runtime c176 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c176-plan-evidence">Open admin local runtime c176 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c176-plan-evidence-acceptance-gate">Open admin local runtime c176 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c177-plan">Open admin local runtime c177 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c177-plan-evidence">Open admin local runtime c177 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c177-plan-evidence-acceptance-gate">Open admin local runtime c177 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c178-plan">Open admin local runtime c178 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c178-plan-evidence">Open admin local runtime c178 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c178-plan-evidence-acceptance-gate">Open admin local runtime c178 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c179-plan">Open admin local runtime c179 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c179-plan-evidence">Open admin local runtime c179 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c179-plan-evidence-acceptance-gate">Open admin local runtime c179 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c180-plan">Open admin local runtime c180 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c180-plan-evidence">Open admin local runtime c180 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c180-plan-evidence-acceptance-gate">Open admin local runtime c180 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c181-plan">Open admin local runtime c181 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c181-plan-evidence">Open admin local runtime c181 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c181-plan-evidence-acceptance-gate">Open admin local runtime c181 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c182-plan">Open admin local runtime c182 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c182-plan-evidence">Open admin local runtime c182 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c182-plan-evidence-acceptance-gate">Open admin local runtime c182 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c183-plan">Open admin local runtime c183 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c183-plan-evidence">Open admin local runtime c183 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c183-plan-evidence-acceptance-gate">Open admin local runtime c183 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c184-plan">Open admin local runtime c184 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c184-plan-evidence">Open admin local runtime c184 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c184-plan-evidence-acceptance-gate">Open admin local runtime c184 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c185-plan">Open admin local runtime c185 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c185-plan-evidence">Open admin local runtime c185 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c185-plan-evidence-acceptance-gate">Open admin local runtime c185 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c186-plan">Open admin local runtime c186 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c186-plan-evidence">Open admin local runtime c186 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c186-plan-evidence-acceptance-gate">Open admin local runtime c186 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c187-plan">Open admin local runtime c187 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c187-plan-evidence">Open admin local runtime c187 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c187-plan-evidence-acceptance-gate">Open admin local runtime c187 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c188-plan">Open admin local runtime c188 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c188-plan-evidence">Open admin local runtime c188 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c188-plan-evidence-acceptance-gate">Open admin local runtime c188 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c189-plan">Open admin local runtime c189 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c189-plan-evidence">Open admin local runtime c189 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c189-plan-evidence-acceptance-gate">Open admin local runtime c189 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c190-plan">Open admin local runtime c190 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c190-plan-evidence">Open admin local runtime c190 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c190-plan-evidence-acceptance-gate">Open admin local runtime c190 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c191-plan">Open admin local runtime c191 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c191-plan-evidence">Open admin local runtime c191 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c191-plan-evidence-acceptance-gate">Open admin local runtime c191 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c192-plan">Open admin local runtime c192 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c192-plan-evidence">Open admin local runtime c192 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c192-plan-evidence-acceptance-gate">Open admin local runtime c192 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c193-plan">Open admin local runtime c193 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c193-plan-evidence">Open admin local runtime c193 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c193-plan-evidence-acceptance-gate">Open admin local runtime c193 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c194-plan">Open admin local runtime c194 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c194-plan-evidence">Open admin local runtime c194 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c194-plan-evidence-acceptance-gate">Open admin local runtime c194 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c195-plan">Open admin local runtime c195 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c195-plan-evidence">Open admin local runtime c195 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c195-plan-evidence-acceptance-gate">Open admin local runtime c195 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c196-plan">Open admin local runtime c196 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c196-plan-evidence">Open admin local runtime c196 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c196-plan-evidence-acceptance-gate">Open admin local runtime c196 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c197-plan">Open admin local runtime c197 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c197-plan-evidence">Open admin local runtime c197 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c197-plan-evidence-acceptance-gate">Open admin local runtime c197 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c198-plan">Open admin local runtime c198 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c198-plan-evidence">Open admin local runtime c198 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c198-plan-evidence-acceptance-gate">Open admin local runtime c198 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c199-plan">Open admin local runtime c199 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c199-plan-evidence">Open admin local runtime c199 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c199-plan-evidence-acceptance-gate">Open admin local runtime c199 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c200-plan">Open admin local runtime c200 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c200-plan-evidence">Open admin local runtime c200 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c200-plan-evidence-acceptance-gate">Open admin local runtime c200 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c201-plan">Open admin local runtime c201 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c201-plan-evidence">Open admin local runtime c201 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c201-plan-evidence-acceptance-gate">Open admin local runtime c201 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c202-plan">Open admin local runtime c202 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c202-plan-evidence">Open admin local runtime c202 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c202-plan-evidence-acceptance-gate">Open admin local runtime c202 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c203-plan">Open admin local runtime c203 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c203-plan-evidence">Open admin local runtime c203 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c203-plan-evidence-acceptance-gate">Open admin local runtime c203 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c204-plan">Open admin local runtime c204 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c204-plan-evidence">Open admin local runtime c204 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c204-plan-evidence-acceptance-gate">Open admin local runtime c204 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c205-plan">Open admin local runtime c205 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c205-plan-evidence">Open admin local runtime c205 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c205-plan-evidence-acceptance-gate">Open admin local runtime c205 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c206-plan">Open admin local runtime c206 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c206-plan-evidence">Open admin local runtime c206 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c206-plan-evidence-acceptance-gate">Open admin local runtime c206 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c207-plan">Open admin local runtime c207 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c207-plan-evidence">Open admin local runtime c207 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c207-plan-evidence-acceptance-gate">Open admin local runtime c207 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c208-plan">Open admin local runtime c208 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c208-plan-evidence">Open admin local runtime c208 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c208-plan-evidence-acceptance-gate">Open admin local runtime c208 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c209-plan">Open admin local runtime c209 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c209-plan-evidence">Open admin local runtime c209 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c209-plan-evidence-acceptance-gate">Open admin local runtime c209 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c210-plan">Open admin local runtime c210 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c210-plan-evidence">Open admin local runtime c210 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c210-plan-evidence-acceptance-gate">Open admin local runtime c210 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c211-plan">Open admin local runtime c211 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c211-plan-evidence">Open admin local runtime c211 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c211-plan-evidence-acceptance-gate">Open admin local runtime c211 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c212-plan">Open admin local runtime c212 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c212-plan-evidence">Open admin local runtime c212 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c212-plan-evidence-acceptance-gate">Open admin local runtime c212 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c213-plan">Open admin local runtime c213 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c213-plan-evidence">Open admin local runtime c213 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c213-plan-evidence-acceptance-gate">Open admin local runtime c213 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c214-plan">Open admin local runtime c214 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c214-plan-evidence">Open admin local runtime c214 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c214-plan-evidence-acceptance-gate">Open admin local runtime c214 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c215-plan">Open admin local runtime c215 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c215-plan-evidence">Open admin local runtime c215 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c215-plan-evidence-acceptance-gate">Open admin local runtime c215 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c216-plan">Open admin local runtime c216 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c216-plan-evidence">Open admin local runtime c216 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c216-plan-evidence-acceptance-gate">Open admin local runtime c216 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c217-plan">Open admin local runtime c217 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c217-plan-evidence">Open admin local runtime c217 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c217-plan-evidence-acceptance-gate">Open admin local runtime c217 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c218-plan">Open admin local runtime c218 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c218-plan-evidence">Open admin local runtime c218 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c218-plan-evidence-acceptance-gate">Open admin local runtime c218 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c219-plan">Open admin local runtime c219 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c219-plan-evidence">Open admin local runtime c219 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c219-plan-evidence-acceptance-gate">Open admin local runtime c219 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c220-plan">Open admin local runtime c220 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c220-plan-evidence">Open admin local runtime c220 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c220-plan-evidence-acceptance-gate">Open admin local runtime c220 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c221-plan">Open admin local runtime c221 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c221-plan-evidence">Open admin local runtime c221 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c221-plan-evidence-acceptance-gate">Open admin local runtime c221 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c222-plan">Open admin local runtime c222 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c222-plan-evidence">Open admin local runtime c222 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c222-plan-evidence-acceptance-gate">Open admin local runtime c222 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c223-plan">Open admin local runtime c223 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c223-plan-evidence">Open admin local runtime c223 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c223-plan-evidence-acceptance-gate">Open admin local runtime c223 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c224-plan">Open admin local runtime c224 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c224-plan-evidence">Open admin local runtime c224 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c224-plan-evidence-acceptance-gate">Open admin local runtime c224 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c225-plan">Open admin local runtime c225 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c225-plan-evidence">Open admin local runtime c225 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c225-plan-evidence-acceptance-gate">Open admin local runtime c225 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c226-plan">Open admin local runtime c226 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c226-plan-evidence">Open admin local runtime c226 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c226-plan-evidence-acceptance-gate">Open admin local runtime c226 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c227-plan">Open admin local runtime c227 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c227-plan-evidence">Open admin local runtime c227 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c227-plan-evidence-acceptance-gate">Open admin local runtime c227 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c228-plan">Open admin local runtime c228 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c228-plan-evidence">Open admin local runtime c228 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c228-plan-evidence-acceptance-gate">Open admin local runtime c228 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c229-plan">Open admin local runtime c229 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c229-plan-evidence">Open admin local runtime c229 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c229-plan-evidence-acceptance-gate">Open admin local runtime c229 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c230-plan">Open admin local runtime c230 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c230-plan-evidence">Open admin local runtime c230 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c230-plan-evidence-acceptance-gate">Open admin local runtime c230 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c231-plan">Open admin local runtime c231 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c231-plan-evidence">Open admin local runtime c231 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c231-plan-evidence-acceptance-gate">Open admin local runtime c231 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c232-plan">Open admin local runtime c232 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c232-plan-evidence">Open admin local runtime c232 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c232-plan-evidence-acceptance-gate">Open admin local runtime c232 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c233-plan">Open admin local runtime c233 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c233-plan-evidence">Open admin local runtime c233 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c233-plan-evidence-acceptance-gate">Open admin local runtime c233 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c234-plan">Open admin local runtime c234 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c234-plan-evidence">Open admin local runtime c234 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c234-plan-evidence-acceptance-gate">Open admin local runtime c234 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c235-plan">Open admin local runtime c235 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c235-plan-evidence">Open admin local runtime c235 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c235-plan-evidence-acceptance-gate">Open admin local runtime c235 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c236-plan">Open admin local runtime c236 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c236-plan-evidence">Open admin local runtime c236 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c236-plan-evidence-acceptance-gate">Open admin local runtime c236 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c237-plan">Open admin local runtime c237 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c237-plan-evidence">Open admin local runtime c237 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c237-plan-evidence-acceptance-gate">Open admin local runtime c237 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c238-plan">Open admin local runtime c238 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c238-plan-evidence">Open admin local runtime c238 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c238-plan-evidence-acceptance-gate">Open admin local runtime c238 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c239-plan">Open admin local runtime c239 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c239-plan-evidence">Open admin local runtime c239 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c239-plan-evidence-acceptance-gate">Open admin local runtime c239 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c240-plan">Open admin local runtime c240 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c240-plan-evidence">Open admin local runtime c240 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c240-plan-evidence-acceptance-gate">Open admin local runtime c240 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c241-plan">Open admin local runtime c241 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c241-plan-evidence">Open admin local runtime c241 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c241-plan-evidence-acceptance-gate">Open admin local runtime c241 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c242-plan">Open admin local runtime c242 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c242-plan-evidence">Open admin local runtime c242 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c242-plan-evidence-acceptance-gate">Open admin local runtime c242 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c243-plan">Open admin local runtime c243 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c243-plan-evidence">Open admin local runtime c243 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c243-plan-evidence-acceptance-gate">Open admin local runtime c243 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c244-plan">Open admin local runtime c244 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c244-plan-evidence">Open admin local runtime c244 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c244-plan-evidence-acceptance-gate">Open admin local runtime c244 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c245-plan">Open admin local runtime c245 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c245-plan-evidence">Open admin local runtime c245 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c245-plan-evidence-acceptance-gate">Open admin local runtime c245 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c246-plan">Open admin local runtime c246 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c246-plan-evidence">Open admin local runtime c246 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c246-plan-evidence-acceptance-gate">Open admin local runtime c246 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c247-plan">Open admin local runtime c247 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c247-plan-evidence">Open admin local runtime c247 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c247-plan-evidence-acceptance-gate">Open admin local runtime c247 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c248-plan">Open admin local runtime c248 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c248-plan-evidence">Open admin local runtime c248 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c248-plan-evidence-acceptance-gate">Open admin local runtime c248 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c249-plan">Open admin local runtime c249 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c249-plan-evidence">Open admin local runtime c249 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c249-plan-evidence-acceptance-gate">Open admin local runtime c249 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c250-plan">Open admin local runtime c250 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c250-plan-evidence">Open admin local runtime c250 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c250-plan-evidence-acceptance-gate">Open admin local runtime c250 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c251-plan">Open admin local runtime c251 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c251-plan-evidence">Open admin local runtime c251 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c251-plan-evidence-acceptance-gate">Open admin local runtime c251 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c252-plan">Open admin local runtime c252 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c252-plan-evidence">Open admin local runtime c252 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c252-plan-evidence-acceptance-gate">Open admin local runtime c252 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c253-plan">Open admin local runtime c253 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c253-plan-evidence">Open admin local runtime c253 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c253-plan-evidence-acceptance-gate">Open admin local runtime c253 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c254-plan">Open admin local runtime c254 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c254-plan-evidence">Open admin local runtime c254 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c254-plan-evidence-acceptance-gate">Open admin local runtime c254 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c255-plan">Open admin local runtime c255 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c255-plan-evidence">Open admin local runtime c255 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c255-plan-evidence-acceptance-gate">Open admin local runtime c255 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c256-plan">Open admin local runtime c256 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c256-plan-evidence">Open admin local runtime c256 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c256-plan-evidence-acceptance-gate">Open admin local runtime c256 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c257-plan">Open admin local runtime c257 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c257-plan-evidence">Open admin local runtime c257 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c257-plan-evidence-acceptance-gate">Open admin local runtime c257 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c258-plan">Open admin local runtime c258 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c258-plan-evidence">Open admin local runtime c258 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c258-plan-evidence-acceptance-gate">Open admin local runtime c258 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c259-plan">Open admin local runtime c259 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c259-plan-evidence">Open admin local runtime c259 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c259-plan-evidence-acceptance-gate">Open admin local runtime c259 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c260-plan">Open admin local runtime c260 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c260-plan-evidence">Open admin local runtime c260 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c260-plan-evidence-acceptance-gate">Open admin local runtime c260 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c261-plan">Open admin local runtime c261 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c261-plan-evidence">Open admin local runtime c261 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c261-plan-evidence-acceptance-gate">Open admin local runtime c261 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c262-plan">Open admin local runtime c262 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c262-plan-evidence">Open admin local runtime c262 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c262-plan-evidence-acceptance-gate">Open admin local runtime c262 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c263-plan">Open admin local runtime c263 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c263-plan-evidence">Open admin local runtime c263 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c263-plan-evidence-acceptance-gate">Open admin local runtime c263 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c264-plan">Open admin local runtime c264 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c264-plan-evidence">Open admin local runtime c264 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c264-plan-evidence-acceptance-gate">Open admin local runtime c264 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c265-plan">Open admin local runtime c265 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c265-plan-evidence">Open admin local runtime c265 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c265-plan-evidence-acceptance-gate">Open admin local runtime c265 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c266-plan">Open admin local runtime c266 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c266-plan-evidence">Open admin local runtime c266 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c266-plan-evidence-acceptance-gate">Open admin local runtime c266 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c267-plan">Open admin local runtime c267 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c267-plan-evidence">Open admin local runtime c267 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c267-plan-evidence-acceptance-gate">Open admin local runtime c267 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c268-plan">Open admin local runtime c268 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c268-plan-evidence">Open admin local runtime c268 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c268-plan-evidence-acceptance-gate">Open admin local runtime c268 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c269-plan">Open admin local runtime c269 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c269-plan-evidence">Open admin local runtime c269 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c269-plan-evidence-acceptance-gate">Open admin local runtime c269 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c270-plan">Open admin local runtime c270 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c270-plan-evidence">Open admin local runtime c270 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c270-plan-evidence-acceptance-gate">Open admin local runtime c270 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c271-plan">Open admin local runtime c271 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c271-plan-evidence">Open admin local runtime c271 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c271-plan-evidence-acceptance-gate">Open admin local runtime c271 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c272-plan">Open admin local runtime c272 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c272-plan-evidence">Open admin local runtime c272 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c272-plan-evidence-acceptance-gate">Open admin local runtime c272 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c273-plan">Open admin local runtime c273 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c273-plan-evidence">Open admin local runtime c273 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c273-plan-evidence-acceptance-gate">Open admin local runtime c273 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c274-plan">Open admin local runtime c274 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c274-plan-evidence">Open admin local runtime c274 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c274-plan-evidence-acceptance-gate">Open admin local runtime c274 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c275-plan">Open admin local runtime c275 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c275-plan-evidence">Open admin local runtime c275 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c275-plan-evidence-acceptance-gate">Open admin local runtime c275 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c276-plan">Open admin local runtime c276 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c276-plan-evidence">Open admin local runtime c276 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c276-plan-evidence-acceptance-gate">Open admin local runtime c276 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c277-plan">Open admin local runtime c277 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c277-plan-evidence">Open admin local runtime c277 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c277-plan-evidence-acceptance-gate">Open admin local runtime c277 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c278-plan">Open admin local runtime c278 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c278-plan-evidence">Open admin local runtime c278 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c278-plan-evidence-acceptance-gate">Open admin local runtime c278 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c279-plan">Open admin local runtime c279 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c279-plan-evidence">Open admin local runtime c279 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c279-plan-evidence-acceptance-gate">Open admin local runtime c279 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c280-plan">Open admin local runtime c280 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c280-plan-evidence">Open admin local runtime c280 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c280-plan-evidence-acceptance-gate">Open admin local runtime c280 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c281-plan">Open admin local runtime c281 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c281-plan-evidence">Open admin local runtime c281 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c281-plan-evidence-acceptance-gate">Open admin local runtime c281 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c282-plan">Open admin local runtime c282 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c282-plan-evidence">Open admin local runtime c282 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c282-plan-evidence-acceptance-gate">Open admin local runtime c282 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c283-plan">Open admin local runtime c283 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c283-plan-evidence">Open admin local runtime c283 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c283-plan-evidence-acceptance-gate">Open admin local runtime c283 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c284-plan">Open admin local runtime c284 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c284-plan-evidence">Open admin local runtime c284 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c284-plan-evidence-acceptance-gate">Open admin local runtime c284 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c285-plan">Open admin local runtime c285 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c285-plan-evidence">Open admin local runtime c285 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c285-plan-evidence-acceptance-gate">Open admin local runtime c285 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c286-plan">Open admin local runtime c286 plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c286-plan-evidence">Open admin local runtime c286 plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-local-runtime-c286-plan-evidence-acceptance-gate">Open admin local runtime c286 evidence acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-contract-plan">Open admin customer runtime access contract plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-contract-plan-evidence">Open admin customer runtime access contract plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-contract-plan-evidence-acceptance-gate">Open admin customer runtime access contract evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-contract-closure-plan">Open admin customer runtime access contract closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-contract-closure-plan-evidence">Open admin customer runtime access contract closure evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-contract-closure-plan-evidence-acceptance-gate">Open admin customer runtime access contract closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-completion-plan">Open admin customer runtime access completion plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-completion-plan-evidence">Open admin customer runtime access completion plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-completion-plan-evidence-acceptance-gate">Open admin customer runtime access completion evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-completion-closure-plan">Open admin customer runtime access completion closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-completion-closure-plan-evidence">Open admin customer runtime access completion closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-completion-closure-plan-evidence-acceptance-gate">Open admin customer runtime access completion closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-operational-readiness-plan">Open admin customer runtime access operational readiness plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-operational-readiness-plan-evidence">Open admin customer runtime access operational readiness plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-operational-readiness-plan-evidence-acceptance-gate">Open admin customer runtime access operational readiness evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-plan">Open admin customer runtime access service contract plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-plan-evidence">Open admin customer runtime access service contract plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-plan-evidence-acceptance-gate">Open admin customer runtime access service contract evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-closure-plan">Open admin customer runtime access service contract closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-closure-plan-evidence">Open admin customer runtime access service contract closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-closure-plan-evidence-acceptance-gate">Open admin customer runtime access service contract closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-completion-plan">Open admin customer runtime access service contract completion plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-completion-plan-evidence">Open admin customer runtime access service contract completion plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-completion-plan-evidence-acceptance-gate">Open admin customer runtime access service contract completion evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-completion-closure-plan">Open admin customer runtime access service contract completion closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-completion-closure-plan-evidence">Open admin customer runtime access service contract completion closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-completion-closure-plan-evidence-acceptance-gate">Open admin customer runtime access service contract completion closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-implementation-readiness-plan">Open admin customer runtime access service contract implementation readiness plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-implementation-readiness-plan-evidence">Open admin customer runtime access service contract implementation readiness plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-implementation-readiness-plan-evidence-acceptance-gate">Open admin customer runtime access service contract implementation readiness evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-preflight-plan">Open admin customer runtime access service contract connector preflight plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-preflight-plan-evidence">Open admin customer runtime access service contract connector preflight plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-preflight-plan-evidence-acceptance-gate">Open admin customer runtime access service contract connector preflight evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-readiness-plan">Open admin customer runtime access service contract connector handoff readiness plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-readiness-plan-evidence">Open admin customer runtime access service contract connector handoff readiness plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-readiness-plan-evidence-acceptance-gate">Open admin customer runtime access service contract connector handoff readiness evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-completion-plan">Open admin customer runtime access service contract connector handoff completion plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-completion-plan-evidence">Open admin customer runtime access service contract connector handoff completion plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-completion-plan-evidence-acceptance-gate">Open admin customer runtime access service contract connector handoff completion evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-plan">Open admin customer runtime access service contract connector handoff finalization boundary plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-plan-evidence">Open admin customer runtime access service contract connector handoff finalization boundary plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-plan-evidence-acceptance-gate">Open admin customer runtime access service contract connector handoff finalization boundary evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-plan-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-plan-evidence-acceptance-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-plan-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-plan-evidence-acceptance-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-closure-plan-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-closure-closure-plan-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-admin-customer-runtime-access-service-contract-connector-handoff-finalization-boundary-closure-completion-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-closure-closure-plan">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure closure closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-closure-closure-evidence">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure closure closure plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/tg-admin-connector-boundary-closure-completion-closure-closure-closure-closure-closure-closure-closure-closure-closure-closure-evidence-gate">Open admin customer runtime access service contract connector handoff finalization boundary closure completion closure closure closure closure closure closure closure closure closure closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-preflight-bundle">Open local connector preflight bundle</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-runtime-stub-contract">Open runtime stub contract</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-runtime-stub-fixture-gate">Open runtime fixture gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-handoff-intake-verifier">Open handoff intake verifier</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-handoff-intake-evidence">Open handoff intake evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-handoff-acceptance-gate">Open handoff acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-manual-handoff-acceptance-evidence">Open manual acceptance evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-manual-handoff-review-gate">Open manual handoff review gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-manual-handoff-review-evidence">Open manual handoff review evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-manual-handoff-final-review-gate">Open manual handoff final review gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-human-acceptance-attestation-evidence">Open human acceptance attestation evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-post-attestation-connector-readiness-gate">Open post-attestation connector readiness gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-runtime-design-gate">Open no-network runtime design gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-runtime-contract-v2-evidence">Open runtime contract v2 evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-runtime-contract-v2-acceptance-gate">Open runtime contract v2 acceptance gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-user-owned-local-cli-contract">Open user-owned local CLI contract</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-user-owned-local-cli-contract-evidence">Open user-owned local CLI contract evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-user-owned-local-cli-evidence-acceptance-gate">Open user-owned local CLI evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-no-network-user-owned-cli-scaffold-contract">Open no-network user-owned CLI scaffold contract</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-no-network-user-owned-cli-scaffold-contract-evidence">Open no-network user-owned CLI scaffold evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-no-network-cli-scaffold-evidence-acceptance-gate">Open no-network CLI scaffold evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-minimal-shell-contract">Open local CLI minimal shell contract</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-minimal-shell-contract-evidence">Open local CLI minimal shell evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-minimal-shell-evidence-acceptance-gate">Open local CLI minimal shell evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-static-local-cli-skeleton-contract">Open static local CLI skeleton contract</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-static-local-cli-skeleton-contract-evidence">Open static local CLI skeleton evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-static-local-cli-skeleton-evidence-acceptance-gate">Open static local CLI skeleton evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-dry-run-skeleton-plan">Open local CLI dry-run skeleton plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-dry-run-skeleton-plan-evidence">Open local CLI dry-run skeleton plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-dry-run-evidence-acceptance-gate">Open local CLI dry-run evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-execution-safety-plan">Open local CLI static execution safety plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-execution-safety-plan-evidence">Open local CLI static execution safety plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-execution-safety-evidence-acceptance-gate">Open local CLI static execution safety evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-dry-run-static-checker-contract">Open local CLI dry-run static checker contract</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-dry-run-static-checker-contract-evidence">Open local CLI dry-run static checker contract evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-dry-run-static-checker-evidence-acceptance-gate">Open local CLI dry-run static checker evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-result-plan">Open local CLI static checker result plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-result-plan-evidence">Open local CLI static checker result plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-result-evidence-acceptance-gate">Open local CLI static checker result evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-report-envelope-plan">Open local CLI static checker report envelope plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-report-envelope-plan-evidence">Open local CLI static checker report envelope plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-report-envelope-evidence-acceptance-gate">Open local CLI static checker report envelope evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-report-reviewer-gate">Open local CLI static checker report reviewer gate</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-checklist-evidence">Open local CLI static checker reviewer checklist evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-checklist-evidence-acceptance-gate">Open local CLI static checker reviewer checklist evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-decision-plan">Open local CLI static checker reviewer decision plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-decision-plan-evidence">Open local CLI static checker reviewer decision plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-decision-plan-evidence-acceptance-gate">Open local CLI static checker reviewer decision evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-packaging-plan">Open local CLI static checker reviewer outcome packaging plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-packaging-plan-evidence">Open local CLI static checker reviewer outcome packaging plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-packaging-plan-evidence-acceptance-gate">Open local CLI static checker reviewer outcome packaging evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-plan">Open local CLI static checker reviewer outcome review bundle plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-plan-evidence">Open local CLI static checker reviewer outcome review bundle plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-plan-evidence-acceptance-gate">Open local CLI static checker reviewer outcome review bundle evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-handoff-plan">Open local CLI static checker reviewer outcome review bundle handoff plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-handoff-plan-evidence">Open local CLI static checker reviewer outcome review bundle handoff evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-handoff-plan-evidence-acceptance-gate">Open local CLI static checker reviewer outcome review bundle handoff evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-handoff-continuation-plan">Open local CLI static checker reviewer outcome review bundle handoff continuation plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-plan">Open local CLI static checker reviewer outcome review bundle owner acceptance plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-plan-evidence">Open local CLI static checker reviewer outcome review bundle owner acceptance plan evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-plan-evidence-acceptance-gate">Open local CLI static checker reviewer outcome review bundle owner acceptance evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-continuation-plan">Open local CLI static checker reviewer outcome review bundle owner acceptance continuation plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-continuation-plan-evidence">Open local CLI static checker reviewer outcome review bundle owner acceptance continuation evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-continuation-plan-evidence-acceptance-gate">Open local CLI static checker reviewer outcome review bundle owner acceptance continuation evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-closure-plan">Open local CLI static checker reviewer outcome review bundle owner acceptance closure plan</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-closure-plan-evidence">Open local CLI static checker reviewer outcome review bundle owner acceptance closure evidence</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-local-connector-local-cli-static-checker-reviewer-outcome-review-bundle-owner-acceptance-closure-plan-evidence-acceptance-gate">Open local CLI static checker reviewer outcome review bundle owner acceptance closure evidence acceptance</a>
          <a className="text-sm text-emerald-300 hover:underline" href="/telegram-acquisition-completion-gap">Open completion gap map</a>
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Local workbench: {control.completionEstimate.localWorkbench}</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Production Telegram robot: {control.completionEstimate.productionTelegramRobot}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
          {control.completionEstimate.remainingBlockers.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="font-semibold">Hard boundary</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          webLoginImplemented={String(control.webLoginImplemented)}; telegramApiCalled={String(control.telegramApiCalled)}; outboundSendAttempted={String(control.outboundSendAttempted)}; externalSentFinalized={String(control.externalSentFinalized)}.
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          User login stays outside this web UI. This dashboard does not collect phone numbers, login codes, API hashes, bot tokens, raw sessions, or platform payloads.
        </p>
      </section>
    </main>
  )
}

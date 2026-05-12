# OpenClaw Bot Review / God Plan TG Acquisition Handoff

## 1. Project Summary

- Project name: `openclaw-bot-review`
- Current absolute path on i7: `C:\Users\壹卷\.openclaw\workspace\OpenClaw-bot-review`
- Recommended new path on i9: `D:\Projects\OpenClaw-bot-review`
- Project type:
  - Local website
  - Local scripts
  - Node project
  - Telegram acquisition local safety/workbench project
  - Not a production Telegram Bot runtime yet
- Technology stack:
  - Node.js
  - Next.js
  - React
  - TypeScript
  - Tailwind CSS
  - Local JSON/log evidence files
- Sensitive value policy:
  - Do not copy, print, commit, or expose tokens, passwords, cookies, sessions, API keys, Telegram raw sessions, phone numbers, OTP/login codes, bot tokens, or API hashes.
  - `.env.example` is a placeholder template only. Real `.env` files must stay private and out of Git.

## 2. Main Entry Files

- `package.json`: npm scripts, dependencies, app commands.
- `app/`: Next.js App Router pages and API routes.
- `app/api/inbound/telegram/route.ts`: local Telegram inbound simulation/auth route.
- `app/telegram-acquisition-local-control/page.tsx`: Telegram acquisition local control page.
- `app/telegram-admin-local-self-use-access/page.tsx`: admin local self-use access page.
- `lib/god-plan/`: core God Plan services and local diagnostics logic.
- `scripts/`: local smoke tests, safety checks, packaging, admin/TG connector evidence CLIs.
- `next.config.mjs`: Next.js standalone build configuration.
- `tsconfig.json`: TypeScript configuration.
- `postcss.config.js`: PostCSS/Tailwind configuration.
- `start-local-web.bat`: Windows local standalone launcher after build.
- `stop-local-web.bat`: Windows local server stop helper.
- `Dockerfile`: optional container build.

## 3. Install, Start, Test, Build

Install dependencies:

```powershell
npm install
```

Start development server:

```powershell
npm run dev
```

Default local URL:

```text
http://127.0.0.1:3000
```

Build:

```powershell
npm run build
```

Start standalone after build:

```powershell
npm start
```

Windows local package start after build:

```powershell
.\start-local-web.bat
```

Windows local package stop:

```powershell
.\stop-local-web.bat
```

Recommended focused validation after migration:

```powershell
npm run test:telegram-admin-local-connector-owner-login-adapter-readiness-evidence-cli
npm run test:telegram-admin-local-connector-owner-login-adapter-readiness-evidence-navigation
npm run test:telegram-admin-local-self-use-access
npm run test:telegram-acquisition-local-control
npm run test:telegram-send-authorization
npm run test:local-safety
npm run build
```

Optional package checks:

```powershell
npm run check:local-web-package
npm run smoke:local-web-package
```

## 4. Ports

- `3000`: default Next.js/local standalone port.
- `3010`: legacy `run-standalone-3010.cmd` helper uses this port.
- `3100`: default local web package smoke-test port via `LOCAL_WEB_PACKAGE_SMOKE_PORT`.
- Custom port can be set with `PORT=`.

## 5. Environment Variables

Only variable names are listed here. Do not put real values in this file.

```dotenv
APPDATA=
FORCE_COLOR=
GITHUB_TOKEN=
GOD_PLAN_DB_FILE=
GOD_PLAN_ENABLE_PRODUCTION_OUTBOUND_SEND=
GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE=
GOD_PLAN_OUTBOUND_SENDER_CONFIGURED=
GOD_PLAN_TELEGRAM_API_HASH=
GOD_PLAN_TELEGRAM_API_ID=
GOD_PLAN_TELEGRAM_BOT_TOKEN=
GOD_PLAN_TELEGRAM_SESSION_REF=
HOME=
HOMEBREW_PREFIX=
HOSTNAME=
INBOUND_SHARED_SECRET=
LOCAL_WEB_PACKAGE_SMOKE_PORT=
NODE_ENV=
OPENCLAW_HOME=
OPENCLAW_PACKAGE_DIR=
OPENCLAW_REPO=
PORT=
PREFIX=
SMOKE_BASE_URL=
npm_config_prefix=
```

Important defaults and safety notes:

- `GOD_PLAN_OUTBOUND_ENVIRONMENT_MODE=local` is the safe local default.
- `GOD_PLAN_ENABLE_PRODUCTION_OUTBOUND_SEND=false` is the safe local default.
- `INBOUND_SHARED_SECRET` must be set privately if using inbound simulation/auth.
- Telegram variables must not contain real secrets in Git.
- `GOD_PLAN_TELEGRAM_SESSION_REF` must be a safe reference only, not a raw session string.

## 6. Configuration Files

Can migrate and can be in Git:

- `.env.example` placeholder template only.
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `postcss.config.js`
- `Dockerfile`
- `.dockerignore`
- `README.md`
- `quick_start.md`
- `LOCAL_WEB_PACKAGE.md`
- `CODEX_TG_HANDOFF.md`
- Existing non-sensitive markdown artifacts documenting local plans/evidence.

Private or generated; do not commit:

- `.env`
- `.env.*`
- `config.json`
- `secrets.json`
- `token.txt`
- `credentials.json`
- `cookies.json`
- `*.session`
- `cluster.local.env`
- Any file containing Telegram phone number, OTP/login code, API hash, bot token, raw session, session string, auth key, cookie, password, or API key.

Machine-local OpenClaw config:

- Default read location is based on `OPENCLAW_HOME`, otherwise user home `.openclaw`.
- On i9, set `OPENCLAW_HOME` only if the OpenClaw data directory differs from the default.
- Do not copy private OpenClaw tokens/cookies/session material into this repo.

## 7. Data Files and Database Locations

- `data\god-plan-db.json`: local JSON data file used by `start-local-web.bat` when `GOD_PLAN_DB_FILE` is not set. It may be created at runtime.
- `logs\`: generated local logs and Telegram local connector evidence. Treat as runtime artifacts; do not commit.
- `logs\telegram-local-connector\*.json`: generated local redacted diagnostics/evidence files. Migrate only if you need local continuity; otherwise regenerate.
- `test-results\`: generated test result artifacts. Do not migrate unless debugging.
- `_tmp_*`, `tmp_*`, `*.log`: scratch files. Do not migrate.
- No production database is currently configured.

## 8. Directories to Migrate

Recommended source directories/files to copy or clone into `D:\Projects\OpenClaw-bot-review`:

- `app\`
- `docs\`
- `lib\`
- `memory\`
- `prd\`
- `public\`
- `scripts\`
- Root `*.md` documents that are tracked or intentionally needed for project history.
- `.env.example`
- `.gitignore`
- `.dockerignore`
- `Dockerfile`
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `postcss.config.js`
- `tsconfig.json`
- `start-local-web.bat`
- `stop-local-web.bat`
- `run-telegram-smoke.ps1`

Prefer `git clone` on i9, then copy only private runtime files manually if needed.

## 9. Directories and Files Not to Migrate

Do not copy these generated or private/runtime artifacts as part of normal migration:

- `node_modules\`
- `.venv\`
- `venv\`
- `__pycache__\`
- `.pytest_cache\`
- `.cache\`
- `.next\`
- `dist\`
- `build\`
- `logs\`
- `test-results\`
- `*.log`
- `_tmp_*`
- `tmp_*`
- `.env`
- `.env.*`
- `config.json`
- `secrets.json`
- `token.txt`
- `credentials.json`
- `cookies.json`
- `*.session`
- `cluster.local.env`

If `logs\telegram-local-connector\` contains evidence you want for continuity, copy it privately after reviewing that it contains only redacted data.

## 10. Git Status

- Is Git repository: yes.
- Current branch: `main`.
- Current state at handoff generation:
  - `main...origin/main [ahead 853]`
  - No tracked uncommitted modifications before creating this handoff.
  - Existing untracked historical handoff/artifact files are present and should not be deleted blindly.
- Latest commit before this handoff:
  - `e028a5ff feat(god-plan): add telegram admin local connector owner login adapter readiness evidence`
- Do not push unless explicitly requested by the owner.

## 11. Telegram Bot / Telegram Runtime Notes

This repository is not currently a production Telegram Bot.

- Current Telegram mode:
  - Local diagnostics, safety gates, dry-run, inbound simulation, and local connector readiness evidence.
  - No real Telegram login runtime.
  - No Telegram SDK/API runtime.
  - No real sender worker.
  - No production external sent finalization.
- Polling or webhook:
  - No production polling bot is running from this repo.
  - `app/api/inbound/telegram/route.ts` is a local inbound-style API route/simulation surface, not a deployed production webhook.
- Is it running:
  - Not assumed. Check on the machine with `netstat -ano | findstr :3000` or start via `npm run dev` / `.\start-local-web.bat`.
- Formal migration:
  - If a local web server is running on i7, stop it before switching users to i9.
  - There is no live Telegram bot process to stop unless the owner started one separately outside this repo.
- Telegram permissions needed in the future:
  - Future user-owned local CLI may need owner-controlled Telegram account login on the i9 machine.
  - The Web UI must not collect phone number, OTP/login code, API hash, bot token, raw session, session string, or auth key.
  - Any real Telegram permissions must be reviewed separately before enabling production connector/sender behavior.

## 12. Mini Program Notes

- This is not a WeChat mini program.
- This is not a Douyin mini program.
- No mini program `appid` migration is required.

## 13. Restore Steps on i9

Recommended path:

```powershell
mkdir D:\Projects
cd D:\Projects
git clone <repo-url> OpenClaw-bot-review
cd D:\Projects\OpenClaw-bot-review
```

If using a local copy instead of clone, copy the repository source without generated/private folders listed in section 9.

Install dependencies:

```powershell
npm install
```

Create private environment file if needed:

```powershell
copy .env.example .env
```

Then edit `.env` locally on i9 and fill only private values needed for local testing. Do not commit `.env`.

Build:

```powershell
npm run build
```

Run local development:

```powershell
npm run dev
```

Or run standalone after build:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:3000
```

Run validation:

```powershell
npm run test:telegram-admin-local-connector-owner-login-adapter-readiness-evidence-cli
npm run test:telegram-admin-local-self-use-access
npm run test:telegram-acquisition-local-control
npm run test:telegram-send-authorization
npm run build
```

Optional local package generation:

```powershell
npm run package:local-web
```

## 14. Risks and Notes

- The repo has many generated local-plan/evidence pages and scripts; `npm run build` can take several minutes.
- If build reports `.next\lock`, stop any stale `next build` or Node process for this repo before retrying.
- Do not migrate `node_modules` or `.next`; regenerate them on i9.
- Do not commit runtime logs or local evidence under `logs\`.
- Keep outbound send disabled unless a future production sender gate is explicitly implemented and approved.
- Current Telegram work is local-only, diagnostics-only, and no-network/no-send by default.
- Real Telegram connector and sender runtime remain future work and need separate security review.
- If copying local `logs\telegram-local-connector` evidence for continuity, inspect filenames and contents first; copy only redacted evidence.

## 15. Current Development Progress

Local self-use version estimate: about 65% to 70%.

Completed or partially completed:

- Local Next.js web console.
- God Plan analytics/readiness/diagnostics.
- Telegram acquisition local control.
- Admin customer access model.
- Admin-defined customer term/expiry model.
- Admin-opened local port model.
- One local port to one redacted Telegram account reference.
- Local self-use access diagnostics.
- Local connector preflight/config/smoke/shell.
- Connector adapter contract/scaffold/static-check/materialize/no-network smoke.
- Owner login boundary/static review.
- Owner login adapter scaffold/materialization/no-network smoke/readiness evidence design/static review/readiness evidence.
- Message intelligence, decision engine, draft engine, strategy rules, human review, dry-run outbound, outbound guard diagnostics, send authorization separation.

Production long-running version estimate: about 30% to 35%.

Missing for production:

- Real Telegram connector runtime.
- Real user-owned local login adapter runtime.
- Real inbound polling/webhook strategy.
- Durable production database.
- Durable queue and worker.
- Real sender runtime.
- Rate limit slot reservation.
- Suppression/opt-out/preference center runtime.
- Monitoring and alerting.
- Vault/secrets management.
- Backups and restore.
- Production deployment/release gates.
- Incident response and audit retention.

## 16. Next Todo

Recommended next local self-use step:

- Add `owner login adapter readiness evidence acceptance gate`.

Then continue toward:

- Agent action proposal contract.
- Agent risk gate.
- Human review gate for Agent proposals.
- Local user-owned CLI login contract.
- Redacted session/reference resolver design.
- No-network smoke for any future connector runtime.
- Only after that, design real Telegram connector and sender runtime under explicit review.

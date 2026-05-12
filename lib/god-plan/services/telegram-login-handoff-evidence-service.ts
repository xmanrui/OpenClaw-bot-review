import fs from 'node:fs'
import path from 'node:path'

export const TELEGRAM_LOGIN_HANDOFF_EVIDENCE_RELATIVE_PATH = 'logs/telegram-login-handoff/readiness-preflight.json'

export interface TelegramLoginHandoffEvidenceSummary {
  exists: boolean
  evidencePath: string
  generatedAt: string | null
  ok: boolean
  missingRequired: string[]
  environmentMode: string
  productionSendEnvKey: string | null
  productionSendEnabled: boolean
  productionSendEnvNamingCanonical: boolean
  localOnly: boolean
  valueRedacted: boolean
  rawCredentialStored: boolean
  rawSessionStored: boolean
  telegramApiCalled: boolean
  outboundSendAttempted: boolean
  externalSentFinalized: boolean
  parseError: boolean
  summary: string
}

function evidencePath() {
  return path.resolve(process.cwd(), TELEGRAM_LOGIN_HANDOFF_EVIDENCE_RELATIVE_PATH)
}

function safeBoolean(value: unknown) {
  return value === true
}

function baseSummary(overrides: Partial<TelegramLoginHandoffEvidenceSummary>): TelegramLoginHandoffEvidenceSummary {
  return {
    exists: false,
    evidencePath: TELEGRAM_LOGIN_HANDOFF_EVIDENCE_RELATIVE_PATH,
    generatedAt: null,
    ok: false,
    missingRequired: [],
    environmentMode: 'unknown',
    productionSendEnvKey: null,
    productionSendEnabled: false,
    productionSendEnvNamingCanonical: false,
    localOnly: true,
    valueRedacted: true,
    rawCredentialStored: false,
    rawSessionStored: false,
    telegramApiCalled: false,
    outboundSendAttempted: false,
    externalSentFinalized: false,
    parseError: false,
    summary: 'No local Telegram handoff preflight evidence file exists yet. Run the evidence preflight command locally to create it.',
    ...overrides,
  }
}

export function getTelegramLoginHandoffEvidenceSummary(): TelegramLoginHandoffEvidenceSummary {
  const filePath = evidencePath()

  if (!fs.existsSync(filePath)) {
    return baseSummary({})
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const evidence = parsed.evidence ?? {}
    const boundary = parsed.boundary ?? {}
    const environment = parsed.environment ?? {}

    return baseSummary({
      exists: true,
      generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : null,
      ok: parsed.ok === true,
      missingRequired: Array.isArray(parsed.missingRequired) ? parsed.missingRequired : [],
      environmentMode: typeof environment.environmentMode === 'string' ? environment.environmentMode : 'unknown',
      productionSendEnvKey: typeof environment.productionSendEnvKey === 'string' ? environment.productionSendEnvKey : null,
      productionSendEnabled: safeBoolean(environment.productionSendEnabled),
      productionSendEnvNamingCanonical: environment.productionSendEnvNamingCanonical === true,
      localOnly: safeBoolean(evidence.localOnly) && safeBoolean(boundary.localOnly),
      valueRedacted: evidence.valueRedacted === true,
      rawCredentialStored: evidence.rawCredentialStored === true,
      rawSessionStored: evidence.rawSessionStored === true,
      telegramApiCalled: evidence.telegramApiCalled === true || boundary.telegramApiCalled === true,
      outboundSendAttempted: evidence.outboundSendAttempted === true || boundary.outboundSendAttempted === true,
      externalSentFinalized: evidence.externalSentFinalized === true || boundary.externalSentFinalized === true,
      summary: 'Read-only local Telegram handoff evidence summary. Raw credential values and raw sessions are not returned.',
    })
  } catch {
    return baseSummary({
      exists: true,
      parseError: true,
      summary: 'Local Telegram handoff evidence file exists but could not be parsed. Regenerate it with the evidence preflight command.',
    })
  }
}

export interface TelegramSessionReferenceReadiness {
  configured: boolean
  format: 'missing' | 'local_ref' | 'unsafe_raw_like' | 'unsupported'
  safeForWebDiagnostics: boolean
  rawSessionExposed: false
  telegramApiCalled: false
  summary: string
}

const LOCAL_REF_PREFIX = 'local:'
const FILE_REF_PREFIX = 'file:'

function configuredValue() {
  const value = process.env.GOD_PLAN_TELEGRAM_SESSION_REF
  return typeof value === 'string' ? value.trim() : ''
}

function looksRawLike(value: string) {
  if (value.length > 120) return true
  if (/^[A-Za-z0-9+/=]{80,}$/.test(value)) return true
  if (/session(string)?|authkey|dc_id|telegram_desktop/i.test(value)) return true
  return false
}

export function getTelegramSessionReferenceReadiness(): TelegramSessionReferenceReadiness {
  const value = configuredValue()

  if (!value) {
    return {
      configured: false,
      format: 'missing',
      safeForWebDiagnostics: false,
      rawSessionExposed: false,
      telegramApiCalled: false,
      summary: 'No Telegram session reference is configured. A future trusted local login handoff must provide only a non-secret local reference.',
    }
  }

  if (looksRawLike(value)) {
    return {
      configured: true,
      format: 'unsafe_raw_like',
      safeForWebDiagnostics: false,
      rawSessionExposed: false,
      telegramApiCalled: false,
      summary: 'The configured session reference looks like raw session material. Keep raw sessions outside the web app and replace this with a non-secret local reference.',
    }
  }

  if (value.startsWith(LOCAL_REF_PREFIX) || value.startsWith(FILE_REF_PREFIX)) {
    return {
      configured: true,
      format: 'local_ref',
      safeForWebDiagnostics: true,
      rawSessionExposed: false,
      telegramApiCalled: false,
      summary: 'A non-secret local session reference is configured. The referenced value is not read, parsed, displayed, or sent to Telegram.',
    }
  }

  return {
    configured: true,
    format: 'unsupported',
    safeForWebDiagnostics: false,
    rawSessionExposed: false,
    telegramApiCalled: false,
    summary: 'A session reference is configured, but it is not in an approved non-secret reference format. Use local:<name> or file:<local-path-reference> without raw session content.',
  }
}

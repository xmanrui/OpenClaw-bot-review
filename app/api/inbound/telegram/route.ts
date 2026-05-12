import { normalizeTelegramUpdate, type TelegramUpdate } from '@/lib/god-plan/inbound/telegram'
import { hasProcessedInboundUpdate } from '@/lib/god-plan/inbound/dedup'
import { pipelineService } from '@/lib/god-plan/services/pipeline-service'

function jsonText(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

function badRequest(error: string) {
  return jsonText({ ok: false, error }, 400)
}

function unauthorized(error = 'Unauthorized') {
  return jsonText({ ok: false, error }, 401)
}

function forbidden(error = 'Forbidden') {
  return jsonText({ ok: false, error }, 403)
}

function getRequestHost(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost ?? request.headers.get('host') ?? new URL(request.url).host
  return host.split(',')[0]?.trim().toLowerCase() ?? ''
}

function isLocalHost(request: Request) {
  const hostname = getRequestHost(request).split(':')[0]
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
}

function isAuthorized(request: Request) {
  const requiredSecret = process.env.INBOUND_SHARED_SECRET?.trim()
  if (!requiredSecret) return false

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || ''
  return authHeader === `Bearer ${requiredSecret}`
}

export async function POST(request: Request) {
  try {
    if (!isLocalHost(request)) {
      return forbidden('Telegram inbound smoke route is local-only')
    }

    if (!isAuthorized(request)) {
      return unauthorized('Missing inbound shared secret or invalid bearer token')
    }

    const update = (await request.json()) as TelegramUpdate

    if (hasProcessedInboundUpdate(update.update_id)) {
      return jsonText({
        ok: true,
        deduplicated: true,
        updateId: update.update_id,
      })
    }

    const inbound = normalizeTelegramUpdate(update)
    const result = await pipelineService.processMessage(inbound)
    return jsonText(result)
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Unknown error')
  }
}

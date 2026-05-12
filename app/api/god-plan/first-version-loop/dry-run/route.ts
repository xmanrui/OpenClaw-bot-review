import { NextResponse } from 'next/server'
import { firstVersionLoopService } from '@/lib/god-plan/services/first-version-loop-service'
import type { MessageEvent, MessageSignal } from '@/lib/god-plan/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type LocalDryRunLoopBody = {
  message?: unknown
  now?: string
  humanReviewer?: {
    actorId?: string
    actorName?: string
  }
}

const MAX_TEXT_LENGTH = 4000

function isLocalDryRunRequest(request: Request) {
  const url = new URL(request.url)
  const host = request.headers.get('host') ?? url.host
  const hostname = host.split(':')[0]?.toLowerCase()
  return ['localhost', '127.0.0.1', '::1', 'local.test'].includes(hostname)
}

function readStringField(value: Record<string, unknown>, key: string, options: { required?: boolean; maxLength?: number } = {}) {
  const field = value[key]
  if (field == null) {
    if (options.required) throw new Error(`${key} is required`)
    return null
  }
  if (typeof field !== 'string') throw new Error(`${key} must be a string`)
  const trimmed = field.trim()
  if (!trimmed && options.required) throw new Error(`${key} is required`)
  if (options.maxLength && trimmed.length > options.maxLength) throw new Error(`${key} is too long`)
  return trimmed
}

function parseLocalDryRunMessage(value: unknown): MessageEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('message is required')
  }
  const record = value as Record<string, unknown>
  const signals = Array.isArray(record.signals)
    ? record.signals.filter((signal): signal is MessageSignal => typeof signal === 'string')
    : undefined

  return {
    id: readStringField(record, 'id', { required: true, maxLength: 160 })!,
    groupId: readStringField(record, 'groupId', { required: true, maxLength: 160 })!,
    runtimeId: readStringField(record, 'runtimeId', { maxLength: 160 }),
    accountId: readStringField(record, 'accountId', { maxLength: 160 }),
    senderId: readStringField(record, 'senderId', { required: true, maxLength: 160 })!,
    senderName: readStringField(record, 'senderName', { maxLength: 160 }),
    senderUsername: readStringField(record, 'senderUsername', { maxLength: 160 }),
    text: readStringField(record, 'text', { required: true, maxLength: MAX_TEXT_LENGTH })!,
    messageType: 'text',
    language: readStringField(record, 'language', { maxLength: 32 }),
    replyToMessageId: readStringField(record, 'replyToMessageId', { maxLength: 160 }),
    sentAt: readStringField(record, 'sentAt', { required: true, maxLength: 64 })!,
    rawPayload: null,
    signals,
  }
}

export async function POST(request: Request) {
  try {
    if (!isLocalDryRunRequest(request)) {
      return NextResponse.json({ ok: false, error: 'local dry-run endpoint only accepts localhost requests' }, { status: 403 })
    }

    const body = (await request.json()) as LocalDryRunLoopBody
    const message = parseLocalDryRunMessage(body.message)

    const result = await firstVersionLoopService.runLocalDryRunLoop({
      message,
      now: body.now,
      humanReviewer: body.humanReviewer,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 },
    )
  }
}

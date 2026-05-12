import { resolveInboundGroupId } from '@/lib/god-plan/inbound/group-mapping'

interface TelegramUser {
  id?: number | string
  first_name?: string
  last_name?: string
  username?: string
}

interface TelegramChat {
  id?: number | string
  type?: string
  title?: string
}

interface TelegramMessage {
  message_id?: number | string
  date?: number
  text?: string
  caption?: string
  from?: TelegramUser
  chat?: TelegramChat
  reply_to_message?: {
    message_id?: number | string
  }
}

interface TelegramCallbackQuery {
  id?: string
  data?: string
  from?: TelegramUser
  message?: TelegramMessage
}

export interface TelegramUpdate {
  update_id?: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

function toDisplayName(user?: TelegramUser | null) {
  if (!user) return null
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return fullName || user.username || null
}

function toMessageType(message?: TelegramMessage | null) {
  if (!message) return 'text' as const
  if (message.reply_to_message?.message_id != null) return 'reply' as const
  return 'text' as const
}

export function normalizeTelegramUpdate(update: TelegramUpdate) {
  const baseMessage = update.message ?? update.edited_message ?? update.callback_query?.message
  const from = update.message?.from ?? update.edited_message?.from ?? update.callback_query?.from
  const chat = baseMessage?.chat
  const rawText = update.message?.text
    ?? update.message?.caption
    ?? update.edited_message?.text
    ?? update.edited_message?.caption
    ?? update.callback_query?.data
    ?? ''

  const text = rawText.trim()
  if (!chat?.id) throw new Error('Telegram chat.id is required')
  if (!from?.id) throw new Error('Telegram from.id is required')
  if (!text) throw new Error('Telegram text/callback data is required')

  const chatType = chat.type || 'private'
  const mappedGroupId = resolveInboundGroupId({ platform: 'telegram', chatId: chat.id })
  const groupId = mappedGroupId ?? (chatType === 'private'
    ? `telegram:direct:${chat.id}`
    : `telegram:group:${chat.id}`)

  const sentAt = typeof baseMessage?.date === 'number'
    ? new Date(baseMessage.date * 1000).toISOString()
    : undefined

  return {
    groupId,
    runtimeId: null,
    accountId: 'telegram',
    senderId: String(from.id),
    senderName: toDisplayName(from),
    senderUsername: from.username ?? null,
    text,
    messageType: toMessageType(baseMessage),
    language: 'zh',
    replyToMessageId: baseMessage?.reply_to_message?.message_id != null
      ? String(baseMessage.reply_to_message.message_id)
      : null,
    rawPayload: null,
    platformUpdateId: update.update_id != null ? String(update.update_id) : null,
    platformMessageId: baseMessage?.message_id != null ? String(baseMessage.message_id) : null,
    sentAt,
    personaId: null,
  }
}

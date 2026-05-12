import { getGroupStore } from '@/lib/god-plan/seed-source'
import { readState } from '@/lib/god-plan/storage/db'

export function resolveInboundGroupId(input: {
  platform: string
  chatId: string | number | null | undefined
}) {
  if (input.chatId == null) return null

  const chatId = String(input.chatId)
  const state = readState()
  const stateMatch = state.groups.find((group) =>
    (group.externalRefs ?? []).some((ref) => ref.platform === input.platform && ref.chatId === chatId)
  )
  if (stateMatch) return stateMatch.id

  const seedMatch = getGroupStore().find((group) =>
    (group.externalRefs ?? []).some((ref) => ref.platform === input.platform && ref.chatId === chatId)
  )

  return seedMatch?.id ?? null
}

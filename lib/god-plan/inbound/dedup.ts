import { readState } from '@/lib/god-plan/storage/db'

export function hasProcessedInboundUpdate(updateId?: number | string | null) {
  if (updateId == null) return false

  const normalizedUpdateId = String(updateId)
  const state = readState()

  return state.messageEvents.some((event) => {
    return event.platformUpdateId != null && String(event.platformUpdateId) === normalizedUpdateId
  })
}

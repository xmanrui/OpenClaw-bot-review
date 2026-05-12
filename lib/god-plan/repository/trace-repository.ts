import type { TraceEvent } from '@/lib/god-plan/types'
import { readState, updateState } from '@/lib/god-plan/storage/db'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getTraceStore() {
  const state = readState()
  return state.traces
}

export const traceRepository = {
  async appendTrace(event: TraceEvent) {
    updateState((state) => {
      state.traces.unshift(clone(event))
    })
    return clone(event)
  },

  async listTraceByEntity(entityType: string, entityId: string) {
    const items = getTraceStore().filter((item) => item.entityType === entityType && item.entityId === entityId)
    return clone(items) as TraceEvent[]
  },
}

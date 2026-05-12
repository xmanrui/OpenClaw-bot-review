import type { RuntimeDetailViewModel, RuntimeListItem } from '@/lib/god-plan/types'
import { readState, updateState } from '@/lib/god-plan/storage/db'
import { traceRepository } from '@/lib/god-plan/repository/trace-repository'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getRuntimeStores() {
  const state = readState()
  return {
    items: state.runtimes,
    details: state.runtimeDetails,
  }
}

export const runtimeRepository = {
  async listRuntimes() {
    const { items, details } = getRuntimeStores()
    const detailById = new Map(details.map((detail) => [detail.id, detail]))
    return clone(
      items.map((item) => {
        const detail = detailById.get(item.id)
        return {
          ...item,
          groupId: item.groupId ?? detail?.groupId ?? null,
        }
      }),
    ) as RuntimeListItem[]
  },

  async getRuntimeById(id: string) {
    const item = getRuntimeStores().details.find((runtime) => runtime.id === id)
    if (!item) throw new Error('Runtime not found: ' + id)
    return clone(item) as RuntimeDetailViewModel
  },

  async listRuntimeTrace(id: string) {
    return traceRepository.listTraceByEntity('runtime', id)
  },

  async updateRuntimeContext(
    id: string,
    input: {
      currentContextSummary?: RuntimeDetailViewModel['currentContextSummary']
      lastActionSummary?: RuntimeDetailViewModel['lastActionSummary']
      updatedAt?: RuntimeDetailViewModel['updatedAt']
    },
  ) {
    let next: RuntimeDetailViewModel | null = null
    updateState((state) => {
      const detail = state.runtimeDetails.find((runtime) => runtime.id === id)
      const item = state.runtimes.find((runtime) => runtime.id === id)
      if (!detail || !item) throw new Error('Runtime not found: ' + id)
      if (typeof input.currentContextSummary !== 'undefined') detail.currentContextSummary = input.currentContextSummary
      if (typeof input.lastActionSummary !== 'undefined') detail.lastActionSummary = input.lastActionSummary
      detail.updatedAt = input.updatedAt ?? new Date().toISOString()
      item.updatedAt = detail.updatedAt
      next = clone(detail) as RuntimeDetailViewModel
    })
    if (!next) throw new Error('Runtime not found: ' + id)
    return next
  },
}

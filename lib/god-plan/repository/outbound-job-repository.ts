import { readState } from '@/lib/god-plan/storage/db'
import type { OutboundJob } from '@/lib/god-plan/types'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export interface OutboundJobListQuery {
  status?: string
  mode?: string
  reviewId?: string
  runtimeId?: string
}

function sortByUpdatedAtDesc(items: OutboundJob[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export const outboundJobRepository = {
  async listOutboundJobs(query: OutboundJobListQuery = {}) {
    const state = readState()
    let items = state.outboundJobs ?? []
    if (query.status) items = items.filter((item) => item.status === query.status)
    if (query.mode) items = items.filter((item) => item.mode === query.mode)
    if (query.reviewId) items = items.filter((item) => item.reviewId === query.reviewId)
    if (query.runtimeId) items = items.filter((item) => item.runtimeId === query.runtimeId)
    return clone(sortByUpdatedAtDesc(items))
  },

  async getOutboundJobById(id: string) {
    const state = readState()
    const item = (state.outboundJobs ?? []).find((job) => job.id === id)
    if (!item) throw new Error(`Outbound job not found: ${id}`)
    return clone(item)
  },
}

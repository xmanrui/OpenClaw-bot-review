import { outboundJobRepository } from '@/lib/god-plan/repository/outbound-job-repository'
import { initStorage } from '@/lib/god-plan/storage/init'

function ensureStorageReady() {
  initStorage()
}

export const outboundJobService = {
  async listOutboundJobs(params?: { status?: string; mode?: string; reviewId?: string; runtimeId?: string }) {
    ensureStorageReady()
    const items = await outboundJobRepository.listOutboundJobs(params)
    return { items, total: items.length }
  },

  async getOutboundJobById(id: string) {
    ensureStorageReady()
    return outboundJobRepository.getOutboundJobById(id)
  },
}

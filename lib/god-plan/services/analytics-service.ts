import { initStorage } from '@/lib/god-plan/storage/init'
import { analyticsRepository } from '@/lib/god-plan/repository/analytics-repository'

function ensureStorageReady() {
  initStorage()
}

export const analyticsService = {
  async getSummary() {
    ensureStorageReady()
    return analyticsRepository.getSummary()
  },
}

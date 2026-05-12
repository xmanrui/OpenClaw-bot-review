import { initStorage } from '@/lib/god-plan/storage/init'
import { runtimeRepository } from '@/lib/god-plan/repository/runtime-repository'
import type { RuntimeDetailViewModel, RuntimeListItem } from '@/lib/god-plan/types'
import type { UpdateRuntimeContextInput } from '@/lib/god-plan/services/service-types'

function ensureStorageReady() {
  initStorage()
}

export const runtimeService = {
  async listRuntimes(params?: { queue?: string; riskLevel?: string; restrictionStatus?: string; stage?: string; groupId?: string }) {
    ensureStorageReady()
    let items = await runtimeRepository.listRuntimes()
    if (params?.groupId) items = items.filter((item) => item.groupId === params.groupId)
    if (params?.queue === 'attention') items = items.filter((item) => item.riskLevel === 'high' || item.restrictionStatus !== 'normal')
    if (params?.queue === 'review') items = items.filter((item) => item.restrictionStatus === 'under_review')
    if (params?.riskLevel) items = items.filter((item) => item.riskLevel === params.riskLevel)
    if (params?.restrictionStatus) items = items.filter((item) => item.restrictionStatus === params.restrictionStatus)
    if (params?.stage) items = items.filter((item) => item.stage === params.stage)
    return { items, total: items.length }
  },

  async getRuntimeDetail(id: string) {
    ensureStorageReady()
    return runtimeRepository.getRuntimeById(id)
  },

  async getRuntimeTrace(id: string) {
    ensureStorageReady()
    return runtimeRepository.listRuntimeTrace(id)
  },

  async updateRuntimeContext(id: string, input: UpdateRuntimeContextInput) {
    ensureStorageReady()
    return runtimeRepository.updateRuntimeContext(id, input)
  },
}

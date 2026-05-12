import { initStorage } from '@/lib/god-plan/storage/init'
import { groupRepository } from '@/lib/god-plan/repository/group-repository'
import { runtimeService } from '@/lib/god-plan/services/runtime-service'
import type { CreateGroupInput, GroupListQuery, UpdateGroupInput } from '@/lib/god-plan/services/service-types'

function ensureStorageReady() {
  initStorage()
}

export const groupService = {
  async listGroups(query: GroupListQuery = {}) {
    ensureStorageReady()
    const items = await groupRepository.listGroups(query)
    return { items, total: items.length }
  },

  async getGroupDetail(id: string) {
    ensureStorageReady()
    const group = await groupRepository.getGroupById(id)
    const runtimeOptions = await runtimeService.listRuntimes({ groupId: id })
    return {
      ...group,
      runtimeOptions: runtimeOptions.items.map((item) => ({
        id: item.id,
        name: item.name,
        stage: item.stage,
        restrictionStatus: item.restrictionStatus,
        updatedAt: item.updatedAt,
      })),
    }
  },

  async createGroup(input: CreateGroupInput) {
    ensureStorageReady()
    return groupRepository.createGroup(input)
  },

  async updateGroup(id: string, input: UpdateGroupInput) {
    ensureStorageReady()
    return groupRepository.updateGroup(id, input)
  },
}

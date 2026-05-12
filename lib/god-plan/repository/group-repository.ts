import type { GroupListQuery, GroupRecord } from '@/lib/god-plan/seed-source'
import { readState, updateState } from '@/lib/god-plan/storage/db'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getGroupsStore() {
  const state = readState()
  return state.groups
}

export const groupRepository = {
  async listGroups(query: GroupListQuery = {}) {
    const items = getGroupsStore().filter((group) => {
      if (query.primaryRuntimeId && group.primaryRuntimeId !== query.primaryRuntimeId) return false
      if (query.platform && group.platform !== query.platform) return false
      if (query.status && group.status !== query.status) return false
      return true
    })
    return clone(items)
  },

  async getGroupById(id: string) {
    const item = getGroupsStore().find((group) => group.id === id)
    if (!item) throw new Error('Group not found: ' + id)
    return clone(item)
  },

  async createGroup(input: Omit<GroupRecord, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }) {
    const now = new Date().toISOString()
    const record: GroupRecord = {
      ...input,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    }
    updateState((state) => {
      const existing = state.groups.find((group) => group.id === record.id)
      if (existing) {
        throw new Error('Group already exists: ' + record.id)
      }
      state.groups.unshift(record)
    })
    return clone(record)
  },

  async updateGroup(id: string, input: Partial<GroupRecord>) {
    let next: GroupRecord | null = null
    updateState((state) => {
      const item = state.groups.find((group) => group.id === id)
      if (!item) throw new Error('Group not found: ' + id)
      Object.assign(item, input, { updatedAt: new Date().toISOString() })
      next = clone(item)
    })
    if (!next) throw new Error('Group not found: ' + id)
    return next
  },
}

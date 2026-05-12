import { initStorage } from '@/lib/god-plan/storage/init'
import { pipelineRepository } from '@/lib/god-plan/repository/pipeline-repository'
import type {
  BuildMessageContextInput,
  CreateDraftInput,
  IngestMessageInput,
  ProcessMessageInput,
  ProcessMessageResult,
} from '@/lib/god-plan/services/service-types'

function ensureStorageReady() {
  initStorage()
}

export const pipelineService = {
  async ingestMessage(input: IngestMessageInput) {
    ensureStorageReady()
    return pipelineRepository.ingestMessage(input)
  },

  async listMessages(input?: { groupId?: string; runtimeId?: string; limit?: number }) {
    ensureStorageReady()
    return pipelineRepository.listMessages(input)
  },

  async listDecisions(input?: { groupId?: string; runtimeId?: string; decision?: string; limit?: number }) {
    ensureStorageReady()
    return pipelineRepository.listDecisions(input)
  },

  async listDrafts(input?: { runtimeId?: string; draftType?: string; decisionId?: string; limit?: number }) {
    ensureStorageReady()
    return pipelineRepository.listDrafts(input)
  },

  async getDecision(id: string) {
    ensureStorageReady()
    return pipelineRepository.getDecision(id)
  },

  async getDraft(id: string) {
    ensureStorageReady()
    return pipelineRepository.getDraft(id)
  },

  async buildMessageContext(input: BuildMessageContextInput) {
    ensureStorageReady()
    return pipelineRepository.buildMessageContext(input.messageId, input.recentLimit)
  },

  async createDraft(input: CreateDraftInput) {
    ensureStorageReady()
    return pipelineRepository.createDraft(input.decisionId)
  },

  async processMessage(input: ProcessMessageInput): Promise<ProcessMessageResult> {
    ensureStorageReady()
    return pipelineRepository.processMessage(input)
  },
}

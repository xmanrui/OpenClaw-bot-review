import { initStorage } from '@/lib/god-plan/storage/init'
import { reviewRepository } from '@/lib/god-plan/repository/review-repository'
import { runtimeRepository } from '@/lib/god-plan/repository/runtime-repository'
import type { ReviewDecisionDTO } from '@/lib/god-plan/services/service-types'

function ensureStorageReady() {
  initStorage()
}

export const reviewService = {
  async listReviewQueue(params?: { status?: string; riskLevel?: string }) {
    ensureStorageReady()
    let items = await reviewRepository.listReviewQueue()
    if (params?.status) items = items.filter((item) => item.status === params.status)
    if (params?.riskLevel) items = items.filter((item) => item.riskLevel === params.riskLevel)
    return { items, total: items.length }
  },

  async getReviewDetail(id: string) {
    ensureStorageReady()
    return reviewRepository.getReviewById(id)
  },

  async getReviewTrace(id: string) {
    ensureStorageReady()
    return reviewRepository.listReviewTrace(id)
  },

  async decideReview(id: string, input: ReviewDecisionDTO) {
    ensureStorageReady()
    await reviewRepository.decideReview(id, input)
    const review = await reviewRepository.getReviewById(id)
    let runtime = null
    try {
      runtime = await runtimeRepository.getRuntimeById(review.runtimeId)
    } catch {
      runtime = null
    }
    const reviewTrace = await reviewRepository.listReviewTrace(id)
    const runtimeTrace = await runtimeRepository.listRuntimeTrace(review.runtimeId)
    return {
      ok: true as const,
      review,
      runtime,
      traceItems: {
        review: reviewTrace,
        runtime: runtimeTrace,
      },
    }
  },
}

import { NextResponse } from 'next/server'
import { reviewService } from '@/lib/god-plan/services/review-service'
import type { ReviewDecisionInput } from '@/lib/god-plan/types'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const body = (await request.json()) as ReviewDecisionInput
    const data = await reviewService.decideReview(id, body)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

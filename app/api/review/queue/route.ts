import { NextResponse } from 'next/server'
import { reviewService } from '@/lib/god-plan/services/review-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = await reviewService.listReviewQueue({
    status: searchParams.get('status') || undefined,
    riskLevel: searchParams.get('riskLevel') || undefined,
  })
  return NextResponse.json(data)
}

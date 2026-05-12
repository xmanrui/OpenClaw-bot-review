import { NextResponse } from 'next/server'
import { outboundJobService } from '@/lib/god-plan/services/outbound-job-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = await outboundJobService.listOutboundJobs({
    status: searchParams.get('status') || undefined,
    mode: searchParams.get('mode') || undefined,
    reviewId: searchParams.get('reviewId') || undefined,
    runtimeId: searchParams.get('runtimeId') || undefined,
  })
  return NextResponse.json(data)
}

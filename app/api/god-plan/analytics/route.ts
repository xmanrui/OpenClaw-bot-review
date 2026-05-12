import { NextResponse } from 'next/server'
import { analyticsService } from '@/lib/god-plan/services/analytics-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const data = await analyticsService.getSummary()
  return NextResponse.json(data)
}

import { NextResponse } from 'next/server'
import { runtimeService } from '@/lib/god-plan/services/runtime-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = await runtimeService.listRuntimes({
    queue: searchParams.get('queue') || undefined,
    riskLevel: searchParams.get('riskLevel') || undefined,
    restrictionStatus: searchParams.get('restrictionStatus') || undefined,
    stage: searchParams.get('stage') || undefined,
    groupId: searchParams.get('groupId') || undefined,
  })
  return NextResponse.json(data)
}

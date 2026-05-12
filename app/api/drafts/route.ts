import { NextResponse } from 'next/server'
import { pipelineService } from '@/lib/god-plan/services/pipeline-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = await pipelineService.listDrafts({
    runtimeId: searchParams.get('runtimeId') || undefined,
    draftType: searchParams.get('draftType') || undefined,
    decisionId: searchParams.get('decisionId') || undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
  })

  return NextResponse.json(data)
}

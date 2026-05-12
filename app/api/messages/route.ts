import { pipelineService } from '@/lib/god-plan/services/pipeline-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = await pipelineService.listMessages({
    groupId: searchParams.get('groupId') || undefined,
    runtimeId: searchParams.get('runtimeId') || undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
  })

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

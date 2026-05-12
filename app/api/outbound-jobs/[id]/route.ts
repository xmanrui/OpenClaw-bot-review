import { NextResponse } from 'next/server'
import { outboundJobService } from '@/lib/god-plan/services/outbound-job-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const data = await outboundJobService.getOutboundJobById(id)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

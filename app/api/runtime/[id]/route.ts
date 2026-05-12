import { NextResponse } from 'next/server'
import { runtimeService } from '@/lib/god-plan/services/runtime-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const data = await runtimeService.getRuntimeDetail(id)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

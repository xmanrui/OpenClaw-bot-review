import { NextResponse } from 'next/server'
import { groupService } from '@/lib/god-plan/services/group-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = await groupService.listGroups({
    primaryRuntimeId: searchParams.get('primaryRuntimeId') ?? undefined,
    platform: searchParams.get('platform') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await groupService.createGroup(body)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

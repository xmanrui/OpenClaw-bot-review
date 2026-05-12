import { NextResponse } from 'next/server'
import { groupService } from '@/lib/god-plan/services/group-service'
import { runtimeService } from '@/lib/god-plan/services/runtime-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizePatchBody(body: Record<string, unknown>) {
  const next: Record<string, unknown> = {}

  if ('name' in body) next.name = body.name
  if ('platform' in body) next.platform = body.platform
  if ('category' in body) next.category = body.category
  if ('language' in body) next.language = body.language
  if ('status' in body) next.status = body.status
  if ('description' in body) next.description = body.description
  if ('tags' in body) next.tags = body.tags
  if ('source' in body) next.source = body.source
  if ('owner' in body) next.owner = body.owner
  if ('externalRefs' in body) next.externalRefs = body.externalRefs
  if ('lastActiveAt' in body) next.lastActiveAt = body.lastActiveAt

  if ('primaryRuntimeId' in body) {
    const value = body.primaryRuntimeId
    next.primaryRuntimeId = value === '' ? null : value
  }

  return next
}

async function validatePrimaryRuntimeId(groupId: string, value: unknown) {
  if (value === undefined || value === null || value === '') return
  if (typeof value !== 'string') {
    throw new Error('primaryRuntimeId must be a string or null')
  }
  const runtime = await runtimeService.getRuntimeDetail(value)
  if (runtime.groupId && runtime.groupId !== groupId) {
    throw new Error(`primaryRuntimeId ${value} does not belong to group ${groupId}`)
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const data = await groupService.getGroupDetail(id)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const body = await request.json()
    const normalized = normalizePatchBody(body)
    await validatePrimaryRuntimeId(id, normalized.primaryRuntimeId)
    const data = await groupService.updateGroup(id, normalized)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

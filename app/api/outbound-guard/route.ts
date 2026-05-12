import { NextResponse } from 'next/server'
import { outboundGuardService } from '@/lib/god-plan/services/outbound-guard-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return NextResponse.json(outboundGuardService.getDiagnostics())
}

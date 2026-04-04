import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/auth'

export async function GET(request) {
  const adminUser = await requireAdminUser(request)

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    user: adminUser,
  })
}

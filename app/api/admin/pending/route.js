import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const tools = await db.tool.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tools)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

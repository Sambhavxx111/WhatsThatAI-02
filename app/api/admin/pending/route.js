import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth'
import { logUnauthorizedAccess } from '@/lib/securityLogger'

export async function GET(request) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      await logUnauthorizedAccess({
        req: request,
        status: 403,
        metadata: {
          route: 'admin_pending_tools',
        },
      })
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

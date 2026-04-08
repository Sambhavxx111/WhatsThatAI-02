import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth'
import { logAdminActionForRequest } from '@/lib/admin-audit'
import { logUnauthorizedAccess } from '@/lib/securityLogger'

const allowedStatuses = new Set(['approved', 'rejected'])

export async function POST(request) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      await logUnauthorizedAccess({
        req: request,
        status: 403,
        metadata: {
          route: 'admin_update_tool_status',
        },
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id, status } = await request.json()

    const toolId = Number(id)

    if (!Number.isInteger(toolId) || !allowedStatuses.has(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await db.tool.update({
      where: { id: toolId },
      data: { status },
    })

    await logAdminActionForRequest({
      request,
      adminId: adminUser.id,
      action: status === 'approved' ? 'tool_approval' : 'tool_rejection',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

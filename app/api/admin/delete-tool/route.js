import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth'
import { logAdminActionForRequest } from '@/lib/admin-audit'

export async function POST(request) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await request.json()
    const toolId = Number(id)

    if (!Number.isInteger(toolId) || toolId <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await db.tool.delete({
      where: { id: toolId },
    })

    await logAdminActionForRequest({
      request,
      adminId: adminUser.id,
      action: 'tool_deletion',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    console.error('Delete tool error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

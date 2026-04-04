import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

const VALID_ACTIONS = new Set(['view', 'click', 'use'])

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { toolId, action } = await request.json()
    const numericToolId = Number(toolId)
    const normalizedAction = String(action || '').trim().toLowerCase()

    if (!numericToolId || !VALID_ACTIONS.has(normalizedAction)) {
      return NextResponse.json({ error: 'Invalid activity payload.' }, { status: 400 })
    }

    await db.userActivity.create({
      data: {
        userId: user.id,
        toolId: numericToolId,
        action: normalizedAction,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activity tracking error:', error)
    return NextResponse.json({ error: 'Could not track activity.' }, { status: 500 })
  }
}

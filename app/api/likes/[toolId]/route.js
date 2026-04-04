import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ liked: false, authenticated: false })
    }

    const toolId = Number(params.toolId)

    if (!toolId) {
      return NextResponse.json({ error: 'Invalid tool id.' }, { status: 400 })
    }

    const like = await db.userLike.findUnique({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId,
        },
      },
    })

    return NextResponse.json({ liked: Boolean(like), authenticated: true })
  } catch (error) {
    console.error('Like status error:', error)
    return NextResponse.json({ error: 'Could not fetch like status.' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const toolId = Number(params.toolId)

    if (!toolId) {
      return NextResponse.json({ error: 'Invalid tool id.' }, { status: 400 })
    }

    await db.userLike.deleteMany({
      where: {
        userId: user.id,
        toolId,
      },
    })

    return NextResponse.json({ success: true, liked: false })
  } catch (error) {
    console.error('Unlike error:', error)
    return NextResponse.json({ error: 'Could not remove liked tool.' }, { status: 500 })
  }
}

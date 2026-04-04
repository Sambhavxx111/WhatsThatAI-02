import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { attachRatingsToTools } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const likes = await db.userLike.findMany({
      where: {
        userId: user.id,
        tool: {
          status: 'approved',
          active: true,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        tool: true,
      },
    })

    const toolsWithRatings = await attachRatingsToTools(likes.map((item) => item.tool))

    return NextResponse.json(
      toolsWithRatings.map((tool, index) => ({
        ...tool,
        likedAt: likes[index]?.createdAt || null,
      }))
    )
  } catch (error) {
    console.error('Likes fetch error:', error)
    return NextResponse.json({ error: 'Could not fetch liked tools.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { toolId } = await request.json()
    const numericToolId = Number(toolId)

    if (!numericToolId) {
      return NextResponse.json({ error: 'A valid tool is required.' }, { status: 400 })
    }

    const tool = await db.tool.findFirst({
      where: {
        id: numericToolId,
        status: 'approved',
        active: true,
      },
    })

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found.' }, { status: 404 })
    }

    await db.userLike.upsert({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId: numericToolId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        toolId: numericToolId,
      },
    })

    return NextResponse.json({ success: true, liked: true })
  } catch (error) {
    console.error('Like create error:', error)
    return NextResponse.json({ error: 'Could not save liked tool.' }, { status: 500 })
  }
}

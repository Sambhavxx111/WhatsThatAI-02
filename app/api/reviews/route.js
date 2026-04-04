import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { reviewSchema, formatZodError } from '@/lib/validation'

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = reviewSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { toolId, rating, comment } = parsed.data

    const tool = await db.tool.findUnique({ where: { id: toolId } })

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found.' }, { status: 404 })
    }

    const savedReview = await db.review.upsert({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId,
        },
      },
      update: {
        rating,
        review: comment,
      },
      create: {
        userId: user.id,
        toolId,
        rating,
        review: comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      review: {
        id: savedReview.id,
        userId: savedReview.userId,
        toolId: savedReview.toolId,
        rating: savedReview.rating,
        review: savedReview.review || '',
        createdAt: savedReview.createdAt,
        user: savedReview.user,
      },
    })
  } catch (error) {
    console.error('Review save error:', error)
    return NextResponse.json({ error: 'Could not save review.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { toolId, rating, review } = await request.json()
    const numericToolId = Number(toolId)
    const numericRating = Number(rating)
    const reviewText = String(review || '').trim()

    if (!numericToolId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'A valid tool and rating are required.' }, { status: 400 })
    }

    const tool = await db.tool.findUnique({ where: { id: numericToolId } })

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found.' }, { status: 404 })
    }

    const savedReview = await db.review.upsert({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId: numericToolId,
        },
      },
      update: {
        rating: numericRating,
        review: reviewText,
      },
      create: {
        userId: user.id,
        toolId: numericToolId,
        rating: numericRating,
        review: reviewText,
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

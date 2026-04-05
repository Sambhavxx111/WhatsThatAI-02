import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { reviewSchema, reviewDeleteSchema, formatZodError } from '@/lib/validation'
import { isWhatsThatAIOfficialEmail } from '@/lib/official-accounts'

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
            email: true,
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
        user: {
          id: savedReview.user?.id,
          name: savedReview.user?.name,
          isOfficial: isWhatsThatAIOfficialEmail(savedReview.user?.email),
        },
      },
    })
  } catch (error) {
    console.error('Review save error:', error)
    return NextResponse.json({ error: 'Could not save review.' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = reviewDeleteSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { toolId } = parsed.data

    const existingReview = await db.review.findUnique({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId,
        },
      },
      select: {
        id: true,
      },
    })

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
    }

    await db.review.delete({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review delete error:', error)
    return NextResponse.json({ error: 'Could not delete review.' }, { status: 500 })
  }
}

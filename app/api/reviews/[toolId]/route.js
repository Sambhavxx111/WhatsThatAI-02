import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const toolId = Number(params.toolId)

    if (!toolId) {
      return NextResponse.json({ error: 'Invalid tool id.' }, { status: 400 })
    }

    const [reviews, user] = await Promise.all([
      db.review.findMany({
        where: { toolId },
        orderBy: [{ createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      getAuthenticatedUser(request),
    ])

    return NextResponse.json(
      reviews.map((review) => ({
        id: review.id,
        userId: review.userId,
        toolId: review.toolId,
        rating: review.rating,
        review: review.review || '',
        createdAt: review.createdAt,
        user: review.user,
        isOwner: user ? user.id === review.userId : false,
      }))
    )
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: 'Could not fetch reviews.' }, { status: 500 })
  }
}

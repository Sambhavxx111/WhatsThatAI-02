import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'

export function handlePrismaError(error: unknown, fallbackMessage = 'Database operation failed.') {
  console.error('Prisma error:', error)
  return new Error(fallbackMessage)
}

export async function createValidatedReview(input: unknown, userId: number) {
  const schema = z.object({
    toolId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(300).optional().default(''),
  })

  const data = schema.parse(input)

  try {
    return await db.review.upsert({
      where: {
        userId_toolId: {
          userId,
          toolId: data.toolId,
        },
      },
      update: {
        rating: data.rating,
        review: data.comment,
      },
      create: {
        userId,
        toolId: data.toolId,
        rating: data.rating,
        review: data.comment,
      },
    })
  } catch (error) {
    throw handlePrismaError(error, 'Could not save review.')
  }
}

export async function findApprovedToolBySlug(slug: string) {
  try {
    return await db.tool.findFirst({
      where: {
        slug,
        status: 'approved',
        active: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        pricing: true,
      },
    })
  } catch (error) {
    throw handlePrismaError(error, 'Could not fetch tool.')
  }
}

export async function searchApprovedToolsByName(query: string) {
  const safeQuery = query.trim()

  try {
    return await db.tool.findMany({
      where: {
        status: 'approved',
        active: true,
        name: {
          contains: safeQuery,
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 20,
    })
  } catch (error) {
    throw handlePrismaError(error, 'Could not search tools.')
  }
}

export async function getApprovedToolsByCategory(category: string) {
  try {
    return await db.$queryRaw(
      Prisma.sql`
        SELECT id, name, slug, category, pricing
        FROM tools
        WHERE status = 'approved'
          AND active = true
          AND category = ${category}
        ORDER BY name ASC
        LIMIT 50
      `
    )
  } catch (error) {
    throw handlePrismaError(error, 'Could not fetch category tools.')
  }
}

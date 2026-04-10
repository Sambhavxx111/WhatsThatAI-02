import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth'
import { getAllCuratedCollectionsForAdmin, sanitizeCategorySelection } from '@/lib/onboarding'
import { curatedCollectionSchema, formatZodError } from '@/lib/validation'
import { logAdminActionForRequest } from '@/lib/admin-audit'
import { logUnauthorizedAccess } from '@/lib/securityLogger'

function buildCollectionItems(toolIds, notesByToolId = {}) {
  return toolIds.map((toolId, index) => ({
    toolId,
    sortOrder: index,
    note: notesByToolId[String(toolId)] || null,
  }))
}

export async function GET(request) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      await logUnauthorizedAccess({
        req: request,
        status: 403,
        metadata: {
          route: 'admin_curated_collections',
        },
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [collections, availableTools] = await Promise.all([
      getAllCuratedCollectionsForAdmin(),
      db.tool.findMany({
        where: {
          status: 'approved',
          active: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
        },
        orderBy: [{ name: 'asc' }],
        take: 250,
      }),
    ])

    return NextResponse.json({ collections, availableTools })
  } catch (error) {
    console.error('Admin curated collections fetch error:', error)
    return NextResponse.json({ error: 'Could not fetch curated collections.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      await logUnauthorizedAccess({
        req: request,
        status: 403,
        metadata: {
          route: 'admin_curated_collections_create',
        },
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = curatedCollectionSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { title, slug, description, summary, type, active, categories, toolIds, notesByToolId } = parsed.data

    const existing = await db.curatedCollection.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'A collection with this slug already exists.' }, { status: 409 })
    }

    if (toolIds.length) {
      const availableToolCount = await db.tool.count({
        where: {
          id: {
            in: toolIds,
          },
          status: 'approved',
          active: true,
        },
      })

      if (availableToolCount !== toolIds.length) {
        return NextResponse.json({ error: 'One or more selected tools are unavailable.' }, { status: 400 })
      }
    }

    const collection = await db.curatedCollection.create({
      data: {
        slug,
        title,
        description,
        summary,
        type,
        active,
        categories: sanitizeCategorySelection(categories),
        createdByAdminId: adminUser.id,
        updatedByAdminId: adminUser.id,
        items: {
          create: buildCollectionItems(toolIds, notesByToolId),
        },
      },
      include: {
        items: {
          include: {
            tool: true,
          },
          orderBy: [{ sortOrder: 'asc' }],
        },
      },
    })

    await logAdminActionForRequest({
      request,
      adminId: adminUser.id,
      action: 'tool_approval',
      metadata: {
        route: 'admin_curated_collections_create',
        collectionId: collection.id,
        collectionSlug: collection.slug,
      },
    })

    return NextResponse.json({ success: true, collection })
  } catch (error) {
    console.error('Admin curated collection create error:', error)
    return NextResponse.json({ error: 'Could not create curated collection.' }, { status: 500 })
  }
}

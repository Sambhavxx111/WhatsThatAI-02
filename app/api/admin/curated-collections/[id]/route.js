import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth'
import { sanitizeCategorySelection } from '@/lib/onboarding'
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

export async function PATCH(request, { params }) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      await logUnauthorizedAccess({
        req: request,
        status: 403,
        metadata: {
          route: 'admin_curated_collection_update',
        },
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const collectionId = Number(params?.id)
    if (!collectionId) {
      return NextResponse.json({ error: 'Invalid collection id.' }, { status: 400 })
    }

    const parsed = curatedCollectionSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { title, slug, description, summary, type, active, categories, toolIds, notesByToolId } = parsed.data

    const existing = await db.curatedCollection.findUnique({
      where: { id: collectionId },
      select: { id: true, slug: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Collection not found.' }, { status: 404 })
    }

    const slugCollision = await db.curatedCollection.findFirst({
      where: {
        slug,
        NOT: {
          id: collectionId,
        },
      },
      select: {
        id: true,
      },
    })

    if (slugCollision) {
      return NextResponse.json({ error: 'A collection with this slug already exists.' }, { status: 409 })
    }

    if (toolIds.length) {
      const availableToolCount = await db.tool.count({
        where: {
          id: { in: toolIds },
          status: 'approved',
          active: true,
        },
      })
      if (availableToolCount !== toolIds.length) {
        return NextResponse.json({ error: 'One or more selected tools are unavailable.' }, { status: 400 })
      }
    }

    const collection = await db.$transaction(async (tx) => {
      await tx.curatedCollectionTool.deleteMany({
        where: {
          collectionId,
        },
      })

      return tx.curatedCollection.update({
        where: {
          id: collectionId,
        },
        data: {
          slug,
          title,
          description,
          summary,
          type,
          active,
          categories: sanitizeCategorySelection(categories),
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
    })

    await logAdminActionForRequest({
      request,
      adminId: adminUser.id,
      action: 'tool_approval',
      metadata: {
        route: 'admin_curated_collection_update',
        collectionId: collection.id,
        collectionSlug: collection.slug,
      },
    })

    return NextResponse.json({ success: true, collection })
  } catch (error) {
    console.error('Admin curated collection update error:', error)
    return NextResponse.json({ error: 'Could not update curated collection.' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      await logUnauthorizedAccess({
        req: request,
        status: 403,
        metadata: {
          route: 'admin_curated_collection_delete',
        },
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const collectionId = Number(params?.id)
    if (!collectionId) {
      return NextResponse.json({ error: 'Invalid collection id.' }, { status: 400 })
    }

    const existing = await db.curatedCollection.findUnique({
      where: {
        id: collectionId,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Collection not found.' }, { status: 404 })
    }

    await db.curatedCollection.delete({
      where: {
        id: collectionId,
      },
    })

    await logAdminActionForRequest({
      request,
      adminId: adminUser.id,
      action: 'tool_deletion',
      metadata: {
        route: 'admin_curated_collection_delete',
        collectionId,
        collectionSlug: existing.slug,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin curated collection delete error:', error)
    return NextResponse.json({ error: 'Could not delete curated collection.' }, { status: 500 })
  }
}

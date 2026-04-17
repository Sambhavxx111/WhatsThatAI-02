import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth'
import { syncToolTags } from '@/lib/tool-tags'
import { formatZodError, toolWriteSchema } from '@/lib/validation'

function normalizeToolPricing(pricing) {
  return pricing === 'enterprise' ? 'paid' : pricing
}

function buildSlug(value, fallback = '') {
  const source = String(value || fallback || '')
  return source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function PUT(request, context) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const toolId = Number(context?.params?.id)

    if (!Number.isInteger(toolId) || toolId <= 0) {
      return NextResponse.json({ error: 'Invalid tool id.' }, { status: 400 })
    }

    const parsed = toolWriteSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const payload = parsed.data
    const slug = buildSlug(payload.slug, payload.name)

    if (!slug) {
      return NextResponse.json({ error: 'A valid slug could not be generated.' }, { status: 400 })
    }

    const tool = await db.$transaction(async (transaction) => {
      const updatedTool = await transaction.tool.update({
        where: { id: toolId },
        data: {
          name: payload.name,
          slug,
          description: payload.description,
          category: payload.category,
          pricing: normalizeToolPricing(payload.pricing || 'freemium'),
          websiteUrl: payload.websiteUrl,
          logoUrl: payload.logoUrl || null,
          source: payload.source || 'manual',
          status: payload.status || 'approved',
          active: payload.active ?? true,
        },
      })

      const tagNames = await syncToolTags(
        transaction,
        updatedTool.id,
        payload.tags,
        payload.category
      )

      return {
        ...updatedTool,
        tags: tagNames,
      }
    })

    return NextResponse.json({ success: true, tool })
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Tool not found.' }, { status: 404 })
    }

    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A tool with this slug or name already exists.' }, { status: 409 })
    }

    console.error('Update tool error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getFeaturedTools, getTool, getTools, getToolsPage, searchTools } from '@/lib/queries'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { requireAdminUser } from '@/lib/auth'
import { syncToolTags } from '@/lib/tool-tags'
import { formatZodError, searchSchema, toolWriteSchema } from '@/lib/validation'

function normalizeToolPricing(pricing) {
  return pricing === 'enterprise' ? 'paid' : pricing
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const query = searchParams.get('query')
  const featured = searchParams.get('featured')
  const filter = searchParams.get('filter')
  const tag = searchParams.get('tag') || ''
  const pricing = searchParams.get('pricing') || ''
  const source = searchParams.get('source') || ''
  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')
  const batched = searchParams.get('batched') === 'true'
  const limit = limitParam ? Number(limitParam) : undefined
  const offset = offsetParam ? Number(offsetParam) : 0

  if (slug) {
    const tool = await getTool(slug)
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    return NextResponse.json(tool)
  }

  if (featured === 'true') {
    const tools = await getFeaturedTools(limit || 6)
    return NextResponse.json(tools)
  }

  if (query) {
    const rateLimitResponse = await enforceRateLimit(request, {
      key: 'search',
      limit: 100,
      windowMs: 60 * 1000,
      message: 'Too many search requests. Please try again shortly.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const parsed = searchSchema.safeParse({ query, filter: filter || undefined, tag: tag || undefined })

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    if (batched) {
      const payload = await getToolsPage({
        query: parsed.data.query,
        pricing,
        source,
        tag: parsed.data.tag || '',
        limit,
        offset,
      })
      return NextResponse.json(payload)
    }

    const tools = await searchTools(parsed.data.query, {
      pricing,
      source,
      tag: parsed.data.tag || '',
    })
    return NextResponse.json(tools)
  }

  if (batched) {
    const payload = await getToolsPage({
      pricing,
      source,
      tag,
      limit,
      offset,
    })
    return NextResponse.json(payload)
  }

  const tools = await getTools({
    pricing,
    source,
    tag,
  })
  return NextResponse.json(limit ? tools.slice(0, limit) : tools)
}

export async function POST(request) {
  try {
    const adminUser = await requireAdminUser(request)

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = toolWriteSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const payload = parsed.data
    const slug =
      payload.slug?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') ||
      payload.name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

    if (!slug) {
      return NextResponse.json({ error: 'A valid slug could not be generated.' }, { status: 400 })
    }

    const tool = await db.$transaction(async (transaction) => {
      const createdTool = await transaction.tool.create({
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
        createdTool.id,
        payload.tags,
        payload.category
      )

      return {
        ...createdTool,
        tags: tagNames,
      }
    })

    return NextResponse.json({ success: true, tool })
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A tool with this slug or name already exists.' }, { status: 409 })
    }

    console.error('Create tool error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

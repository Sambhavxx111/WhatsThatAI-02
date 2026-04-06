import { NextResponse } from 'next/server'
import { getFeaturedTools, getTool, getTools, getToolsPage, searchTools } from '@/lib/queries'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { formatZodError, searchSchema } from '@/lib/validation'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const query = searchParams.get('query')
  const featured = searchParams.get('featured')
  const filter = searchParams.get('filter')
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
    const rateLimitResponse = enforceRateLimit(request, {
      key: 'search',
      limit: 100,
      windowMs: 60 * 1000,
      message: 'Too many search requests. Please try again shortly.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const parsed = searchSchema.safeParse({ query, filter: filter || undefined })

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    if (batched) {
      const payload = await getToolsPage({
        query: parsed.data.query,
        pricing,
        source,
        limit,
        offset,
      })
      return NextResponse.json(payload)
    }

    const tools = await searchTools(parsed.data.query)
    return NextResponse.json(tools)
  }

  if (batched) {
    const payload = await getToolsPage({
      pricing,
      source,
      limit,
      offset,
    })
    return NextResponse.json(payload)
  }

  const tools = await getTools()
  return NextResponse.json(limit ? tools.slice(0, limit) : tools)
}

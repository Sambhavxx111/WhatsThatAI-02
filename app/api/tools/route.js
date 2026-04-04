import { NextResponse } from 'next/server'
import { getFeaturedTools, getTool, getTools, searchTools } from '@/lib/queries'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const query = searchParams.get('query')
  const featured = searchParams.get('featured')
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Number(limitParam) : undefined

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
    const tools = await searchTools(query)
    return NextResponse.json(tools)
  }

  const tools = await getTools()
  return NextResponse.json(limit ? tools.slice(0, limit) : tools)
}

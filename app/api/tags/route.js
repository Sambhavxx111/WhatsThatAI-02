import { NextResponse } from 'next/server'
import { getTopTags } from '@/lib/queries'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') || 24)

  const tags = await getTopTags(limit)
  return NextResponse.json(tags)
}

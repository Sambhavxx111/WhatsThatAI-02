import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  evaluateToolForInsertion,
  findExistingTool,
  normalizeName,
  normalizeTool,
  slugify,
} from '@/lib/tool-ingestion'

export async function POST(request) {
  try {
    const payload = await request.json()
    const tool = normalizeTool(payload)

    if (!tool.name || !tool.description || !tool.category || !tool.pricing || !tool.websiteUrl) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const normalizedName = normalizeName(tool.name)
    const slug = slugify(tool.name)

    if (!slug) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const existingTools = await findExistingTool(db, {
      normalizedName,
      slug,
      websiteUrl: tool.websiteUrl,
    })

    if (existingTools.length > 0) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const evaluation = await evaluateToolForInsertion(tool)

    await db.tool.create({
      data: {
        name: tool.name,
        slug,
        description: evaluation.description,
        category: tool.category,
        pricing: tool.pricing,
        websiteUrl: tool.websiteUrl,
        status: evaluation.status,
        source: 'user',
        active: evaluation.active,
      },
    })

    return NextResponse.json({
      success: true,
      status: evaluation.status,
      autoApproved: evaluation.status === 'approved',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

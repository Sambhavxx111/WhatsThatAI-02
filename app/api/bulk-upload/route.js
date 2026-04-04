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

    if (!Array.isArray(payload) || payload.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const normalizedTools = payload
      .map(normalizeTool)
      .filter(
        (tool) =>
          tool.name &&
          tool.description &&
          tool.category &&
          tool.pricing &&
          tool.websiteUrl
      )

    if (normalizedTools.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, skipped: payload.length })
    }

    const incomingNameMap = new Map()

    for (const tool of normalizedTools) {
      const normalizedName = normalizeName(tool.name)

      if (!incomingNameMap.has(normalizedName)) {
        incomingNameMap.set(normalizedName, tool)
      }
    }

    const uniqueNames = [...incomingNameMap.keys()]
    let inserted = 0
    let skipped = payload.length - uniqueNames.length

    for (const normalizedName of uniqueNames) {
      const tool = incomingNameMap.get(normalizedName)
      const slug = slugify(tool.name)

      if (!slug) {
        skipped += 1
        continue
      }

      const existingTools = await findExistingTool(db, {
        normalizedName,
        slug,
        websiteUrl: tool.websiteUrl,
      })

      if (existingTools.length > 0) {
        skipped += 1
        continue
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
          source: 'bulk',
          active: evaluation.active,
        },
      })

      inserted += 1
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

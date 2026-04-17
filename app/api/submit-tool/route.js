import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { assertPublicWebsiteUrl } from '@/lib/security'
import { syncToolTags } from '@/lib/tool-tags'
import { formatZodError, toolSubmissionSchema } from '@/lib/validation'
import {
  evaluateToolForInsertion,
  findExistingTool,
  normalizeName,
  slugify,
} from '@/lib/tool-ingestion'

function normalizeToolPricing(pricing) {
  return pricing === 'enterprise' ? 'paid' : pricing
}

export async function POST(request) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, {
      key: 'submit-tool',
      limit: 10,
      windowMs: 60 * 60 * 1000,
      message: 'Too many submissions. Please try again later.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const parsed = toolSubmissionSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const tool = {
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      tags: parsed.data.tags || [],
      pricing: normalizeToolPricing(parsed.data.pricing || 'freemium'),
      websiteUrl: parsed.data.url,
    }

    await assertPublicWebsiteUrl(tool.websiteUrl)

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

    await db.$transaction(async (transaction) => {
      const createdTool = await transaction.tool.create({
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

      await syncToolTags(transaction, createdTool.id, tool.tags, tool.category)
    })

    return NextResponse.json({
      success: true,
      status: evaluation.status,
      autoApproved: evaluation.status === 'approved',
    })
  } catch (error) {
    if (
      String(error?.message || '').includes('Blocked host') ||
      String(error?.message || '').includes('allowed')
    ) {
      return NextResponse.json({ error: 'This website URL is not allowed.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

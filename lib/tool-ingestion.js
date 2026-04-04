import { Prisma } from '@prisma/client'
import { assertPublicWebsiteUrl } from '@/lib/security'

const SPAM_TERMS = [
  'crypto',
  'casino',
  'betting',
  'loan',
  'adult',
  'porn',
  'viagra',
]

const VALID_PRICING = new Set(['free', 'freemium', 'paid', 'enterprise'])
const AUTO_APPROVE_SCORE = 6

function withTimeout(promiseFactory, timeoutMs = 8000) {
  return Promise.race([
    promiseFactory(),
    new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId)
        reject(new Error('Request timed out'))
      }, timeoutMs)
    }),
  ])
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

export function normalizeTool(tool, defaults = {}) {
  return {
    name: String(tool?.name || '').trim(),
    description: String(tool?.description || '').trim(),
    category: String(tool?.category || defaults.category || '').trim(),
    pricing: String(tool?.pricing || defaults.pricing || '').trim().toLowerCase(),
    websiteUrl: String(tool?.website_url || tool?.websiteUrl || '').trim(),
  }
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return String(match?.[1] || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMetaDescription(html) {
  const match = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  )

  if (match?.[1]) {
    return String(match[1]).replace(/\s+/g, ' ').trim()
  }

  const propertyMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  )

  return String(propertyMatch?.[1] || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasSpamSignals(tool) {
  const haystack = `${tool.name} ${tool.description} ${tool.websiteUrl}`.toLowerCase()
  return SPAM_TERMS.some((term) => haystack.includes(term))
}

export async function findExistingTool(db, { normalizedName, slug, websiteUrl }) {
  const normalizedWebsiteUrl = String(websiteUrl || '').trim().toLowerCase()

  const existingTools = await db.$queryRaw(
    Prisma.sql`
      SELECT id
      FROM tools
      WHERE REPLACE(LOWER(name), ' ', '') LIKE ${`%${normalizedName}%`}
         OR slug = ${slug}
         OR LOWER(website_url) = ${normalizedWebsiteUrl}
      LIMIT 1
    `
  )

  return existingTools
}

export async function inspectWebsite(websiteUrl, timeoutMs = 8000) {
  if (!websiteUrl) {
    return {
      reachable: false,
      title: '',
      metaDescription: '',
    }
  }

  try {
    const safeUrl = await assertPublicWebsiteUrl(websiteUrl)
    const response = await withTimeout(
      () =>
        fetch(safeUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 WhatsThatAI/1.0',
          },
          cache: 'no-store',
        }),
      timeoutMs
    )

    if (!response.ok) {
      return {
        reachable: false,
        title: '',
        metaDescription: '',
      }
    }

    const html = await response.text()

    return {
      reachable: true,
      title: extractTitle(html),
      metaDescription: extractMetaDescription(html),
    }
  } catch {
    return {
      reachable: false,
      title: '',
      metaDescription: '',
    }
  }
}

export async function evaluateToolForInsertion(tool, options = {}) {
  const inspectWebsiteForScore = options.inspectWebsite !== false
  const website = inspectWebsiteForScore
    ? await inspectWebsite(tool.websiteUrl, options.timeoutMs)
    : {
        reachable: false,
        title: '',
        metaDescription: '',
      }
  let score = 0

  if (tool.websiteUrl.startsWith('https://')) score += 1
  if (tool.description.length >= 80) score += 1
  if (tool.category.length >= 3) score += 1
  if (VALID_PRICING.has(tool.pricing)) score += 1
  if (website.reachable) score += 2
  if (website.title) score += 1
  if (website.metaDescription) score += 1

  const normalizedToolName = normalizeName(tool.name)
  const normalizedWebsiteTitle = normalizeName(website.title)

  if (normalizedToolName && normalizedWebsiteTitle.includes(normalizedToolName)) {
    score += 1
  }

  if (hasSpamSignals(tool)) {
    score -= 4
  }

  if (tool.description.length < 40) {
    score -= 1
  }

  const trustedSourceBoost = options.trustedSource ? 1 : 0
  const approvalScore = score + trustedSourceBoost
  const canAutoApproveWithoutWebsite =
    options.trustedSource &&
    tool.websiteUrl.startsWith('https://') &&
    tool.description.length >= 80 &&
    tool.category.length >= 3 &&
    VALID_PRICING.has(tool.pricing)

  const status =
    (website.reachable && approvalScore >= AUTO_APPROVE_SCORE) || canAutoApproveWithoutWebsite
      ? 'approved'
      : 'pending'
  const active = true
  const enrichedDescription =
    tool.description || website.metaDescription || `${tool.name} AI tool`

  return {
    score,
    status,
    active,
    metadata: website,
    description: enrichedDescription,
  }
}

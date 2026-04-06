import { db } from './db'

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatPricing(pricing) {
  if (!pricing) return 'Unknown'
  if (pricing === 'free') return 'Free'
  if (pricing === 'freemium') return 'Freemium'
  if (pricing === 'paid') return 'Paid'
  return pricing
}

function categoryColor(category) {
  const normalized = String(category || '').toLowerCase()

  if (normalized.includes('chat')) return 'from-green-400 to-emerald-600'
  if (normalized.includes('image')) return 'from-fuchsia-500 to-rose-500'
  if (normalized.includes('video')) return 'from-orange-400 to-red-600'
  if (normalized.includes('voice')) return 'from-sky-400 to-cyan-600'
  if (normalized.includes('code')) return 'from-indigo-400 to-violet-600'
  if (normalized.includes('product')) return 'from-amber-400 to-orange-500'
  return 'from-slate-500 to-slate-700'
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'AI'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function normalizeRating(value) {
  if (value === null || value === undefined) return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? Number(numberValue.toFixed(1)) : null
}

export function mapTool(tool, ratingData = {}) {
  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug || slugify(tool.name),
    description: tool.description || 'No description available yet.',
    category: tool.category || 'AI Tools',
    pricing: formatPricing(tool.pricing),
    websiteUrl: tool.websiteUrl || '',
    logoUrl: tool.logoUrl || '',
    tags: tool.tags || [],
    source: tool.source || 'manual',
    status: tool.status || 'approved',
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
    featured: false,
    rating: ratingData.avgRating ?? null,
    avgRating: ratingData.avgRating ?? null,
    totalReviews: ratingData.totalReviews ?? 0,
    icon: initials(tool.name),
    color: categoryColor(tool.category),
  }
}

const publicToolFilter = {
  status: 'approved',
  active: true,
}

function buildPublicToolWhere({ query = '', pricing = '', source = '' } = {}) {
  const normalizedQuery = String(query || '').trim()
  const normalizedPricing = String(pricing || '').trim().toLowerCase()
  const normalizedSource = String(source || '').trim().toLowerCase()

  const where = {
    ...publicToolFilter,
  }

  if (normalizedPricing) {
    where.pricing = normalizedPricing
  }

  if (normalizedSource) {
    where.source = normalizedSource
  }

  if (normalizedQuery) {
    where.OR = [
      { name: { contains: normalizedQuery } },
      { category: { contains: normalizedQuery } },
      { description: { contains: normalizedQuery } },
    ]
  }

  return where
}

export async function getReviewAggregates(toolIds) {
  if (!toolIds.length) {
    return new Map()
  }

  const aggregates = await db.review.groupBy({
    by: ['toolId'],
    where: {
      toolId: {
        in: toolIds,
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  })

  return new Map(
    aggregates.map((item) => [
      item.toolId,
      {
        avgRating: normalizeRating(item._avg.rating),
        totalReviews: item._count.id,
      },
    ])
  )
}

export async function attachRatingsToTools(tools) {
  const ratingMap = await getReviewAggregates(tools.map((tool) => tool.id))
  return tools.map((tool) => mapTool(tool, ratingMap.get(tool.id)))
}

export async function getTools() {
  try {
    const tools = await db.tool.findMany({
      where: publicToolFilter,
      orderBy: [{ name: 'asc' }],
    })

    return attachRatingsToTools(tools)
  } catch (error) {
    console.error('Error fetching tools:', error)
    return []
  }
}

export async function getToolsPage({
  query = '',
  pricing = '',
  source = '',
  limit = 24,
  offset = 0,
} = {}) {
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 48)
    const safeOffset = Math.max(Number(offset) || 0, 0)
    const where = buildPublicToolWhere({ query, pricing, source })

    const [tools, total] = await Promise.all([
      db.tool.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: safeOffset,
        take: safeLimit,
      }),
      db.tool.count({ where }),
    ])

    const mappedTools = await attachRatingsToTools(tools)

    return {
      tools: mappedTools,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + mappedTools.length < total,
      nextOffset: safeOffset + mappedTools.length,
    }
  } catch (error) {
    console.error('Error fetching tools page:', error)
    return {
      tools: [],
      total: 0,
      limit: Math.min(Math.max(Number(limit) || 24, 1), 48),
      offset: Math.max(Number(offset) || 0, 0),
      hasMore: false,
      nextOffset: 0,
    }
  }
}

export async function getTool(slug) {
  try {
    const tools = await db.tool.findMany({
      where: publicToolFilter,
      orderBy: [{ name: 'asc' }],
    })

    const tool = tools.find((item) => (item.slug || slugify(item.name)) === slug)

    if (!tool) {
      return null
    }

    const ratingMap = await getReviewAggregates([tool.id])
    return mapTool(tool, ratingMap.get(tool.id))
  } catch (error) {
    console.error('Error fetching tool:', error)
    return null
  }
}

export async function getCategories() {
  try {
    const groupedCategories = await db.tool.groupBy({
      by: ['category'],
      where: publicToolFilter,
      _count: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      },
    })

    return groupedCategories.map((category) => ({
      name: category.category || 'AI Tools',
      count: category._count.category,
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function searchTools(query) {
  if (!query || query.trim() === '') {
    return getTools()
  }

  try {
    const tools = await db.tool.findMany({
      where: buildPublicToolWhere({ query }),
      orderBy: [{ name: 'asc' }],
    })

    return attachRatingsToTools(tools)
  } catch (error) {
    console.error('Error searching tools:', error)
    return []
  }
}

export async function getFeaturedTools(limit = 6) {
  try {
    const tools = await db.tool.findMany({
      where: publicToolFilter,
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      take: limit,
    })

    return attachRatingsToTools(tools)
  } catch (error) {
    console.error('Error fetching featured tools:', error)
    return []
  }
}

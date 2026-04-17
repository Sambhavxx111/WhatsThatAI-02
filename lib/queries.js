import { db } from './db'
import { extractTagNames, getPrimaryCategory } from './tool-tags'

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

function normalizeToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractRecommendationTerms(goal) {
  const stopWords = new Set([
    'a', 'an', 'and', 'the', 'for', 'with', 'that', 'this', 'from', 'into', 'about',
    'want', 'need', 'tool', 'tools', 'help', 'build', 'make', 'create', 'project',
    'workflow', 'task', 'looking', 'find', 'best', 'good', 'better', 'using',
  ])

  return [...new Set(
    normalizeToken(goal)
      .split(' ')
      .filter((term) => term.length >= 3 && !stopWords.has(term))
  )]
}

function scoreToolForRecommendation(tool, { terms, category, pricing, tag }) {
  const haystack = normalizeToken(
    `${tool.name} ${tool.category} ${tool.description} ${Array.isArray(tool.tags) ? tool.tags.join(' ') : ''}`
  )
  let score = 0
  const reasons = []

  if (category && category !== 'all') {
    if (normalizeToken(tool.category) === normalizeToken(category)) {
      score += 6
      reasons.push(`Matches your ${category} workflow`)
    } else if (haystack.includes(normalizeToken(category))) {
      score += 3
      reasons.push(`Connected to ${category}`)
    }
  }

  if (tag && tag !== 'all') {
    if ((tool.tags || []).some((item) => normalizeToken(item) === normalizeToken(tag))) {
      score += 5
      reasons.push(`Tagged for ${tag}`)
    } else if (haystack.includes(normalizeToken(tag))) {
      score += 2
    }
  }

  const toolPricing = String(tool.pricing || '').toLowerCase()
  if (pricing && pricing !== 'all') {
    if (toolPricing === pricing) {
      score += 4
      reasons.push(`Fits your ${pricing} pricing preference`)
    } else if (pricing === 'free' && toolPricing === 'freemium') {
      score += 1
    }
  }

  let matchedTerms = 0
  for (const term of terms) {
    if (haystack.includes(term)) {
      matchedTerms += 1
      score += tool.name.toLowerCase().includes(term) ? 4 : 2
    }
  }

  if (matchedTerms > 0) {
    reasons.push(`Relevant to ${matchedTerms > 1 ? 'multiple parts of' : ''} your goal`.trim())
  }

  if (String(tool.source || '').toLowerCase() === 'whatsthatai-original') {
    score += 2
    reasons.push('Built by WhatsThatAI')
  }

  if (tool.avgRating) {
    score += Number(tool.avgRating) >= 4.5 ? 2 : Number(tool.avgRating) >= 4 ? 1 : 0
  }

  if ((tool.totalReviews || 0) >= 5) {
    score += 1
  }

  return {
    score,
    reasons: reasons.filter(Boolean).slice(0, 2),
  }
}

const toolInclude = {
  tagLinks: {
    include: {
      tag: true,
    },
  },
}

export function mapTool(tool, ratingData = {}) {
  const tagNames = extractTagNames(tool)
  const primaryCategory = getPrimaryCategory(tool.category, tagNames)

  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug || slugify(tool.name),
    description: tool.description || 'No description available yet.',
    category: primaryCategory,
    pricing: formatPricing(tool.pricing),
    websiteUrl: tool.websiteUrl || '',
    logoUrl: tool.logoUrl || '',
    tags: tagNames,
    source: tool.source || 'manual',
    status: tool.status || 'approved',
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
    featured: false,
    rating: ratingData.avgRating ?? null,
    avgRating: ratingData.avgRating ?? null,
    totalReviews: ratingData.totalReviews ?? 0,
    icon: initials(tool.name),
    color: categoryColor(primaryCategory),
  }
}

const publicToolFilter = {
  status: 'approved',
  active: true,
}

function buildPublicToolWhere({ query = '', pricing = '', source = '', tag = '' } = {}) {
  const normalizedQuery = String(query || '').trim()
  const normalizedPricing = String(pricing || '').trim().toLowerCase()
  const normalizedSource = String(source || '').trim().toLowerCase()
  const normalizedTag = String(tag || '').trim()

  const where = {
    ...publicToolFilter,
  }

  if (normalizedPricing) {
    where.pricing = normalizedPricing
  }

  if (normalizedSource) {
    where.source = normalizedSource
  }

  if (normalizedTag) {
    where.tagLinks = {
      some: {
        tag: {
          name: {
            contains: normalizedTag,
          },
        },
      },
    }
  }

  if (normalizedQuery) {
    where.OR = [
      { name: { contains: normalizedQuery } },
      { category: { contains: normalizedQuery } },
      { description: { contains: normalizedQuery } },
      {
        tagLinks: {
          some: {
            tag: {
              name: {
                contains: normalizedQuery,
              },
            },
          },
        },
      },
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

export async function getTools({ query = '', pricing = '', source = '', tag = '' } = {}) {
  try {
    const tools = await db.tool.findMany({
      where: buildPublicToolWhere({ query, pricing, source, tag }),
      include: toolInclude,
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
  tag = '',
  limit = 24,
  offset = 0,
} = {}) {
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 48)
    const safeOffset = Math.max(Number(offset) || 0, 0)
    const where = buildPublicToolWhere({ query, pricing, source, tag })

    const [tools, total] = await Promise.all([
      db.tool.findMany({
        where,
        include: toolInclude,
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
      include: toolInclude,
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

export async function searchTools(query, { pricing = '', source = '', tag = '' } = {}) {
  if ((!query || query.trim() === '') && !tag && !pricing && !source) {
    return getTools()
  }

  try {
    const tools = await db.tool.findMany({
      where: buildPublicToolWhere({ query, pricing, source, tag }),
      include: toolInclude,
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
      include: toolInclude,
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      take: limit,
    })

    return attachRatingsToTools(tools)
  } catch (error) {
    console.error('Error fetching featured tools:', error)
    return []
  }
}

export async function recommendTools({
  goal = '',
  category = 'all',
  pricing = 'all',
  tag = 'all',
  limit = 4,
} = {}) {
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 4, 1), 6)
    const terms = extractRecommendationTerms(goal)
    const candidateWhere = buildPublicToolWhere({
      pricing: pricing !== 'all' ? pricing : '',
      source: '',
      tag: tag !== 'all' ? tag : '',
    })

    if (category && category !== 'all' && category !== 'ai tools') {
      candidateWhere.OR = [
        ...(candidateWhere.OR || []),
        { category: { contains: category } },
        { description: { contains: category } },
        {
          tagLinks: {
            some: {
              tag: {
                name: { contains: category },
              },
            },
          },
        },
      ]
    }

    const tools = await db.tool.findMany({
      where: candidateWhere,
      include: toolInclude,
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      take: 150,
    })

    const fallbackCandidates =
      tools.length > 0
        ? tools
        : await db.tool.findMany({
            where: {
              status: 'approved',
              active: true,
            },
            include: toolInclude,
            orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
            take: 150,
          })

    const mappedTools = await attachRatingsToTools(fallbackCandidates)
    const scoredTools = mappedTools
      .map((tool) => {
        const evaluation = scoreToolForRecommendation(tool, { terms, category, pricing, tag })

        return {
          ...tool,
          recommendationScore: evaluation.score,
          recommendationReasons: evaluation.reasons,
        }
      })
      .filter((tool) => tool.recommendationScore > 0)
      .sort((left, right) => {
        if (right.recommendationScore !== left.recommendationScore) {
          return right.recommendationScore - left.recommendationScore
        }

        if ((right.avgRating || 0) !== (left.avgRating || 0)) {
          return (right.avgRating || 0) - (left.avgRating || 0)
        }

        return (right.totalReviews || 0) - (left.totalReviews || 0)
      })

    if (scoredTools.length > 0) {
      return scoredTools.slice(0, safeLimit)
    }

    return mappedTools.slice(0, safeLimit).map((tool) => ({
      ...tool,
      recommendationScore: 0,
      recommendationReasons: ['Worth exploring based on your current filters'],
    }))
  } catch (error) {
    console.error('Error recommending tools:', error)
    return []
  }
}

export async function getTopTags(limit = 24) {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: {
            toolLinks: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    })

    return tags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count.toolLinks,
      }))
      .filter((tag) => tag.count > 0)
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, Math.max(Number(limit) || 24, 1))
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

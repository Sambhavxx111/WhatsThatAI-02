import { db } from '@/lib/db'
import { attachRatingsToTools, mapTool } from '@/lib/queries'
import { CATEGORY_TERMS, ONBOARDING_CATEGORIES } from '@/lib/onboarding-catalog'
export { ONBOARDING_CATEGORIES } from '@/lib/onboarding-catalog'

export function sanitizeCategorySelection(input) {
  const allowed = new Set(ONBOARDING_CATEGORIES.map((item) => item.id))
  return Array.from(
    new Set(
      (Array.isArray(input) ? input : [])
        .map((value) => String(value || '').trim().toLowerCase())
        .filter((value) => allowed.has(value))
    )
  ).slice(0, 5)
}

export function formatCollectionPayload(collection) {
  const items = (collection.items || [])
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      id: item.tool.id,
      sortOrder: item.sortOrder,
      note: item.note || '',
      tool: mapTool(item.tool),
    }))

  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description || '',
    summary: collection.summary || '',
    type: collection.type,
    active: Boolean(collection.active),
    categories: Array.isArray(collection.categories) ? collection.categories : [],
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    itemCount: items.length,
    items,
  }
}

function hasUsableWebsiteUrl(tool) {
  const rawUrl = String(tool?.websiteUrl || '').trim()

  if (!rawUrl) {
    return false
  }

  try {
    const parsed = new URL(rawUrl)
    const hostname = parsed.hostname.toLowerCase()

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    if (
      !hostname ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.includes('example.')
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function normalizeForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreOnboardingTool(tool, normalizedCategories) {
  const haystack = normalizeForMatch(
    `${tool.name} ${tool.category} ${tool.description} ${
      Array.isArray(tool.tags) ? tool.tags.join(' ') : ''
    }`
  )
  const terms = Array.from(
    new Set(normalizedCategories.flatMap((category) => CATEGORY_TERMS[category] || [category]))
  )

  let score = 0

  for (const term of terms) {
    if (!term) continue

    if (normalizeForMatch(tool.category).includes(term)) {
      score += 7
    }

    if (normalizeForMatch(tool.name).includes(term)) {
      score += 5
    }

    if (haystack.includes(term)) {
      score += 2
    }
  }

  const source = String(tool.source || '').toLowerCase()
  if (source === 'whatsthatai-original') score += 4
  else if (source === 'manual') score += 3
  else if (source === 'scraped') score += 1

  if (tool.avgRating) {
    score += Math.min(Number(tool.avgRating) || 0, 5)
  }

  if ((tool.totalReviews || 0) > 0) {
    score += Math.min(Number(tool.totalReviews) || 0, 10) * 0.25
  }

  if (String(tool.name || '').trim().length > 32) {
    score -= 1
  }

  return score
}

export async function getUserOnboardingPreference(userId) {
  if (!userId) return null

  return db.userOnboardingPreference.findUnique({
    where: {
      userId,
    },
  })
}

export async function saveUserOnboardingPreference(userId, categories) {
  const normalizedCategories = sanitizeCategorySelection(categories)

  return db.userOnboardingPreference.upsert({
    where: {
      userId,
    },
    update: {
      categories: normalizedCategories,
      completedAt: new Date(),
    },
    create: {
      userId,
      categories: normalizedCategories,
      completedAt: new Date(),
    },
  })
}

export async function getMatchingToolsForCategories(categories, limit = 8) {
  const normalizedCategories = sanitizeCategorySelection(categories)
  if (!normalizedCategories.length) {
    return []
  }

  const searchTerms = Array.from(
    new Set(
      normalizedCategories.flatMap((category) => CATEGORY_TERMS[category] || [category])
    )
  )

  const tools = await db.tool.findMany({
    where: {
      status: 'approved',
      active: true,
      OR: searchTerms.flatMap((term) => [
        { category: { contains: term } },
        { name: { contains: term } },
        { description: { contains: term } },
        {
          tagLinks: {
            some: {
              tag: {
                name: { contains: term },
              },
            },
          },
        },
      ]),
    },
    include: {
      tagLinks: {
        include: {
          tag: true,
        },
      },
    },
    take: Math.max(limit * 2, 12),
    orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
  })

  const deduped = []
  const seen = new Set()
  for (const tool of tools) {
    if (seen.has(tool.id)) continue
    seen.add(tool.id)
    deduped.push(tool)
    if (deduped.length >= Math.max(limit * 3, 18)) {
      break
    }
  }

  const mappedTools = await attachRatingsToTools(deduped)

  return mappedTools
    .filter((tool) => hasUsableWebsiteUrl(tool))
    .map((tool) => ({
      ...tool,
      onboardingScore: scoreOnboardingTool(tool, normalizedCategories),
    }))
    .filter((tool) => tool.onboardingScore > 0)
    .sort((left, right) => {
      if (right.onboardingScore !== left.onboardingScore) {
        return right.onboardingScore - left.onboardingScore
      }

      if ((right.avgRating || 0) !== (left.avgRating || 0)) {
        return (right.avgRating || 0) - (left.avgRating || 0)
      }

      return (right.totalReviews || 0) - (left.totalReviews || 0)
    })
    .slice(0, limit)
}

export async function getPublicCuratedCollectionBySlug(slug) {
  const normalizedSlug = String(slug || '').trim().toLowerCase()

  if (!normalizedSlug) {
    return null
  }

  const collection = await db.curatedCollection.findFirst({
    where: {
      slug: normalizedSlug,
      active: true,
    },
    include: {
      items: {
        include: {
          tool: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })

  if (!collection) {
    return null
  }

  return formatCollectionPayload(collection)
}

export async function getCuratedCollectionsForCategories(categories, { type, limit = 4 } = {}) {
  const normalizedCategories = sanitizeCategorySelection(categories)

  const collections = await db.curatedCollection.findMany({
    where: {
      active: true,
      ...(type ? { type } : {}),
    },
    include: {
      items: {
        include: {
          tool: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  })

  const filteredCollections = collections.filter((collection) => {
    if (!normalizedCategories.length) {
      return true
    }

    const collectionCategories = Array.isArray(collection.categories) ? collection.categories : []
    return collectionCategories.some((category) => normalizedCategories.includes(String(category)))
  })

  return filteredCollections.slice(0, limit).map(formatCollectionPayload)
}

export async function getAllCuratedCollectionsForAdmin() {
  const collections = await db.curatedCollection.findMany({
    include: {
      items: {
        include: {
          tool: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  })

  return collections.map(formatCollectionPayload)
}


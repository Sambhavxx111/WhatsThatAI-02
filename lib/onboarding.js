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
      ]),
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
    if (deduped.length >= limit) {
      break
    }
  }

  return attachRatingsToTools(deduped)
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


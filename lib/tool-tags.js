import { db } from '@/lib/db'
import { sanitizeText } from '@/lib/validation'

const MAX_TAGS_PER_TOOL = 8

function normalizeTagName(value) {
  return sanitizeText(String(value || ''))
    .replace(/^[#,\-–•]+/, '')
    .trim()
}

export function sanitizeTagsInput(input, fallbackCategory = '') {
  const values = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : []

  const unique = new Map()

  for (const rawValue of values) {
    const value = normalizeTagName(rawValue)
    const normalized = value.toLowerCase()

    if (!value || value.length < 2 || value.length > 40 || unique.has(normalized)) {
      continue
    }

    unique.set(normalized, value)

    if (unique.size >= MAX_TAGS_PER_TOOL) {
      break
    }
  }

  const category = normalizeTagName(fallbackCategory)
  if (category) {
    const normalizedCategory = category.toLowerCase()
    if (!unique.has(normalizedCategory)) {
      unique.set(normalizedCategory, category)
    }
  }

  return [...unique.values()].slice(0, MAX_TAGS_PER_TOOL)
}

export function getPrimaryCategory(category, tagNames) {
  const normalizedCategory = normalizeTagName(category)

  if (normalizedCategory) {
    return normalizedCategory
  }

  return tagNames[0] || 'AI Tools'
}

export function extractTagNames(tool) {
  if (Array.isArray(tool?.tagLinks)) {
    return sanitizeTagsInput(
      tool.tagLinks.map((link) => link?.tag?.name).filter(Boolean),
      tool?.category || ''
    )
  }

  if (Array.isArray(tool?.tags)) {
    return sanitizeTagsInput(tool.tags, tool?.category || '')
  }

  return sanitizeTagsInput([], tool?.category || '')
}

export async function upsertTags(transaction, tagNames) {
  const sanitizedTags = sanitizeTagsInput(tagNames)

  if (!sanitizedTags.length) {
    return []
  }

  for (const tagName of sanitizedTags) {
    await transaction.tag.upsert({
      where: {
        name: tagName,
      },
      update: {},
      create: {
        name: tagName,
      },
    })
  }

  return transaction.tag.findMany({
    where: {
      name: {
        in: sanitizedTags,
      },
    },
  })
}

export async function syncToolTags(transaction, toolId, rawTags, fallbackCategory = '') {
  const tagNames = sanitizeTagsInput(rawTags, fallbackCategory)

  await transaction.toolTag.deleteMany({
    where: {
      toolId,
    },
  })

  if (!tagNames.length) {
    await transaction.tool.update({
      where: { id: toolId },
      data: {
        tags: [],
      },
    })

    return []
  }

  const tags = await upsertTags(transaction, tagNames)

  if (tags.length) {
    await transaction.toolTag.createMany({
      data: tags.map((tag) => ({
        toolId,
        tagId: tag.id,
      })),
      skipDuplicates: true,
    })
  }

  await transaction.tool.update({
    where: { id: toolId },
    data: {
      tags: tagNames,
    },
  })

  return tagNames
}

export async function getTagOptions(limit = 24) {
  const tags = await db.tag.findMany({
    include: {
      _count: {
        select: {
          toolLinks: true,
        },
      },
    },
  })

  return tags
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.toolLinks,
    }))
    .filter((tag) => tag.count > 0)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, limit)
}

async function getDB() {
  const { db } = await import('../lib/db.js')
  return db
}

function normalizeTagName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100)
}

function extractLegacyTags(rawTags) {
  if (!rawTags) {
    return []
  }

  if (Array.isArray(rawTags)) {
    return rawTags.map(normalizeTagName).filter(Boolean)
  }

  if (typeof rawTags === 'string') {
    return rawTags
      .split(',')
      .map(normalizeTagName)
      .filter(Boolean)
  }

  if (typeof rawTags === 'object') {
    try {
      const values = Object.values(rawTags)

      if (!values.length) {
        return []
      }

      return values.map(normalizeTagName).filter(Boolean)
    } catch {
      return []
    }
  }

  return []
}

function buildToolTags(tool) {
  const tags = new Set()

  const category = normalizeTagName(tool.category)
  if (category) {
    tags.add(category)
  }

  for (const tag of extractLegacyTags(tool.tags)) {
    if (tag) {
      tags.add(tag)
    }
  }

  return Array.from(tags).slice(0, 8)
}

async function ensureTables(db) {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    )
  `)

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS tool_tags (
      tool_id INT NOT NULL,
      tag_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tool_id, tag_id),
      INDEX tool_tags_tag_id_idx (tag_id),
      CONSTRAINT fk_tool_tags_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
      CONSTRAINT fk_tool_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `)
}

async function main() {
  const db = await getDB()

  await ensureTables(db)

  const tools = await db.tool.findMany({
    select: {
      id: true,
      category: true,
      tags: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  let toolCount = 0
  let mappingCount = 0
  const uniqueTagNames = new Set()

  for (const tool of tools) {
    const tagNames = buildToolTags(tool)

    if (!tagNames.length) {
      continue
    }

    toolCount += 1

    await db.$transaction(async (transaction) => {
      const tagRecords = []

      for (const tagName of tagNames) {
        uniqueTagNames.add(tagName)

        const tagRecord = await transaction.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
          select: { id: true, name: true },
        })

        tagRecords.push(tagRecord)
      }

      for (const tagRecord of tagRecords) {
        await transaction.toolTag.upsert({
          where: {
            toolId_tagId: {
              toolId: tool.id,
              tagId: tagRecord.id,
            },
          },
          update: {},
          create: {
            toolId: tool.id,
            tagId: tagRecord.id,
          },
        })
      }

      await transaction.tool.update({
        where: { id: tool.id },
        data: {
          tags: tagNames,
        },
      })
    })

    mappingCount += tagNames.length
  }

  const totals = await db.$transaction([
    db.tag.count(),
    db.toolTag.count(),
  ])

  console.log(`Tools migrated: ${toolCount}`)
  console.log(`Unique tags discovered this run: ${uniqueTagNames.size}`)
  console.log(`Mappings processed this run: ${mappingCount}`)
  console.log(`Total tags in database: ${totals[0]}`)
  console.log(`Total tool-tag mappings in database: ${totals[1]}`)
}

main()
  .catch((error) => {
    console.error('Tool tag migration failed:', error?.message || error)
    process.exit(1)
  })
  .finally(async () => {
    const db = await getDB()
    await db.$disconnect()
  })

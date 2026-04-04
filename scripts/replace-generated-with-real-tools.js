async function getDB() {
  const { db } = await import('../lib/db.js')
  return db
}

async function getToolIngestion() {
  return import('../lib/tool-ingestion.js')
}

const DATASET_URL =
  'https://raw.githubusercontent.com/lakey009/AI-Tools-List/main/AIToolsList-Sample.json'

const CATEGORY_KEYWORDS = [
  { category: 'Video', keywords: ['video', 'reel', 'avatar', 'editing', 'subtitle'] },
  { category: 'Image', keywords: ['image', 'photo', 'art', 'design', 'illustration', '3d'] },
  { category: 'Audio', keywords: ['audio', 'voice', 'speech', 'music', 'podcast', 'dubbing'] },
  { category: 'Coding', keywords: ['code', 'developer', 'coding', 'debug', 'programming'] },
  { category: 'Research', keywords: ['research', 'search', 'papers', 'evidence', 'analysis'] },
  { category: 'Marketing', keywords: ['marketing', 'ads', 'campaign', 'seo', 'affiliate', 'social media'] },
  { category: 'Automation', keywords: ['automation', 'workflow', 'agents', 'agent', 'scrape', 'integration'] },
  { category: 'Productivity', keywords: ['productivity', 'meeting', 'notes', 'organize', 'workspace'] },
  { category: 'Writing', keywords: ['writing', 'copy', 'content', 'blog', 'essay', 'rewrite'] },
]

function chunk(items, size) {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function titleCaseFromHandle(handle) {
  return String(handle || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function inferCategory(description) {
  const normalized = String(description || '').toLowerCase()

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.category
    }
  }

  return 'AI Tools'
}

function inferPricing(description) {
  const normalized = String(description || '').toLowerCase()

  if (normalized.includes('free')) return 'free'
  if (normalized.includes('enterprise')) return 'paid'
  return 'freemium'
}

async function fetchDataset() {
  const response = await fetch(DATASET_URL, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Could not fetch real tools dataset')
  }

  const payload = await response.json()
  const items = Array.isArray(payload) ? payload : payload?.value

  if (!Array.isArray(items)) {
    throw new Error('Unexpected dataset format')
  }

  return items
}

async function main() {
  const db = await getDB()
  const { normalizeName, slugify } = await getToolIngestion()

  const dataset = await fetchDataset()

  await db.tool.deleteMany({
    where: {
      source: 'generated-test',
    },
  })

  const existingTools = await db.tool.findMany({
    select: {
      name: true,
      slug: true,
      websiteUrl: true,
    },
  })

  const existingNames = new Set(
    existingTools.map((tool) => normalizeName(tool.name)).filter(Boolean)
  )
  const existingSlugs = new Set(
    existingTools.map((tool) => String(tool.slug || '').trim()).filter(Boolean)
  )
  const existingUrls = new Set(
    existingTools
      .map((tool) => String(tool.websiteUrl || '').trim().toLowerCase())
      .filter(Boolean)
  )

  const preparedTools = []

  for (const item of dataset) {
    const name = titleCaseFromHandle(item.handle)
    const slug = slugify(name)
    const description = String(item.description || '').trim()
    const websiteUrl = String(item.website || '').trim()
    const normalizedName = normalizeName(name)

    if (!name || !slug || !description || !websiteUrl) {
      continue
    }

    if (
      existingNames.has(normalizedName) ||
      existingSlugs.has(slug) ||
      existingUrls.has(websiteUrl.toLowerCase())
    ) {
      continue
    }

    existingNames.add(normalizedName)
    existingSlugs.add(slug)
    existingUrls.add(websiteUrl.toLowerCase())

    preparedTools.push({
      name,
      slug,
      description,
      category: inferCategory(description),
      pricing: inferPricing(description),
      websiteUrl,
      source: 'real-directory',
      status: 'approved',
      active: true,
    })
  }

  for (const batch of chunk(preparedTools, 200)) {
    await db.tool.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }

  const totalApprovedActive = await db.tool.count({
    where: {
      status: 'approved',
      active: true,
    },
  })

  console.log(
    `Imported ${preparedTools.length} real tools after removing generated test rows. Approved active total is now ${totalApprovedActive}.`
  )
}

main()
  .catch((error) => {
    console.error('Failed to replace generated tools with real tools:', error)
    process.exit(1)
  })
  .finally(async () => {
    const db = await getDB()
    await db.$disconnect()
  })

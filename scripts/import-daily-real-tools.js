const fs = require('node:fs/promises')
const path = require('node:path')

async function getDB() {
  const { db } = await import('../lib/db.js')
  return db
}

async function getToolIngestion() {
  return import('../lib/tool-ingestion.js')
}

const DATASET_URL =
  'https://raw.githubusercontent.com/lakey009/AI-Tools-List/main/AIToolsList.json'
const STATE_DIR = path.join(process.cwd(), 'data')
const STATE_FILE = path.join(STATE_DIR, 'daily-import-state.json')
const CACHE_FILE = path.join(STATE_DIR, 'daily-import-catalog.json')
const DAILY_BATCH_SIZE = 200

const CATEGORY_KEYWORDS = [
  { category: 'Video', keywords: ['video', 'reel', 'avatar', 'editing', 'subtitle', 'film'] },
  { category: 'Image', keywords: ['image', 'photo', 'art', 'design', 'illustration', '3d'] },
  { category: 'Audio', keywords: ['audio', 'voice', 'speech', 'music', 'podcast', 'dubbing'] },
  { category: 'Coding', keywords: ['code', 'developer', 'coding', 'debug', 'programming'] },
  { category: 'Research', keywords: ['research', 'search', 'papers', 'evidence', 'analysis'] },
  { category: 'Marketing', keywords: ['marketing', 'ads', 'campaign', 'seo', 'affiliate', 'social media'] },
  { category: 'Automation', keywords: ['automation', 'workflow', 'agent', 'agents', 'scrape', 'integration'] },
  { category: 'Productivity', keywords: ['productivity', 'meeting', 'notes', 'organize', 'workspace'] },
  { category: 'Writing', keywords: ['writing', 'copy', 'content', 'blog', 'essay', 'rewrite'] },
]

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
  if (normalized.includes('paid')) return 'paid'
  return 'freemium'
}

async function readState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8')
    const parsed = JSON.parse(raw)

    return {
      processedHandles: Array.isArray(parsed.processedHandles) ? parsed.processedHandles : [],
      lastRunAt: parsed.lastRunAt || null,
    }
  } catch {
    return {
      processedHandles: [],
      lastRunAt: null,
    }
  }
}

async function writeState(state) {
  await fs.mkdir(STATE_DIR, { recursive: true })
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2))
}

async function fetchDataset() {
  try {
    const response = await fetch(DATASET_URL, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Could not fetch full real tools dataset')
    }

    const payload = await response.json()
    const items = Array.isArray(payload) ? payload : payload?.value

    if (!Array.isArray(items)) {
      throw new Error('Unexpected full dataset format')
    }

    await fs.mkdir(STATE_DIR, { recursive: true })
    await fs.writeFile(CACHE_FILE, JSON.stringify(items, null, 2))

    return items
  } catch (error) {
    try {
      const cached = await fs.readFile(CACHE_FILE, 'utf8')
      const items = JSON.parse(cached)

      if (Array.isArray(items)) {
        return items
      }
    } catch {}

    throw error
  }
}

async function main() {
  const db = await getDB()
  const {
    evaluateToolForInsertion,
    findExistingTool,
    normalizeName,
    slugify,
  } = await getToolIngestion()

  const state = await readState()
  const processedHandles = new Set(state.processedHandles)
  const dataset = await fetchDataset()

  let scanned = 0
  let inserted = 0
  let autoApproved = 0
  let pendingReview = 0
  let skipped = 0

  for (const item of dataset) {
    if (inserted >= DAILY_BATCH_SIZE) {
      break
    }

    const handle = String(item?.handle || '').trim().toLowerCase()

    if (!handle || processedHandles.has(handle)) {
      continue
    }

    processedHandles.add(handle)
    scanned += 1

    const name = titleCaseFromHandle(item.handle)
    const slug = slugify(name)
    const description = String(item.description || '').trim()
    const websiteUrl = String(item.website || '').trim()
    const category = inferCategory(description)
    const pricing = inferPricing(description)
    const normalizedName = normalizeName(name)

    if (!name || !slug || !description || !websiteUrl) {
      skipped += 1
      continue
    }

    const existingTools = await findExistingTool(db, {
      normalizedName,
      slug,
      websiteUrl,
    })

    if (existingTools.length > 0) {
      skipped += 1
      continue
    }

    const evaluation = await evaluateToolForInsertion({
      name,
      description,
      category,
      pricing,
      websiteUrl,
    }, {
      inspectWebsite: false,
      trustedSource: true,
    })

    await db.tool.create({
      data: {
        name,
        slug,
        description: evaluation.description,
        category,
        pricing,
        websiteUrl,
        source: 'daily-real-import',
        status: evaluation.status,
        active: evaluation.active,
      },
    })

    inserted += 1

    if (evaluation.status === 'approved') {
      autoApproved += 1
    } else {
      pendingReview += 1
    }
  }

  await writeState({
    processedHandles: [...processedHandles],
    lastRunAt: new Date().toISOString(),
  })

  console.log(
    JSON.stringify(
      {
        scanned,
        inserted,
        autoApproved,
        pendingReview,
        skipped,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error('Daily real import failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    const db = await getDB()
    await db.$disconnect()
  })

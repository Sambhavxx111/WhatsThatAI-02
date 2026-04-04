async function getDB() {
  const { db } = await import('../lib/db.js')
  return db
}

const TARGET_APPROVED_ACTIVE_COUNT = 1000

const prefixes = [
  'Vision',
  'Prompt',
  'Flow',
  'Spark',
  'Nova',
  'Atlas',
  'Echo',
  'Pixel',
  'Lumen',
  'Orbit',
  'Signal',
  'Craft',
  'Logic',
  'Nexus',
  'Cortex',
  'Prism',
  'Astra',
  'Vector',
  'Fusion',
  'Launch',
  'Studio',
  'Bright',
  'Focus',
  'Scout',
  'Layer',
]

const cores = [
  'Writer',
  'Canvas',
  'Video',
  'Voice',
  'Research',
  'Search',
  'Builder',
  'Editor',
  'Pilot',
  'Agent',
  'Forge',
  'Copilot',
  'Genius',
  'Lab',
  'Engine',
  'Assist',
  'Works',
  'Stack',
  'Cloud',
  'Grid',
]

const suffixes = [
  'AI',
  'Pro',
  'Cloud',
  'Studio',
  'Flow',
  'Suite',
  'Works',
  'OS',
  'Hub',
  'One',
]

const categories = [
  'Writing',
  'Image',
  'Video',
  'Audio',
  'Coding',
  'Research',
  'Productivity',
  'Design',
  'Marketing',
  'Automation',
]

const pricingOptions = ['free', 'freemium', 'paid']

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildDescription(name, category, index) {
  const categoryCopy = {
    Writing: 'writing, summarization, rewriting, and content ideation',
    Image: 'image generation, editing, and creative asset production',
    Video: 'video generation, editing, captioning, and repurposing',
    Audio: 'voice synthesis, transcription, and audio cleanup',
    Coding: 'code generation, debugging, and developer workflow support',
    Research: 'research synthesis, search, and evidence gathering',
    Productivity: 'work planning, note organization, and daily execution',
    Design: 'UI exploration, mockups, and creative system building',
    Marketing: 'campaign creation, copywriting, and growth workflows',
    Automation: 'workflow automation, integrations, and repetitive task handling',
  }

  return `${name} is a ${category.toLowerCase()} tool focused on ${categoryCopy[category]}. It is included as structured test catalog data entry ${index + 1} to help exercise large-scale search, filtering, matching, and discovery flows in the app.`
}

function buildWebsiteUrl(slug, index) {
  return `https://${slug}-${index + 1}.example.com`
}

function buildTool(index) {
  const prefix = prefixes[index % prefixes.length]
  const core = cores[Math.floor(index / prefixes.length) % cores.length]
  const suffix = suffixes[Math.floor(index / (prefixes.length * cores.length)) % suffixes.length]
  const category = categories[index % categories.length]
  const pricing = pricingOptions[index % pricingOptions.length]
  const name = `${prefix} ${core} ${suffix}`
  const slug = slugify(name)

  return {
    name,
    slug,
    description: buildDescription(name, category, index),
    category,
    pricing,
    websiteUrl: buildWebsiteUrl(slug, index),
    source: 'generated-test',
    status: 'approved',
    active: true,
  }
}

async function main() {
  const db = await getDB()

  const currentApprovedActiveCount = await db.tool.count({
    where: {
      status: 'approved',
      active: true,
    },
  })

  if (currentApprovedActiveCount >= TARGET_APPROVED_ACTIVE_COUNT) {
    console.log(`Approved active tools already at ${currentApprovedActiveCount}. Nothing to add.`)
    return
  }

  const existingTools = await db.tool.findMany({
    select: {
      slug: true,
      websiteUrl: true,
    },
  })

  const existingSlugs = new Set(
    existingTools
      .map((tool) => String(tool.slug || '').trim())
      .filter(Boolean)
  )

  const existingUrls = new Set(
    existingTools
      .map((tool) => String(tool.websiteUrl || '').trim().toLowerCase())
      .filter(Boolean)
  )

  const needed = TARGET_APPROVED_ACTIVE_COUNT - currentApprovedActiveCount
  const generatedTools = []
  let index = 0

  while (generatedTools.length < needed) {
    const tool = buildTool(index)
    index += 1

    if (existingSlugs.has(tool.slug) || existingUrls.has(tool.websiteUrl.toLowerCase())) {
      continue
    }

    existingSlugs.add(tool.slug)
    existingUrls.add(tool.websiteUrl.toLowerCase())
    generatedTools.push(tool)
  }

  await db.tool.createMany({
    data: generatedTools,
    skipDuplicates: true,
  })

  const finalApprovedActiveCount = await db.tool.count({
    where: {
      status: 'approved',
      active: true,
    },
  })

  console.log(
    `Generated ${generatedTools.length} test tools. Approved active total is now ${finalApprovedActiveCount}.`
  )
}

main()
  .catch((error) => {
    console.error('Failed to fill test tools:', error)
    process.exit(1)
  })
  .finally(async () => {
    const db = await getDB()
    await db.$disconnect()
  })

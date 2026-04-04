const axios = require('axios')

async function getDB() {
  const { db } = await import('../lib/db.js')
  return db
}

const REQUEST_TIMEOUT_MS = 8000
const CONCURRENCY = 10

async function checkTool(tool, db) {
  const url = String(tool.websiteUrl || '').trim()

  if (!url) {
    await db.tool.update({
      where: { id: tool.id },
      data: { active: false },
    })
    return { id: tool.id, active: false }
  }

  try {
    await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    })

    await db.tool.update({
      where: { id: tool.id },
      data: { active: true },
    })

    return { id: tool.id, active: true }
  } catch {
    await db.tool.update({
      where: { id: tool.id },
      data: { active: false },
    })

    return { id: tool.id, active: false }
  }
}

async function main() {
  const db = await getDB()
  const tools = await db.tool.findMany({
    select: {
      id: true,
      websiteUrl: true,
    },
    orderBy: { id: 'asc' },
  })

  let activeCount = 0
  let inactiveCount = 0

  for (let index = 0; index < tools.length; index += CONCURRENCY) {
    const batch = tools.slice(index, index + CONCURRENCY)
    const results = await Promise.all(batch.map((tool) => checkTool(tool, db)))

    for (const result of results) {
      if (result.active) {
        activeCount += 1
      } else {
        inactiveCount += 1
      }
    }
  }

  console.log(`Link check complete. Active: ${activeCount}, Inactive: ${inactiveCount}`)
}

main()
  .catch((error) => {
    console.error('Link check failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    const db = await getDB()
    await db.$disconnect()
  })

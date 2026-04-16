const axios = require('axios')

async function getDB() {
  const { db } = await import('../lib/db.js')
  return db
}

const REQUEST_TIMEOUT_MS = 5000
const CONCURRENCY = 10
const MAX_REDIRECTS = 5
const DRY_RUN = process.argv.includes('--dry-run')

function shouldFallbackToGet(status, error) {
  if (status === 403 || status === 405 || status === 429) {
    return true
  }

  if (!error) {
    return false
  }

  return [
    'ECONNRESET',
    'ECONNABORTED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EPROTO',
  ].includes(error.code)
}

async function requestUrl(method, url) {
  return axios({
    method,
    url,
    timeout: REQUEST_TIMEOUT_MS,
    maxRedirects: MAX_REDIRECTS,
    validateStatus: () => true,
    transitional: {
      clarifyTimeoutError: true,
    },
  })
}

async function isBrokenUrl(url) {
  try {
    const headResponse = await requestUrl('HEAD', url)

    if (headResponse.status >= 200 && headResponse.status < 400) {
      return {
        broken: false,
        reason: `HEAD ${headResponse.status}`,
      }
    }

    if (!shouldFallbackToGet(headResponse.status)) {
      return {
        broken: true,
        reason: `HEAD ${headResponse.status}`,
      }
    }
  } catch (error) {
    if (!shouldFallbackToGet(undefined, error)) {
      return {
        broken: true,
        reason: error.code || error.message || 'HEAD request failed',
      }
    }
  }

  try {
    const getResponse = await requestUrl('GET', url)

    if (getResponse.status >= 200 && getResponse.status < 400) {
      return {
        broken: false,
        reason: `GET ${getResponse.status}`,
      }
    }

    return {
      broken: true,
      reason: `GET ${getResponse.status}`,
    }
  } catch (error) {
    return {
      broken: true,
      reason: error.code || error.message || 'GET request failed',
    }
  }
}

async function fetchTools(db) {
  return db.$queryRaw`
    SELECT id, website_url
    FROM tools
    ORDER BY id ASC
  `
}

async function markToolInactive(db, id) {
  return db.tool.update({
    where: { id: Number(id) },
    data: { active: false },
  })
}

async function processTool(tool, db) {
  const id = Number(tool.id)
  const websiteUrl = String(tool.website_url || '').trim()

  if (!websiteUrl) {
    if (!DRY_RUN) {
      await markToolInactive(db, id)
    }

    return {
      id,
      websiteUrl,
      broken: true,
      deactivated: !DRY_RUN,
      reason: 'Missing website URL',
    }
  }

  const result = await isBrokenUrl(websiteUrl)

  if (!result.broken) {
    return {
      id,
      websiteUrl,
      broken: false,
      deactivated: false,
      reason: result.reason,
    }
  }

  if (!DRY_RUN) {
    await markToolInactive(db, id)
  }

  return {
    id,
    websiteUrl,
    broken: true,
    deactivated: !DRY_RUN,
    reason: result.reason,
  }
}

async function main() {
  const db = await getDB()
  const tools = await fetchTools(db)

  let totalChecked = 0
  let brokenCount = 0
  let deactivatedCount = 0
  let workingCount = 0

  for (let index = 0; index < tools.length; index += CONCURRENCY) {
    const batch = tools.slice(index, index + CONCURRENCY)

    const results = await Promise.all(
      batch.map(async (tool) => {
        try {
          return await processTool(tool, db)
        } catch (error) {
          return {
            id: Number(tool.id),
            websiteUrl: String(tool.website_url || '').trim(),
            broken: true,
            deactivated: false,
            reason: error?.message || 'Unexpected error',
            failed: true,
          }
        }
      })
    )

    for (const result of results) {
      totalChecked += 1

      if (result.broken) {
        brokenCount += 1

        if (result.deactivated) {
          deactivatedCount += 1
        }

        console.log(
          `[BROKEN] #${result.id} ${result.websiteUrl || '(missing url)'} :: ${result.reason}${
            DRY_RUN ? ' [dry-run]' : ''
          }`
        )
      } else {
        workingCount += 1
      }
    }
  }

  console.log(`Total checked: ${totalChecked}`)
  console.log(`Broken: ${brokenCount}`)
  console.log(`Deactivated: ${deactivatedCount}`)
  console.log(`Deleted: 0, Working: ${workingCount}`)
}

main()
  .catch((error) => {
    console.error('Broken tools cleanup failed:', error?.message || error)
    process.exit(1)
  })
  .finally(async () => {
    const db = await getDB()
    await db.$disconnect()
  })

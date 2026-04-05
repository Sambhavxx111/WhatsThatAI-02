import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import { createWorker } from 'tesseract.js'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  assertPublicHttpUrl,
  assertRemoteVideoResponse,
  assertVideoUpload,
  getClientIp,
} from '@/lib/security'
import { validateSafeInstagramUrl } from '@/lib/url-validation'
import { formatZodError, instagramUrlSchema } from '@/lib/validation'

const require = createRequire(import.meta.url)
const importedFfmpegPath = require('ffmpeg-static')
const execFileAsync = promisify(execFile)
const TEMP_DIR = path.join(os.tmpdir(), 'whatsthatai')
const TESSDATA_DIR = path.join(TEMP_DIR, 'tessdata')
const ROOT_TESSDATA_FILE = path.join(process.cwd(), 'eng.traineddata')
const TESSDATA_FILE = path.join(TESSDATA_DIR, 'eng.traineddata')
const MAX_OCR_TIME_MS = 30000
const MAX_TOTAL_PROCESSING_MS = 45000

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getDB() {
  return db
}

function cleanDetectedText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function tokenizeText(value) {
  return String(value || '')
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
}

function buildSearchPatterns(cleanedText) {
  const tokens = tokenizeText(cleanedText)
  const patterns = new Set(tokens)

  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index + 1]) {
      patterns.add(`${tokens[index]} ${tokens[index + 1]}`)
    }

    if (tokens[index + 2]) {
      patterns.add(`${tokens[index]} ${tokens[index + 1]} ${tokens[index + 2]}`)
    }
  }

  return [...patterns]
}

function scoreToolMatch(tool, detectedText, patterns, tokenSet) {
  const normalizedToolName = normalizeName(tool.name)
  const normalizedSlug = normalizeName(tool.slug || '')
  const toolNameTokens = tokenizeText(String(tool.name || '').toLowerCase())
  const toolTagTokens = Array.isArray(tool.tags)
    ? tool.tags.flatMap((tag) => tokenizeText(String(tag || '').toLowerCase()))
    : []

  let score = 0

  if (!normalizedToolName) {
    return 0
  }

  if (detectedText.includes(normalizedToolName)) {
    score += 12
  }

  if (normalizedSlug && detectedText.includes(normalizedSlug)) {
    score += 8
  }

  if (toolNameTokens.length > 0 && toolNameTokens.every((token) => tokenSet.has(token))) {
    score += 8
  }

  for (const token of toolNameTokens) {
    if (tokenSet.has(token)) {
      score += token.length >= 6 ? 4 : 2
    }
  }

  for (const pattern of patterns) {
    const normalizedPattern = normalizeName(pattern)

    if (normalizedPattern && normalizedPattern === normalizedToolName) {
      score += 10
    } else if (normalizedPattern && normalizedPattern === normalizedSlug) {
      score += 7
    }
  }

  for (const token of toolTagTokens) {
    if (tokenSet.has(token)) {
      score += token.length >= 6 ? 3 : 1
    }
  }

  return score
}

function extractInstagramVideoUrl(payload) {
  if (!payload) {
    return ''
  }

  if (typeof payload === 'string' && /^https?:\/\//i.test(payload)) {
    return payload
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedUrl = extractInstagramVideoUrl(item)

      if (nestedUrl) {
        return nestedUrl
      }
    }

    return ''
  }

  if (typeof payload !== 'object') {
    return ''
  }

  const directCandidates = [
    payload.url,
    payload.video,
    payload.videoUrl,
    payload.video_url,
    payload.download_url,
    payload.downloadUrl,
  ]

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
      return candidate
    }
  }

  if (Array.isArray(payload.links) && payload.links.length > 0) {
    const firstLink = payload.links[0]

    if (typeof firstLink === 'string' && /^https?:\/\//i.test(firstLink)) {
      return firstLink
    }

    if (firstLink && typeof firstLink === 'object') {
      const nestedUrl = extractInstagramVideoUrl(firstLink)

      if (nestedUrl) {
        return nestedUrl
      }
    }
  }

  for (const value of Object.values(payload)) {
    const nestedUrl = extractInstagramVideoUrl(value)

    if (nestedUrl) {
      return nestedUrl
    }
  }

  return ''
}

async function getInstagramVideo(url) {
  await validateSafeInstagramUrl(url)

  try {
    if (!process.env.RAPIDAPI_KEY) {
      throw new Error('Missing RapidAPI key')
    }

    const apiUrl =
      'https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert?url=' +
      encodeURIComponent(url)

    const response = await fetch(apiUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'x-rapidapi-host':
          'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
    })

    if (!response.ok) {
      throw new Error('RapidAPI Instagram download failed')
    }

    const data = await response.json()
    const videoUrl = extractInstagramVideoUrl(data)

    if (videoUrl) {
      return videoUrl
    }
  } catch {
    const fallbackUrl = new URL('https://nativeig.vercel.app/api/video')
    fallbackUrl.searchParams.set('postUrl', url)

    const fallbackResponse = await fetch(fallbackUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
    })

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json()
      const fallbackVideoUrl = extractInstagramVideoUrl(fallbackData)

      if (fallbackVideoUrl) {
        return fallbackVideoUrl
      }
    }
  }

  throw new Error('Could not fetch Instagram video. Try uploading instead.')
}

async function downloadVideo(videoUrl) {
  await assertPublicHttpUrl(videoUrl)

  const response = await fetch(videoUrl, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Could not download video')
  }

  assertRemoteVideoResponse(response)

  const bytes = Buffer.from(await response.arrayBuffer())
  const videoPath = path.join(TEMP_DIR, `video-${randomUUID()}.mp4`)

  await fs.mkdir(TEMP_DIR, { recursive: true })
  await fs.writeFile(videoPath, bytes)

  return videoPath
}

async function ensureLanguageData() {
  try {
    await fs.access(TESSDATA_FILE)
    return
  } catch {
    await fs.mkdir(TESSDATA_DIR, { recursive: true })
    try {
      await fs.copyFile(ROOT_TESSDATA_FILE, TESSDATA_FILE)
    } catch {
      throw new Error('Could not load OCR language data')
    }
  }
}

async function extractFrames(filePath, framesDir) {
  const ffmpegPathCandidates = [
    importedFfmpegPath && existsSync(importedFfmpegPath)
      ? importedFfmpegPath
      : null,
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
    'ffmpeg',
  ].filter(Boolean)

  const ffmpegPath = ffmpegPathCandidates.find((candidate) => {
    if (candidate === 'ffmpeg') {
      return true
    }

    return existsSync(candidate)
  })

  if (!ffmpegPath) {
    throw new Error('FFmpeg is not available')
  }

  await fs.mkdir(framesDir, { recursive: true })

  const framePattern = path.join(framesDir, 'frame-%02d.jpg')

  await execFileAsync(ffmpegPath, [
    '-y',
    '-i',
    filePath,
    '-vf',
    'fps=0.5,scale=960:-1',
    '-frames:v',
    '3',
    framePattern,
  ])

  const files = await fs.readdir(framesDir)

  return files
    .filter((file) => file.endsWith('.jpg'))
    .sort()
    .map((file) => path.join(framesDir, file))
}

async function processVideo(filePath) {
  const framesDir = path.join(TEMP_DIR, `frames-${randomUUID()}`)
  try {
    await ensureLanguageData()
    const framePaths = await extractFrames(filePath, framesDir)

    if (framePaths.length === 0) {
      return ''
    }

    const worker = await createWorker('eng', 1, {
      langPath: TESSDATA_DIR,
      cachePath: TESSDATA_DIR,
      gzip: false,
    })
    const textChunks = []

    try {
      await Promise.race([
        (async () => {
          for (const framePath of framePaths) {
            const result = await worker.recognize(framePath)
            const text = result?.data?.text || ''
            textChunks.push(text)

            // Stop early if we already captured enough visible text to match against the catalog.
            if (cleanDetectedText(textChunks.join(' ')).length >= 120) {
              break
            }
          }
        })(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OCR timed out')), MAX_OCR_TIME_MS)
        }),
      ])
    } finally {
      await worker.terminate()
    }

    return cleanDetectedText(textChunks.join(' '))
  } finally {
    await removeTempPath(framesDir)
  }
}

async function findMatchingTools(detectedText) {
  if (!detectedText) {
    return []
  }

  const database = await getDB()
  const patterns = buildSearchPatterns(detectedText)
  const normalizedDetectedText = normalizeName(detectedText)
  const tokenSet = new Set(tokenizeText(detectedText))

  if (patterns.length === 0 && tokenSet.size === 0) {
    return []
  }

  const tools = await database.tool.findMany({
    where: {
      status: 'approved',
      active: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      pricing: true,
      websiteUrl: true,
      tags: true,
    },
  })

  return tools
    .map((tool) => ({
      ...tool,
      score: scoreToolMatch(tool, normalizedDetectedText, patterns, tokenSet),
    }))
    .filter((tool) => tool.score >= 6)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 4)
}

async function saveUploadedVideo(file) {
  assertVideoUpload(file)

  const bytes = Buffer.from(await file.arrayBuffer())
  const extension = path.extname(file.name || '') || '.mp4'
  const filePath = path.join(TEMP_DIR, `upload-${randomUUID()}${extension}`)

  await fs.mkdir(TEMP_DIR, { recursive: true })
  await fs.writeFile(filePath, bytes)

  return filePath
}

async function removeTempPath(targetPath) {
  if (!targetPath) {
    return
  }

  await fs.rm(targetPath, {
    recursive: true,
    force: true,
  })
}

export async function POST(request) {
  let filePath = ''
  let failureStage = 'initialization'
  let processingTimeoutId

  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const rateLimit = checkRateLimit({
      key: `identify-video:${user.id}:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!rateLimit.allowed) {
      return Response.json({ error: 'Too many analysis requests. Please try again later.' }, { status: 429 })
    }

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      failureStage = 'upload-validation'
      const formData = await request.formData()
      const uploadedFile =
        formData.get('file') ||
        formData.get('video') ||
        [...formData.values()].find((value) => typeof value === 'object' && typeof value.arrayBuffer === 'function')

      if (!uploadedFile || typeof uploadedFile.arrayBuffer !== 'function') {
        return Response.json({ error: 'No video file provided' }, { status: 400 })
      }

      filePath = await saveUploadedVideo(uploadedFile)
    } else {
      failureStage = 'instagram-url-validation'
      const parsed = instagramUrlSchema.safeParse(await request.json())

      if (!parsed.success) {
        return Response.json({ error: formatZodError(parsed.error) }, { status: 400 })
      }

      let resolvedVideoUrl = parsed.data.url

      try {
        failureStage = 'instagram-video-resolution'
        resolvedVideoUrl = await getInstagramVideo(parsed.data.url)
      } catch {
        return Response.json(
          { error: 'Could not fetch Instagram video. Try uploading instead.' },
          { status: 400 }
        )
      }

      failureStage = 'video-download'
      filePath = await downloadVideo(resolvedVideoUrl)
    }

    const processingPromise = (async () => {
      failureStage = 'ocr-processing'
      const detectedText = await processVideo(filePath)
      failureStage = 'database-matching'
      const matches = await findMatchingTools(detectedText)

      return { detectedText, matches }
    })()

    const timeoutPromise = new Promise((_, reject) => {
      processingTimeoutId = setTimeout(() => {
        reject(new Error('Analysis timed out'))
      }, MAX_TOTAL_PROCESSING_MS)
    })

    const { detectedText, matches } = await Promise.race([processingPromise, timeoutPromise])

    return Response.json({
      detectedText,
      matches,
    })
  } catch (error) {
    console.error('identify-video error:', error)
    console.error('identify-video stage:', failureStage)

    const message = String(error?.message || '')

    if (message.includes('Could not fetch Instagram video')) {
      return Response.json(
        { error: 'Could not fetch Instagram video. Try uploading instead.' },
        { status: 400 }
      )
    }

    if (
      message.includes('too large') ||
      message.includes('Unsupported file type') ||
      message.includes('did not return a video') ||
      message.includes('Could not download video') ||
      message.includes('Could not load OCR language data') ||
      message.includes('FFmpeg is not available') ||
      message.includes('OCR timed out') ||
      message.includes('Analysis timed out') ||
      message.includes('allowed') ||
      message.includes('Blocked host')
    ) {
      return Response.json({ error: message }, { status: 400 })
    }

    return Response.json({ error: `Failed to process video during ${failureStage}` }, { status: 500 })
  } finally {
    clearTimeout(processingTimeoutId)
    await removeTempPath(filePath)
  }
}

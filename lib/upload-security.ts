import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024
const UPLOAD_DIR = path.join(process.cwd(), 'temp', 'uploads')
const ALLOWED_MIME_TYPES = new Set(['video/mp4', 'video/quicktime'])
const ALLOWED_EXTENSIONS = new Map([
  ['video/mp4', '.mp4'],
  ['video/quicktime', '.mov'],
])
const ALLOWED_EXTENSION_SET = new Set(['.mp4', '.mov'])

function normalizeExtension(fileName: string): string {
  return path.extname(path.basename(fileName || '')).toLowerCase()
}

export function validateVideoFile(file: File) {
  const mimeType = String(file?.type || '').toLowerCase()
  const size = Number(file?.size || 0)
  const originalName = String(file?.name || '')
  const extension = normalizeExtension(originalName)

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('Only MP4 and QuickTime video uploads are allowed.')
  }

  if (!ALLOWED_EXTENSION_SET.has(extension)) {
    throw new Error('Only .mp4 and .mov files are allowed.')
  }

  const expectedExtension = ALLOWED_EXTENSIONS.get(mimeType)

  if (expectedExtension && extension !== expectedExtension) {
    throw new Error('File extension does not match the uploaded video type.')
  }

  if (!size || size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('Video file must be 50MB or smaller.')
  }

  return {
    mimeType,
    size,
    extension,
  }
}

export async function saveTempVideoFile(file: File) {
  const { mimeType, size, extension } = validateVideoFile(file)
  const targetName = `${randomUUID()}${extension}`
  const targetPath = path.join(UPLOAD_DIR, targetName)
  const bytes = Buffer.from(await file.arrayBuffer())

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(targetPath, bytes)

  return {
    fileName: targetName,
    filePath: targetPath,
    mimeType,
    size,
  }
}

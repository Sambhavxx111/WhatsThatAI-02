import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures')
const AVATAR_URL_PREFIX = '/uploads/profile-pictures/'
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_EXTENSIONS = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
])

type AvatarUploadFile = Pick<File, 'type' | 'size' | 'name' | 'arrayBuffer'>

function normalizeExtension(fileName: string) {
  return path.extname(path.basename(fileName || '')).toLowerCase()
}

export function validateAvatarFile(file: AvatarUploadFile) {
  const mimeType = String(file?.type || '').toLowerCase()
  const size = Number(file?.size || 0)
  const originalName = String(file?.name || '')
  const extension = normalizeExtension(originalName)

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('Only PNG, JPG, and WEBP profile pictures are allowed.')
  }

  const expectedExtension = ALLOWED_EXTENSIONS.get(mimeType)

  if (!extension || (expectedExtension && extension !== expectedExtension)) {
    throw new Error('Profile picture extension does not match the uploaded image type.')
  }

  if (!size || size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('Profile picture must be 5MB or smaller.')
  }

  return {
    mimeType,
    extension,
    size,
  }
}

export async function saveProfileImage(file: AvatarUploadFile) {
  const { extension, mimeType, size } = validateAvatarFile(file)
  const fileName = `${randomUUID()}${extension}`
  const filePath = path.join(AVATAR_DIR, fileName)
  const bytes = Buffer.from(await file.arrayBuffer())

  await fs.mkdir(AVATAR_DIR, { recursive: true })
  await fs.writeFile(filePath, bytes)

  return {
    fileName,
    filePath,
    publicUrl: `${AVATAR_URL_PREFIX}${fileName}`,
    mimeType,
    size,
  }
}

export async function removeProfileImage(publicUrl: string | null | undefined) {
  const normalized = String(publicUrl || '')

  if (!normalized.startsWith(AVATAR_URL_PREFIX)) {
    return
  }

  const fileName = path.basename(normalized)
  const filePath = path.join(AVATAR_DIR, fileName)

  await fs.rm(filePath, { force: true })
}

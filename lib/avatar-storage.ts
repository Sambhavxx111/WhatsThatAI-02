import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { db } from '@/lib/db'

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures')
const AVATAR_URL_PREFIX = '/api/profile/avatar/'
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

export function getAvatarFilePath(fileName: string) {
  return path.join(AVATAR_DIR, path.basename(fileName || ''))
}

export function getAvatarContentType(fileName: string) {
  const extension = normalizeExtension(fileName)

  switch (extension) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
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
  const bytes = Buffer.from(await file.arrayBuffer())

  return {
    fileName,
    publicUrl: `${AVATAR_URL_PREFIX}${fileName}`,
    mimeType,
    size,
    bytes,
  }
}

export async function saveProfileImageForUser(
  userId: number,
  file: AvatarUploadFile
) {
  const savedAvatar = await saveProfileImage(file)

  await db.userProfileImage.upsert({
    where: {
      userId,
    },
    update: {
      fileName: savedAvatar.fileName,
      mimeType: savedAvatar.mimeType,
      size: savedAvatar.size,
      data: savedAvatar.bytes,
    },
    create: {
      userId,
      fileName: savedAvatar.fileName,
      mimeType: savedAvatar.mimeType,
      size: savedAvatar.size,
      data: savedAvatar.bytes,
    },
  })

  return {
    ...savedAvatar,
    publicUrl: `${AVATAR_URL_PREFIX}${userId}`,
  }
}

export async function getStoredProfileImage(userId: number) {
  if (!Number.isFinite(userId) || userId <= 0) {
    return null
  }

  return db.userProfileImage.findUnique({
    where: {
      userId,
    },
    select: {
      fileName: true,
      mimeType: true,
      size: true,
      data: true,
    },
  })
}

export async function removeProfileImage(publicUrl: string | null | undefined) {
  const normalized = String(publicUrl || '')

  if (!normalized) {
    return
  }

  const urlWithoutQuery = normalized.split('?')[0]
  const numericIdentifier = urlWithoutQuery.replace(AVATAR_URL_PREFIX, '').trim()

  if (/^\d+$/.test(numericIdentifier)) {
    await db.userProfileImage.deleteMany({
      where: {
        userId: Number(numericIdentifier),
      },
    })

    return
  }

  const isManagedAvatar =
    urlWithoutQuery.startsWith(AVATAR_URL_PREFIX) ||
    urlWithoutQuery.startsWith('/uploads/profile-pictures/')

  if (!isManagedAvatar) {
    return
  }

  const fileName = path.basename(urlWithoutQuery)
  const filePath = getAvatarFilePath(fileName)

  await fs.rm(filePath, { force: true })
}

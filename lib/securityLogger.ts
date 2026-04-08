import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/security'

type RequestLike = {
  headers?: Headers
  method?: string
  nextUrl?: { pathname?: string | null }
  url?: string
}

type LogSecurityEventArgs = {
  userId?: number | null
  event: string
  req?: RequestLike | null
  status?: number | null
  metadata?: unknown
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'cookies',
  'secret',
  'code',
  'otp',
])

function clampString(value: string, maxLength = 500): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`
}

function sanitizeMetadataValue(value: unknown, depth = 0): Prisma.InputJsonValue | null {
  if (value === null || value === undefined) {
    return null
  }

  if (depth >= 3) {
    return '[truncated]'
  }

  if (typeof value === 'string') {
    return clampString(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeMetadataValue(entry, depth + 1)) as Prisma.InputJsonArray
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 20)
    const sanitized: Record<string, Prisma.InputJsonValue | null> = {}

    for (const [key, entryValue] of entries) {
      sanitized[key] = REDACTED_KEYS.has(key) ? '[redacted]' : sanitizeMetadataValue(entryValue, depth + 1)
    }

    return sanitized as Prisma.InputJsonObject
  }

  return clampString(String(value))
}

function getRequestPath(req?: RequestLike | null): string | null {
  if (!req) {
    return null
  }

  if (req.nextUrl?.pathname) {
    return req.nextUrl.pathname
  }

  if (!req.url) {
    return null
  }

  try {
    return new URL(req.url).pathname
  } catch {
    return null
  }
}

function getUserAgent(req?: RequestLike | null): string | null {
  return req?.headers?.get('user-agent') || null
}

function getIpAddress(req?: RequestLike | null): string | null {
  if (!req?.headers) {
    return null
  }

  const ip = getClientIp(req as Request)
  return ip || 'unknown'
}

export async function logSecurityEvent({ userId, event, req, status, metadata }: LogSecurityEventArgs) {
  try {
    await db.securityLog.create({
      data: {
        userId: typeof userId === 'number' ? userId : null,
        event: clampString(String(event || 'UNKNOWN_EVENT'), 100),
        ip: getIpAddress(req),
        userAgent: getUserAgent(req),
        path: getRequestPath(req),
        method: req?.method || null,
        status: typeof status === 'number' ? status : null,
        metadata: sanitizeMetadataValue(metadata),
      },
    })
  } catch (error) {
    console.error('Security logging failed:', error)
  }
}

export async function logUnauthorizedAccess(args: {
  req?: RequestLike | null
  userId?: number | null
  status?: number
  metadata?: unknown
}) {
  return logSecurityEvent({
    event: 'UNAUTHORIZED_ACCESS',
    req: args.req,
    userId: args.userId,
    status: args.status ?? 403,
    metadata: args.metadata,
  })
}

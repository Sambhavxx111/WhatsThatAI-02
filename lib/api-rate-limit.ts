import { NextResponse } from 'next/server'
import { logSecurityEvent } from '@/lib/securityLogger'

type Bucket = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  message?: string
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

const memoryBuckets = new Map<string, Bucket>()

function getRedisConfig() {
  const baseUrl = String(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL || '').trim()
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN || '').trim()

  if (!baseUrl || !token) {
    return null
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
  }
}

function sweepExpiredEntries(now: number) {
  for (const [key, bucket] of memoryBuckets.entries()) {
    if (bucket.resetAt <= now) {
      memoryBuckets.delete(key)
    }
  }
}

function getMemoryBucketResult(bucketKey: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweepExpiredEntries(now)

  const currentBucket = memoryBuckets.get(bucketKey)

  if (!currentBucket || currentBucket.resetAt <= now) {
    const nextBucket = {
      count: 1,
      resetAt: now + windowMs,
    }

    memoryBuckets.set(bucketKey, nextBucket)

    return {
      allowed: true,
      remaining: Math.max(limit - nextBucket.count, 0),
      resetAt: nextBucket.resetAt,
    }
  }

  currentBucket.count += 1

  return {
    allowed: currentBucket.count <= limit,
    remaining: Math.max(limit - currentBucket.count, 0),
    resetAt: currentBucket.resetAt,
  }
}

export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

async function getRedisBucketResult(bucketKey: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redisConfig = getRedisConfig()

  if (!redisConfig) {
    return getMemoryBucketResult(bucketKey, limit, windowMs)
  }

  const response = await fetch(`${redisConfig.baseUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisConfig.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', bucketKey],
      ['PEXPIRE', bucketKey, String(windowMs), 'NX'],
      ['PTTL', bucketKey],
    ]),
    cache: 'no-store',
  })

  if (!response.ok) {
    return getMemoryBucketResult(bucketKey, limit, windowMs)
  }

  const data = (await response.json()) as Array<{ result?: string | number | null }>
  const count = Number(data?.[0]?.result ?? 0)
  const ttlMs = Math.max(Number(data?.[2]?.result ?? windowMs), 0)

  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetAt: Date.now() + ttlMs,
  }
}

export async function checkRateLimit(options: RateLimitOptions & { ip?: string }): Promise<RateLimitResult> {
  const bucketKey = `${options.key}:${options.ip || 'unknown'}`
  return getRedisBucketResult(bucketKey, options.limit, options.windowMs)
}

export async function enforceRateLimit(request: Request, options: RateLimitOptions): Promise<NextResponse | null> {
  const ip = getRequestIp(request)
  const result = await checkRateLimit({
    ...options,
    ip,
  })

  if (result.allowed) {
    return null
  }

  await logSecurityEvent({
    event: 'RATE_LIMIT_HIT',
    req: request,
    status: 429,
    metadata: {
      limiterKey: options.key,
      limit: options.limit,
      windowMs: options.windowMs,
      ip,
    },
  })

  return NextResponse.json(
    { error: options.message || 'Too Many Requests' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1)),
      },
    }
  )
}

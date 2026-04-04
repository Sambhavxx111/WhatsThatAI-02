import { NextResponse } from 'next/server'

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

const buckets = new Map<string, Bucket>()

function sweepExpiredEntries(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

export function enforceRateLimit(request: Request, options: RateLimitOptions): NextResponse | null {
  const now = Date.now()
  sweepExpiredEntries(now)

  const ip = getRequestIp(request)
  const bucketKey = `${options.key}:${ip}`
  const currentBucket = buckets.get(bucketKey)

  if (!currentBucket || currentBucket.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })

    return null
  }

  currentBucket.count += 1

  if (currentBucket.count > options.limit) {
    return NextResponse.json(
      { error: options.message || 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(Math.ceil((currentBucket.resetAt - now) / 1000), 1)),
        },
      }
    )
  }

  return null
}

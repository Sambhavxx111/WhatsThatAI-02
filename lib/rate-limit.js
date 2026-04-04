const buckets = new Map()

function sweepExpiredEntries(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export function checkRateLimit({ key, limit, windowMs }) {
  const now = Date.now()
  sweepExpiredEntries(now)

  const bucketKey = `${key}:${windowMs}:${limit}`
  const current = buckets.get(bucketKey)

  if (!current || current.resetAt <= now) {
    const nextBucket = {
      count: 1,
      resetAt: now + windowMs,
    }

    buckets.set(bucketKey, nextBucket)

    return {
      allowed: true,
      remaining: Math.max(limit - nextBucket.count, 0),
      resetAt: nextBucket.resetAt,
    }
  }

  current.count += 1

  return {
    allowed: current.count <= limit,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
  }
}

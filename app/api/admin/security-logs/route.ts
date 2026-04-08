import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, isAdminUser } from '@/lib/auth'
import { logUnauthorizedAccess } from '@/lib/securityLogger'

const MAX_RESULTS = 100
const SUSPICIOUS_FAILED_LOGIN_THRESHOLD = 5
const SUSPICIOUS_WINDOW_HOURS = 24

type SecurityLogRow = {
  id: string
  event: string
  userId: number | null
  user: {
    id: number
    name: string | null
    email: string
  } | null
  ip: string | null
  userAgent: string | null
  path: string | null
  method: string | null
  status: number | null
  metadata: unknown
  createdAt: Date
}

function normalizeFilter(value: string | null): string | null {
  const normalized = String(value || '').trim()
  return normalized ? normalized : null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user || !isAdminUser(user)) {
      await logUnauthorizedAccess({
        req: request,
        userId: user?.id,
        status: 403,
        metadata: {
          route: 'admin_security_logs',
        },
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const event = normalizeFilter(searchParams.get('event'))
    const ip = normalizeFilter(searchParams.get('ip'))
    const userIdParam = normalizeFilter(searchParams.get('userId'))
    const query = normalizeFilter(searchParams.get('query'))

    const userId = userIdParam && /^\d+$/.test(userIdParam) ? Number(userIdParam) : null
    const queryUserId = query && /^\d+$/.test(query) ? Number(query) : null

    const where: any = {}

    if (event) {
      where.event = event
    }

    if (userId) {
      where.userId = userId
    }

    if (ip) {
      where.ip = { contains: ip }
    }

    if (query) {
      where.OR = [
        ...(queryUserId ? [{ userId: queryUserId }] : []),
        { ip: { contains: query } },
        { userAgent: { contains: query } },
      ]
    }

    const logs = (await db.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_RESULTS,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })) as SecurityLogRow[]

    const ips = [...new Set(logs.map((log: SecurityLogRow) => log.ip).filter((value): value is string => Boolean(value)))]
    const suspiciousSince = new Date(Date.now() - SUSPICIOUS_WINDOW_HOURS * 60 * 60 * 1000)

    const suspiciousCounts = ips.length
      ? await db.securityLog.groupBy({
          by: ['ip'],
          where: {
            event: 'LOGIN_FAILED',
            ip: { in: ips },
            createdAt: { gte: suspiciousSince },
          },
          _count: {
            _all: true,
          },
        })
      : []

    const suspiciousByIp = new Map<string, number>(
      suspiciousCounts
        .filter((entry: { ip: string | null; _count: { _all: number } }) => entry.ip && entry._count._all > SUSPICIOUS_FAILED_LOGIN_THRESHOLD)
        .map((entry: { ip: string | null; _count: { _all: number } }) => [entry.ip as string, entry._count._all])
    )

    return NextResponse.json({
      logs: logs.map((log: SecurityLogRow) => ({
        id: log.id,
        event: log.event,
        userId: log.userId,
        user: log.user,
        ip: log.ip,
        userAgent: log.userAgent,
        path: log.path,
        method: log.method,
        status: log.status,
        metadata: log.metadata,
        createdAt: log.createdAt,
        suspicious: Boolean(log.ip && suspiciousByIp.has(log.ip)),
        suspiciousCount: log.ip ? suspiciousByIp.get(log.ip) || 0 : 0,
      })),
    })
  } catch (error) {
    console.error('Security logs API error:', error)
    return NextResponse.json({ error: 'Could not load security logs.' }, { status: 500 })
  }
}

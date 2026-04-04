import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getRefreshUser, issueAuthTokens, setAuthCookies } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/api-rate-limit'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: 'auth-refresh',
      limit: 20,
      windowMs: 60 * 1000,
      message: 'Too many refresh attempts. Please try again shortly.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const sessionUser = await getRefreshUser(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'Invalid refresh token.' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: {
        id: sessionUser.id,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const tokens = issueAuthTokens(user)
    const response = NextResponse.json({ success: true })
    return setAuthCookies(response, tokens)
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json({ error: 'Could not refresh session.' }, { status: 500 })
  }
}

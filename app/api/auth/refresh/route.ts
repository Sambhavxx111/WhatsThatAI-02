import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, rotateSessionTokens, setAuthCookies } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { logSecurityEvent, logUnauthorizedAccess } from '@/lib/securityLogger'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, {
      key: 'auth-refresh',
      limit: 20,
      windowMs: 60 * 1000,
      message: 'Too many refresh attempts. Please try again shortly.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const session = await rotateSessionTokens(request)

    if (!session || !session.user) {
      await logUnauthorizedAccess({
        req: request,
        status: 401,
        metadata: {
          reason: 'invalid_refresh_token',
        },
      })
      const response = NextResponse.json({ error: 'Invalid refresh token.' }, { status: 401 })
      return clearAuthCookies(response)
    }

    await logSecurityEvent({
      userId: session.user.id,
      event: 'TOKEN_REFRESH',
      req: request,
      status: 200,
      metadata: {
        role: session.user.role,
      },
    })

    const response = NextResponse.json({ success: true })
    return setAuthCookies(response, session)
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json({ error: 'Could not refresh session.' }, { status: 500 })
  }
}


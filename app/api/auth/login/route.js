import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { issueAuthTokens, sanitizeUser, setAuthCookies, verifyPassword } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { logAdminActionForRequest } from '@/lib/admin-audit'

export async function POST(request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: 'login',
      limit: 5,
      windowMs: 60 * 1000,
      message: 'Too many login attempts. Please try again later.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { email, password } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '')

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const validPassword = await verifyPassword(normalizedPassword, user.password)

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (user.role === 'admin') {
      await logAdminActionForRequest({
        request,
        adminId: user.id,
        action: 'admin_login',
      })
    }

    const tokens = issueAuthTokens(user)
    const response = NextResponse.json({ success: true, user: sanitizeUser(user) })
    return setAuthCookies(response, tokens)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Could not log in.' }, { status: 500 })
  }
}

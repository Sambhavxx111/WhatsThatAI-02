import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, issueAuthTokens, sanitizeUser, setAuthCookies } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/security'

function getReservedAdminEmailSet() {
  return new Set(
    String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export async function POST(request) {
  try {
    const ip = getClientIp(request)
    const rateLimit = checkRateLimit({
      key: `signup:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many signup attempts. Please try again later.' }, { status: 429 })
    }

    const { name, email, password } = await request.json()
    const trimmedName = String(name || '').trim()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '')

    if (!trimmedName || !normalizedEmail || normalizedPassword.length < 10) {
      return NextResponse.json(
        { error: 'Name, email, and a 10+ character password are required.' },
        { status: 400 }
      )
    }

    if (getReservedAdminEmailSet().has(normalizedEmail)) {
      return NextResponse.json(
        { error: 'This email is reserved for internal admin access.' },
        { status: 403 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(normalizedPassword)
    const user = await db.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
      },
    })

    const tokens = issueAuthTokens(user)
    const response = NextResponse.json({ success: true, user: sanitizeUser(user) })
    return setAuthCookies(response, tokens)
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 })
  }
}

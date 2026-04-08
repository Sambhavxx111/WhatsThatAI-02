import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { logSecurityEvent, logUnauthorizedAccess } from '@/lib/securityLogger'
import { createOpaqueToken, createVerificationTokenRecord, sendEmailVerificationEmail } from '@/lib/verification'

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
    const rateLimitResponse = await enforceRateLimit(request, {
      key: 'signup',
      limit: 5,
      windowMs: 60 * 60 * 1000,
      message: 'Too many signup attempts. Please try again later.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
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
      await logUnauthorizedAccess({
        req: request,
        status: 403,
        metadata: {
          email: normalizedEmail,
          reason: 'reserved_admin_email_signup_attempt',
        },
      })
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
        emailVerifiedAt: null,
      },
    })

    const verificationToken = createOpaqueToken(32)

    await createVerificationTokenRecord({
      userId: user.id,
      email: user.email,
      type: 'email_verification',
      rawToken: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    await sendEmailVerificationEmail({
      email: user.email,
      token: verificationToken,
      name: user.name,
    })

    await logSecurityEvent({
      userId: user.id,
      event: 'SIGNUP_SUCCESS',
      req: request,
      status: 201,
      metadata: {
        role: user.role,
      },
    })

    return NextResponse.json(
      {
        success: true,
        verificationRequired: true,
        message: 'Check your email to verify your account before logging in.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  issueSessionTokens,
  sanitizeUser,
  setAuthCookies,
  setPendingAdminMfaCookie,
  verifyPassword,
} from '@/lib/auth'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { logSecurityEvent } from '@/lib/securityLogger'
import {
  createNumericCode,
  createOpaqueToken,
  createVerificationTokenRecord,
  sendAdminMfaEmail,
  sendEmailVerificationEmail,
} from '@/lib/verification'

export async function POST(request) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, {
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
      await logSecurityEvent({
        event: 'LOGIN_FAILED',
        req: request,
        status: 401,
        metadata: {
          email: normalizedEmail,
          reason: 'user_not_found',
        },
      })
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const validPassword = await verifyPassword(normalizedPassword, user.password)

    if (!validPassword) {
      await logSecurityEvent({
        userId: user.id,
        event: 'LOGIN_FAILED',
        req: request,
        status: 401,
        metadata: {
          email: normalizedEmail,
          reason: 'invalid_password',
        },
      })
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (!user.emailVerifiedAt) {
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
        event: 'LOGIN_FAILED',
        req: request,
        status: 403,
        metadata: {
          email: normalizedEmail,
          reason: 'email_unverified',
        },
      })

      return NextResponse.json(
        { error: 'Please verify your email before logging in. We sent you a fresh verification link.' },
        { status: 403 }
      )
    }

    if (user.role === 'admin') {
      const mfaCode = createNumericCode()
      const challenge = await createVerificationTokenRecord({
        userId: user.id,
        email: user.email,
        type: 'admin_mfa',
        rawToken: mfaCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })

      await sendAdminMfaEmail({
        email: user.email,
        code: mfaCode,
        name: user.name,
      })

      const response = NextResponse.json({
        success: true,
        requiresMfa: true,
        message: 'Enter the verification code we sent to your admin email.',
      })

      return setPendingAdminMfaCookie(response, {
        userId: user.id,
        email: user.email,
        challengeId: challenge.id,
      })
    }

    const tokens = await issueSessionTokens(user, request)
    await logSecurityEvent({
      userId: user.id,
      event: 'LOGIN_SUCCESS',
      req: request,
      status: 200,
      metadata: {
        role: user.role,
      },
    })
    const response = NextResponse.json({ success: true, user: sanitizeUser(user) })
    return setAuthCookies(response, tokens)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Could not log in.' }, { status: 500 })
  }
}

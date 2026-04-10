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
import { logAdminActionForRequest } from '@/lib/admin-audit'
import { getUserOnboardingPreference } from '@/lib/onboarding'
import { logSecurityEvent } from '@/lib/securityLogger'
import { isEmailDeliveryConfigured } from '@/lib/mail'
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

    let effectiveUser = user
    const emailDeliveryConfigured = isEmailDeliveryConfigured()

    if (!effectiveUser.emailVerifiedAt && emailDeliveryConfigured) {
      try {
        const verificationToken = createOpaqueToken(32)
        await createVerificationTokenRecord({
          userId: effectiveUser.id,
          email: effectiveUser.email,
          type: 'email_verification',
          rawToken: verificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })

        await sendEmailVerificationEmail({
          email: effectiveUser.email,
          token: verificationToken,
          name: effectiveUser.name,
        })

        await logSecurityEvent({
          userId: effectiveUser.id,
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
      } catch (error) {
        console.warn('Verification email unavailable, allowing login:', error)
        effectiveUser = await db.user.update({
          where: { id: effectiveUser.id },
          data: { emailVerifiedAt: new Date() },
        })
      }
    } else if (!effectiveUser.emailVerifiedAt) {
      effectiveUser = await db.user.update({
        where: { id: effectiveUser.id },
        data: { emailVerifiedAt: new Date() },
      })
    }

    if (effectiveUser.role === 'admin' && emailDeliveryConfigured) {
      try {
        const mfaCode = createNumericCode()
        const challenge = await createVerificationTokenRecord({
          userId: effectiveUser.id,
          email: effectiveUser.email,
          type: 'admin_mfa',
          rawToken: mfaCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })

        await sendAdminMfaEmail({
          email: effectiveUser.email,
          code: mfaCode,
          name: effectiveUser.name,
        })

        const response = NextResponse.json({
          success: true,
          requiresMfa: true,
          message: 'Enter the verification code we sent to your admin email.',
        })

        return setPendingAdminMfaCookie(response, {
          userId: effectiveUser.id,
          email: effectiveUser.email,
          challengeId: challenge.id,
        })
      } catch (error) {
        console.warn('Admin MFA email unavailable, allowing direct admin login:', error)
      }
    }

    if (effectiveUser.role === 'admin') {
      await logAdminActionForRequest({
        request,
        adminId: effectiveUser.id,
        action: 'admin_login',
      })
    }

    const onboardingPreference = await getUserOnboardingPreference(effectiveUser.id)
    const tokens = await issueSessionTokens(effectiveUser, request)
    await logSecurityEvent({
      userId: effectiveUser.id,
      event: 'LOGIN_SUCCESS',
      req: request,
      status: 200,
      metadata: {
        role: effectiveUser.role,
      },
    })
    const response = NextResponse.json({
      success: true,
      user: sanitizeUser(effectiveUser),
      onboardingRequired: !Boolean(onboardingPreference?.completedAt),
    })
    return setAuthCookies(response, tokens)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Could not log in.' }, { status: 500 })
  }
}

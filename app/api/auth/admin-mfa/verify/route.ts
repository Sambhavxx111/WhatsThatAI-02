import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  clearPendingAdminMfaCookie,
  getPendingAdminMfaPayload,
  issueSessionTokens,
  sanitizeUser,
  setAuthCookies,
} from '@/lib/auth'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { logAdminActionForRequest } from '@/lib/admin-audit'
import { logSecurityEvent, logUnauthorizedAccess } from '@/lib/securityLogger'
import { consumeVerificationToken } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, {
      key: 'admin-mfa-verify',
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: 'Too many verification attempts. Please try again shortly.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const payload = getPendingAdminMfaPayload(request)

    if (!payload?.challengeId || !payload?.sub || !payload?.email) {
      await logUnauthorizedAccess({
        req: request,
        status: 401,
        metadata: {
          reason: 'missing_admin_mfa_session',
        },
      })
      return NextResponse.json({ error: 'Admin verification session expired.' }, { status: 401 })
    }

    const { code } = await request.json()
    const normalizedCode = String(code || '').trim()

    if (!/^\d{6}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 })
    }

    const token = await consumeVerificationToken({
      id: payload.challengeId,
      email: payload.email,
      type: 'admin_mfa',
      rawToken: normalizedCode,
    })

    if (!token) {
      await logSecurityEvent({
        userId: Number(payload.sub),
        event: 'ADMIN_MFA_FAILED',
        req: request,
        status: 401,
        metadata: {
          email: payload.email,
        },
      })
      await logUnauthorizedAccess({
        req: request,
        userId: Number(payload.sub),
        status: 401,
        metadata: {
          reason: 'invalid_admin_mfa_code',
          email: payload.email,
        },
      })
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: {
        id: Number(payload.sub),
      },
    })

    if (!user || user.role !== 'admin' || !user.emailVerifiedAt) {
      await logUnauthorizedAccess({
        req: request,
        userId: user?.id,
        status: 403,
        metadata: {
          reason: 'admin_account_not_eligible',
          email: payload.email,
        },
      })
      const response = NextResponse.json({ error: 'Admin account is not eligible for verification.' }, { status: 403 })
      return clearPendingAdminMfaCookie(response)
    }

    await logSecurityEvent({
      userId: user.id,
      event: 'ADMIN_MFA_SUCCESS',
      req: request,
      status: 200,
      metadata: {
        email: user.email,
      },
    })

    await logSecurityEvent({
      userId: user.id,
      event: 'LOGIN_SUCCESS',
      req: request,
      status: 200,
      metadata: {
        role: user.role,
        adminMfa: true,
      },
    })

    await logAdminActionForRequest({
      request,
      adminId: user.id,
      action: 'admin_login',
    })

    const tokens = await issueSessionTokens(user, request)
    const response = NextResponse.json({ success: true, user: sanitizeUser(user) })
    clearPendingAdminMfaCookie(response)
    return setAuthCookies(response, tokens)
  } catch (error) {
    console.error('Admin MFA verify error:', error)
    return NextResponse.json({ error: 'Could not verify admin sign-in.' }, { status: 500 })
  }
}

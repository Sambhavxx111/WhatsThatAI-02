import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt, { type JwtPayload, type Secret, type SignOptions } from 'jsonwebtoken'
import type { User, user_role } from '@prisma/client'
import type { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getRequestIp } from '@/lib/api-rate-limit'

export const ACCESS_COOKIE_NAME = 'whatsthatai_access_token'
export const REFRESH_COOKIE_NAME = 'whatsthatai_refresh_token'
export const ADMIN_MFA_COOKIE_NAME = 'whatsthatai_admin_mfa'
export const AUTH_COOKIE_NAME = ACCESS_COOKIE_NAME
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60
export const ADMIN_MFA_TTL_SECONDS = 10 * 60

type AuthRole = user_role | 'user' | 'admin'

type AuthUser = {
  id: number
  name: string | null
  email: string
  role: AuthRole
  createdAt: Date | null
  profileImageUrl: string | null
  emailVerifiedAt: Date | null
}

type AuthTokenPayload = JwtPayload & {
  sub: string
  email: string
  name: string
  role: AuthRole
  sid?: string
  tokenType: 'access' | 'refresh'
}

type AdminMfaPayload = JwtPayload & {
  sub: string
  email: string
  challengeId: string
  tokenType: 'admin-mfa'
}

type RequestWithCookies = {
  headers?: Headers
  cookies?: {
    get?: (name: string) => { value: string } | undefined
  }
}

async function getUserFromRefreshToken(request: RequestWithCookies) {
  const refreshToken = request.cookies?.get?.(REFRESH_COOKIE_NAME)?.value

  if (!refreshToken) {
    return null
  }

  const payload = verifyRefreshToken(refreshToken)

  if (!payload?.sub || !payload.sid) {
    return null
  }

  const session = await db.authSession.findUnique({
    where: {
      id: payload.sid,
    },
    include: {
      user: true,
    },
  })

  if (!session || session.userId !== Number(payload.sub) || session.revokedAt || session.expiresAt <= new Date()) {
    return null
  }

  if (session.refreshTokenHash !== hashSessionToken(refreshToken)) {
    return null
  }

  return sanitizeUser(session.user)
}

function getJwtSecret(): Secret {
  const secret = String(process.env.JWT_SECRET || '').trim()

  if (!secret || secret === 'change-me-in-env' || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong value before the app can start')
  }

  return secret
}

function getCookieSecureFlag(): boolean {
  return process.env.NODE_ENV === 'production'
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function signToken(
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>,
  tokenType: 'access' | 'refresh',
  expiresIn: number,
  sessionId?: string
): string {
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name || '',
    role: user.role || 'user',
    sid: sessionId,
    tokenType,
  }

  const options: SignOptions = {
    expiresIn,
    issuer: 'WhatsThatAI',
    audience: 'WhatsThatAI',
  }

  return jwt.sign(payload, getJwtSecret(), options)
}

function verifyToken(token: string, expectedType: 'access' | 'refresh'): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: 'WhatsThatAI',
      audience: 'WhatsThatAI',
    }) as AuthTokenPayload

    if (payload.tokenType !== expectedType || !payload.sub) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function signAdminMfaCookieToken(input: { userId: number; email: string; challengeId: string }): string {
  return jwt.sign(
    {
      sub: String(input.userId),
      email: input.email,
      challengeId: input.challengeId,
      tokenType: 'admin-mfa',
    },
    getJwtSecret(),
    {
      expiresIn: ADMIN_MFA_TTL_SECONDS,
      issuer: 'WhatsThatAI',
      audience: 'WhatsThatAI',
    }
  )
}

function verifyAdminMfaCookieToken(token: string): AdminMfaPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: 'WhatsThatAI',
      audience: 'WhatsThatAI',
    }) as AdminMfaPayload

    if (payload.tokenType !== 'admin-mfa' || !payload.sub || !payload.challengeId) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function signAccessToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>, sessionId?: string): string {
  return signToken(user, 'access', ACCESS_TOKEN_TTL_SECONDS, sessionId)
}

export function signRefreshToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>, sessionId: string): string {
  return signToken(user, 'refresh', REFRESH_TOKEN_TTL_SECONDS, sessionId)
}

export function signAuthToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>, sessionId?: string): string {
  return signAccessToken(user, sessionId)
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  return verifyToken(token, 'access')
}

export function verifyRefreshToken(token: string): AuthTokenPayload | null {
  return verifyToken(token, 'refresh')
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  return verifyAccessToken(token)
}

export async function issueSessionTokens(
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>,
  request?: RequestWithCookies
) {
  const session = await db.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: '',
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: request?.headers?.get?.('user-agent') || null,
      ipAddress: request ? getRequestIp(request as Request) : null,
    },
  })

  const accessToken = signAccessToken(user, session.id)
  const refreshToken = signRefreshToken(user, session.id)

  await db.authSession.update({
    where: {
      id: session.id,
    },
    data: {
      refreshTokenHash: hashSessionToken(refreshToken),
    },
  })

  return {
    sessionId: session.id,
    accessToken,
    refreshToken,
  }
}

export async function rotateSessionTokens(request: RequestWithCookies) {
  const refreshToken = request.cookies?.get?.(REFRESH_COOKIE_NAME)?.value

  if (!refreshToken) {
    return null
  }

  const payload = verifyRefreshToken(refreshToken)

  if (!payload?.sub || !payload.sid) {
    return null
  }

  const session = await db.authSession.findUnique({
    where: {
      id: payload.sid,
    },
    include: {
      user: true,
    },
  })

  if (!session || session.userId !== Number(payload.sub) || session.revokedAt || session.expiresAt <= new Date()) {
    return null
  }

  const expectedHash = hashSessionToken(refreshToken)

  if (session.refreshTokenHash !== expectedHash) {
    await db.authSession.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    })

    return null
  }

  const accessToken = signAccessToken(session.user, session.id)
  const nextRefreshToken = signRefreshToken(session.user, session.id)

  await db.authSession.update({
    where: {
      id: session.id,
    },
    data: {
      refreshTokenHash: hashSessionToken(nextRefreshToken),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: request.headers?.get?.('user-agent') || session.userAgent,
      ipAddress: getRequestIp(request as Request),
    },
  })

  return {
    user: sanitizeUser(session.user),
    sessionId: session.id,
    accessToken,
    refreshToken: nextRefreshToken,
  }
}

export async function revokeSessionFromRequest(request: RequestWithCookies) {
  const refreshToken = request.cookies?.get?.(REFRESH_COOKIE_NAME)?.value

  if (!refreshToken) {
    return
  }

  const payload = verifyRefreshToken(refreshToken)

  if (!payload?.sid) {
    return
  }

  await db.authSession.updateMany({
    where: {
      id: payload.sid,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export function setAuthCookies(response: NextResponse, tokens: { accessToken: string; refreshToken: string }): NextResponse {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: tokens.accessToken,
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  })

  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: tokens.refreshToken,
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  })

  response.cookies.set({
    name: ADMIN_MFA_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: 0,
  })

  return response
}

export function setPendingAdminMfaCookie(
  response: NextResponse,
  input: { userId: number; email: string; challengeId: string }
): NextResponse {
  response.cookies.set({
    name: ADMIN_MFA_COOKIE_NAME,
    value: signAdminMfaCookieToken(input),
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: ADMIN_MFA_TTL_SECONDS,
  })

  return response
}

export function getPendingAdminMfaPayload(request: RequestWithCookies): AdminMfaPayload | null {
  const token = request.cookies?.get?.(ADMIN_MFA_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifyAdminMfaCookieToken(token)
}

export function clearPendingAdminMfaCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ADMIN_MFA_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: 0,
  })

  return response
}

export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  })

  return response
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: 0,
  })

  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: 0,
  })

  response.cookies.set({
    name: ADMIN_MFA_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: getCookieSecureFlag(),
    path: '/',
    maxAge: 0,
  })

  return response
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  return clearAuthCookies(response)
}

export function sanitizeUser(user: AuthUser | null) {
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImageUrl: user.profileImageUrl || null,
    role: user.role || 'user',
    emailVerifiedAt: user.emailVerifiedAt || null,
    createdAt: user.createdAt,
  }
}

export function isAdminUser(user: { role?: AuthRole | null } | null | undefined): boolean {
  return user?.role === 'admin'
}

export async function getAuthenticatedUser(request: RequestWithCookies) {
  const token = request.cookies?.get?.(ACCESS_COOKIE_NAME)?.value

  if (token) {
    const payload = verifyAccessToken(token)

    if (payload?.sub) {
      const user = await db.user.findUnique({
        where: {
          id: Number(payload.sub),
        },
      })

      if (user) {
        return sanitizeUser(user)
      }
    }
  }

  return getUserFromRefreshToken(request)
}

export async function requireVerifiedUser(request: RequestWithCookies) {
  const user = await getAuthenticatedUser(request)

  if (!user || !user.emailVerifiedAt) {
    return null
  }

  return user
}

export async function requireAdminUser(request: RequestWithCookies) {
  const user = await requireVerifiedUser(request)

  if (!user || !isAdminUser(user)) {
    return null
  }

  return user
}

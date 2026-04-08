import bcrypt from 'bcryptjs'
import jwt, { type JwtPayload, type Secret, type SignOptions } from 'jsonwebtoken'
import type { User, user_role } from '@prisma/client'
import type { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const ACCESS_COOKIE_NAME = 'whatsthatai_access_token'
export const REFRESH_COOKIE_NAME = 'whatsthatai_refresh_token'
export const AUTH_COOKIE_NAME = ACCESS_COOKIE_NAME
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

type AuthRole = user_role | 'user' | 'admin'

type AuthUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'createdAt' | 'profileImageUrl'>

type AuthTokenPayload = JwtPayload & {
  sub: string
  email: string
  name: string
  role: AuthRole
  tokenType: 'access' | 'refresh'
}

type RequestWithCookies = {
  cookies?: {
    get?: (name: string) => { value: string } | undefined
  }
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

function signToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>, tokenType: 'access' | 'refresh', expiresIn: number): string {
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name || '',
    role: user.role || 'user',
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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function signAccessToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): string {
  return signToken(user, 'access', ACCESS_TOKEN_TTL_SECONDS)
}

export function signRefreshToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): string {
  return signToken(user, 'refresh', REFRESH_TOKEN_TTL_SECONDS)
}

export function signAuthToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): string {
  return signAccessToken(user)
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

export function issueAuthTokens(user: Pick<User, 'id' | 'email' | 'name' | 'role'>) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  }
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
    createdAt: user.createdAt,
  }
}

export function isAdminUser(user: { role?: AuthRole | null } | null | undefined): boolean {
  return user?.role === 'admin'
}

export async function getAuthenticatedUser(request: RequestWithCookies) {
  const token = request.cookies?.get?.(ACCESS_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyAccessToken(token)

  if (!payload?.sub) {
    return null
  }

  const user = await db.user.findUnique({
    where: {
      id: Number(payload.sub),
    },
  })

  return sanitizeUser(user)
}

export async function getRefreshUser(request: RequestWithCookies) {
  const token = request.cookies?.get?.(REFRESH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyRefreshToken(token)

  if (!payload?.sub) {
    return null
  }

  const user = await db.user.findUnique({
    where: {
      id: Number(payload.sub),
    },
  })

  return user ? sanitizeUser(user) : null
}

export async function requireAdminUser(request: RequestWithCookies) {
  const user = await getAuthenticatedUser(request)

  if (!user || !isAdminUser(user)) {
    return null
  }

  return user
}

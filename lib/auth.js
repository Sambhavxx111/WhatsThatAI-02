import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

export const AUTH_COOKIE_NAME = 'whatsthatai_token'
const DEFAULT_JWT_SECRET = 'change-me-in-env'

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET
}

function getAdminEmailSet() {
  return new Set(
    String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name || '',
    },
    getJwtSecret(),
    {
      expiresIn: '7d',
    }
  )
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, getJwtSecret())
  } catch {
    return null
  }
}

export function setAuthCookie(response, token) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}

export function clearAuthCookie(response) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}

export function sanitizeUser(user) {
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }
}

export function isAdminEmail(email) {
  if (!email) return false
  return getAdminEmailSet().has(String(email).trim().toLowerCase())
}

export function isAdminUser(user) {
  return isAdminEmail(user?.email)
}

export async function getAuthenticatedUser(request) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyAuthToken(token)

  if (!payload?.userId) {
    return null
  }

  const user = await db.user.findUnique({
    where: {
      id: payload.userId,
    },
  })

  return sanitizeUser(user)
}

export async function requireAdminUser(request) {
  const user = await getAuthenticatedUser(request)

  if (!user || !isAdminUser(user)) {
    return null
  }

  return user
}

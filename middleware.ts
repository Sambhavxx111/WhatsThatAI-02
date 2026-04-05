import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ACCESS_COOKIE_NAME = 'whatsthatai_access_token'
const ADMIN_ROLE = 'admin'
const PROTECTED_PREFIXES = ['/api/admin/', '/portal/']

function getJwtSecret(): Uint8Array {
  const secret = String(process.env.JWT_SECRET || '').trim()

  if (!secret || secret === 'change-me-in-env' || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong value before middleware can run')
  }

  return new TextEncoder().encode(secret)
}

function buildCsp(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: blob:",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]

  if (process.env.NODE_ENV === 'production') {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', buildCsp())
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return response
}

async function verifyAdminToken(token: string): Promise<boolean> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    issuer: 'WhatsThatAI',
    audience: 'WhatsThatAI',
  })

  return payload?.role === ADMIN_ROLE && payload?.tokenType === 'access'
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function forbiddenResponse(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith('/portal') || request.nextUrl.pathname === '/admin') {
    const response = new NextResponse('404 Not Found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })

    return applySecurityHeaders(response)
  }

  const response = request.nextUrl.pathname.startsWith('/api/')
    ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    : new NextResponse('403 Forbidden', {
        status: 403,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      })

  return applySecurityHeaders(response)
}

export async function middleware(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value

    if (!token) {
      return forbiddenResponse(request)
    }

    try {
      const isAdmin = await verifyAdminToken(token)

      if (!isAdmin) {
        return forbiddenResponse(request)
      }
    } catch {
      return forbiddenResponse(request)
    }
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

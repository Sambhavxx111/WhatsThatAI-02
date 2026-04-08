import { NextResponse } from 'next/server'
import { clearAuthCookies, getAuthenticatedUser, revokeSessionFromRequest } from '@/lib/auth'
import { logSecurityEvent } from '@/lib/securityLogger'

export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  await revokeSessionFromRequest(request)
  await logSecurityEvent({
    userId: user?.id,
    event: 'LOGOUT',
    req: request,
    status: 200,
    metadata: {
      role: user?.role || null,
    },
  })
  const response = NextResponse.json({ success: true })
  return clearAuthCookies(response)
}

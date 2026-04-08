import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AUTH_COOKIE_NAME, isAdminUser, sanitizeUser, verifyAuthToken } from '@/lib/auth'
import { isAdminHost } from '@/lib/admin-host'
import { logUnauthorizedAccess } from '@/lib/securityLogger'

async function getPortalUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyAuthToken(token)

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

function buildRequestLike(requestHeaders, path) {
  const host = requestHeaders.get('host') || 'unknown'

  return {
    headers: requestHeaders,
    method: 'GET',
    url: `https://${host}${path}`,
  }
}

export default async function AdminRedirectPage() {
  const requestHeaders = await headers()

  if (!isAdminHost(requestHeaders.get('host'))) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/admin'),
      status: 404,
      metadata: {
        route: 'legacy_admin_redirect',
        reason: 'wrong_admin_host',
      },
    })
    notFound()
  }

  const user = await getPortalUser()

  if (!user) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/admin'),
      status: 404,
      metadata: {
        route: 'legacy_admin_redirect',
        reason: 'missing_user',
      },
    })
    notFound()
  }

  if (!isAdminUser(user)) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/admin'),
      userId: user.id,
      status: 404,
      metadata: {
        route: 'legacy_admin_redirect',
        reason: 'non_admin_user',
      },
    })
    notFound()
  }

  redirect('/portal/admin')
}

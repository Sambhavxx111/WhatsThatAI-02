import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'
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

export default async function AdminPortalPage() {
  const requestHeaders = await headers()

  if (!isAdminHost(requestHeaders.get('host'))) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/portal/admin'),
      status: 404,
      metadata: {
        route: 'admin_portal',
        reason: 'wrong_admin_host',
      },
    })
    notFound()
  }

  const user = await getPortalUser()

  if (!user) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/portal/admin'),
      status: 404,
      metadata: {
        route: 'admin_portal',
        reason: 'missing_user',
      },
    })
    notFound()
  }

  if (!isAdminUser(user)) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/portal/admin'),
      userId: user.id,
      status: 404,
      metadata: {
        route: 'admin_portal',
        reason: 'non_admin_user',
      },
    })
    notFound()
  }

  return <AdminDashboard />
}

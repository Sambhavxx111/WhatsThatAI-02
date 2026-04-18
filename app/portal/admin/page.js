import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { getAuthenticatedUser, isAdminUser } from '@/lib/auth'
import { isAdminHost } from '@/lib/admin-host'
import { logUnauthorizedAccess } from '@/lib/securityLogger'

async function getPortalUser() {
  const cookieStore = await cookies()
  return getAuthenticatedUser({ cookies: cookieStore })
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

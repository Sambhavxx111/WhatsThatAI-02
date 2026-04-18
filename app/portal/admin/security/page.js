import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import SecurityLogDashboard from '@/components/admin/SecurityLogDashboard'
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

export default async function AdminSecurityLogsPage() {
  const requestHeaders = await headers()

  if (!isAdminHost(requestHeaders.get('host'))) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/portal/admin/security'),
      status: 404,
      metadata: {
        route: 'admin_security_page',
        reason: 'wrong_admin_host',
      },
    })
    notFound()
  }

  const user = await getPortalUser()

  if (!user || !isAdminUser(user)) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/portal/admin/security'),
      userId: user?.id,
      status: 404,
      metadata: {
        route: 'admin_security_page',
        reason: user ? 'non_admin_user' : 'missing_user',
      },
    })
    notFound()
  }

  return <SecurityLogDashboard />
}

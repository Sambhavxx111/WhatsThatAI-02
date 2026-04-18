import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
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

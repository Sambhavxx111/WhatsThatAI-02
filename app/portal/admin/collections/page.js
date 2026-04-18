import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import CuratedCollectionsManager from '@/components/admin/CuratedCollectionsManager'
import { getAuthenticatedUser, isAdminUser } from '@/lib/auth'
import { isAdminHost } from '@/lib/admin-host'
import { ENABLE_CURATED_COLLECTIONS } from '@/lib/feature-flags'
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

export default async function AdminCollectionsPage() {
  const requestHeaders = await headers()

  if (!ENABLE_CURATED_COLLECTIONS) {
    notFound()
  }

  if (!isAdminHost(requestHeaders.get('host'))) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/portal/admin/collections'),
      status: 404,
      metadata: {
        route: 'admin_collections_page',
        reason: 'wrong_admin_host',
      },
    })
    notFound()
  }

  const user = await getPortalUser()

  if (!user || !isAdminUser(user)) {
    await logUnauthorizedAccess({
      req: buildRequestLike(requestHeaders, '/portal/admin/collections'),
      userId: user?.id,
      status: 404,
      metadata: {
        route: 'admin_collections_page',
        reason: user ? 'non_admin_user' : 'missing_user',
      },
    })
    notFound()
  }

  return <CuratedCollectionsManager />
}


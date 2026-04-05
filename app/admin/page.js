import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AUTH_COOKIE_NAME, isAdminUser, sanitizeUser, verifyAuthToken } from '@/lib/auth'

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

export default async function AdminRedirectPage() {
  const user = await getPortalUser()

  if (!user) {
    notFound()
  }

  if (!isAdminUser(user)) {
    notFound()
  }

  redirect('/portal/admin')
}

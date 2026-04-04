import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { db } from '@/lib/db'
import { AUTH_COOKIE_NAME, isAdminUser, sanitizeUser, verifyAuthToken } from '@/lib/auth'

async function getPortalUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

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

export default async function AdminPortalPage() {
  const user = await getPortalUser()

  if (!user) {
    redirect('/portal')
  }

  if (!isAdminUser(user)) {
    redirect('/portal?denied=1')
  }

  return <AdminDashboard />
}

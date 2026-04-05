import { NextResponse } from 'next/server'
import { getAuthenticatedUser, isAdminUser } from '@/lib/auth'
import { isWhatsThatAIOfficialEmail } from '@/lib/official-accounts'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request)
    return NextResponse.json({
      user: user
        ? {
            ...user,
            isAdmin: isAdminUser(user),
            isOfficial: isWhatsThatAIOfficialEmail(user.email),
          }
        : null,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

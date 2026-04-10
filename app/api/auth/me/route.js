import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, isAdminUser } from '@/lib/auth'
import { isWhatsThatAIOfficialEmail } from '@/lib/official-accounts'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request)

    let onboardingPreference = null
    if (user) {
      onboardingPreference = await db.userOnboardingPreference.findUnique({
        where: {
          userId: user.id,
        },
      })
    }

    return NextResponse.json({
      user: user
        ? {
            ...user,
            isAdmin: isAdminUser(user),
            isOfficial: isWhatsThatAIOfficialEmail(user.email),
            onboardingCompleted: Boolean(onboardingPreference?.completedAt),
            onboardingCategories: Array.isArray(onboardingPreference?.categories)
              ? onboardingPreference.categories
              : [],
          }
        : null,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

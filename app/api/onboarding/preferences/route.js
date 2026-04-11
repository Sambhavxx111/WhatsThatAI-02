import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { ENABLE_INTEREST_ONBOARDING } from '@/lib/feature-flags'
import {
  getCuratedCollectionsForCategories,
  getMatchingToolsForCategories,
  getUserOnboardingPreference,
  ONBOARDING_CATEGORIES,
  saveUserOnboardingPreference,
  sanitizeCategorySelection,
} from '@/lib/onboarding'
import { formatZodError, onboardingPreferenceSchema } from '@/lib/validation'

export async function GET(request) {
  try {
    if (!ENABLE_INTEREST_ONBOARDING) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preference = await getUserOnboardingPreference(user.id)
    const categories = Array.isArray(preference?.categories) ? preference.categories : []
    const [suggestedTools, starterCollections, trendingCollections] = categories.length
      ? await Promise.all([
          getMatchingToolsForCategories(categories, 8),
          getCuratedCollectionsForCategories(categories, { type: 'starter', limit: 3 }),
          getCuratedCollectionsForCategories(categories, { type: 'trending', limit: 3 }),
        ])
      : [[], [], []]

    return NextResponse.json({
      categories: ONBOARDING_CATEGORIES,
      selectedCategories: categories,
      onboardingCompleted: Boolean(preference?.completedAt),
      suggestedTools,
      starterCollections,
      trendingCollections,
    })
  } catch (error) {
    console.error('Onboarding preference fetch error:', error)
    return NextResponse.json({ error: 'Could not load onboarding preferences.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!ENABLE_INTEREST_ONBOARDING) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (body?.skip === true) {
      await saveUserOnboardingPreference(user.id, [])
      return NextResponse.json({
        success: true,
        selectedCategories: [],
        suggestedTools: [],
        starterCollections: [],
        trendingCollections: [],
      })
    }

    const parsed = onboardingPreferenceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const selectedCategories = sanitizeCategorySelection(parsed.data.categories)

    if (!selectedCategories.length) {
      return NextResponse.json({ error: 'Choose at least one category.' }, { status: 400 })
    }

    await saveUserOnboardingPreference(user.id, selectedCategories)

    const [suggestedTools, starterCollections, trendingCollections] = await Promise.all([
      getMatchingToolsForCategories(selectedCategories, 8),
      getCuratedCollectionsForCategories(selectedCategories, { type: 'starter', limit: 3 }),
      getCuratedCollectionsForCategories(selectedCategories, { type: 'trending', limit: 3 }),
    ])

    return NextResponse.json({
      success: true,
      selectedCategories,
      suggestedTools,
      starterCollections,
      trendingCollections,
    })
  } catch (error) {
    console.error('Onboarding preference save error:', error)
    return NextResponse.json({ error: 'Could not save onboarding preferences.' }, { status: 500 })
  }
}

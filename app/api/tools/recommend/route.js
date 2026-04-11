import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { recommendTools } from '@/lib/queries'
import { assistantRecommendationSchema, formatZodError } from '@/lib/validation'

export async function POST(request) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, {
      key: 'tool-recommendations',
      limit: 20,
      windowMs: 60 * 1000,
      message: 'Too many recommendation requests. Please try again in a moment.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const parsed = assistantRecommendationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const tools = await recommendTools(parsed.data)

    return NextResponse.json({
      tools,
      summary:
        tools.length > 0
          ? 'Here are the strongest matches from the current marketplace catalog.'
          : 'No strong matches yet. Try broadening the goal or removing filters.',
    })
  } catch (error) {
    console.error('Tool recommendation error:', error)
    return NextResponse.json(
      { error: 'Could not generate tool suggestions right now.' },
      { status: 500 }
    )
  }
}

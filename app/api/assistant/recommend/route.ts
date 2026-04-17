import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import {
  assistantRecommendationSchema,
  formatZodError,
  sanitizeText,
} from '@/lib/validation'
import { attachRatingsToTools } from '@/lib/queries'

type GeminiPlan = {
  intentSummary: string
  searchTerms: string[]
  categories: string[]
  pricingPreference: 'free' | 'freemium' | 'paid' | 'enterprise' | 'any'
  recommendedCapabilities: string[]
}

type ToolCandidate = {
  id: number
  name: string
  slug: string
  description: string
  category: string
  tags: string[]
  pricing: string
  source: string
  avgRating: number | null
  totalReviews: number
  websiteUrl: string
  logoUrl: string
}

const GEMINI_MODEL = 'gemini-2.5-flash'
const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'build',
  'for',
  'from',
  'goal',
  'help',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'me',
  'my',
  'need',
  'of',
  'on',
  'or',
  'our',
  'project',
  'searching',
  'task',
  'the',
  'their',
  'them',
  'to',
  'tool',
  'tools',
  'want',
  'with',
])

const CATEGORY_HINTS = [
  { key: 'resume', terms: ['resume', 'cv', 'job application'] },
  { key: 'writing', terms: ['writing', 'copy', 'content', 'blog'] },
  { key: 'video', terms: ['video', 'reel', 'editing', 'youtube'] },
  { key: 'coding', terms: ['coding', 'code', 'debugging', 'developer', 'programming'] },
  { key: 'design', terms: ['design', 'ui', 'branding', 'graphics'] },
  { key: 'marketing', terms: ['marketing', 'seo', 'ads', 'campaign'] },
  { key: 'research', terms: ['research', 'analysis', 'study', 'insights'] },
  { key: 'productivity', terms: ['productivity', 'workflow', 'automation', 'organize'] },
]

const CAPABILITY_HINTS = [
  'ats',
  'resume',
  'job matching',
  'career guidance',
  'video editing',
  'debugging',
  'seo',
  'automation',
]

function buildFallbackPlan(goal: string): GeminiPlan {
  const normalizedGoal = sanitizeText(goal).toLowerCase()
  const searchTerms = uniqueNormalized(
    normalizedGoal
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
    8
  )

  const categories = CATEGORY_HINTS.filter(({ terms }) =>
    terms.some((term) => normalizedGoal.includes(term))
  ).map(({ key }) => key)

  const recommendedCapabilities = CAPABILITY_HINTS.filter((term) =>
    normalizedGoal.includes(term)
  )

  return {
    intentSummary: sanitizeText(goal),
    searchTerms,
    categories,
    pricingPreference: 'any',
    recommendedCapabilities,
  }
}

function extractJsonObject(text: string): string | null {
  const normalized = String(text || '').trim()

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('{') && normalized.endsWith('}')) {
    return normalized
  }

  const fencedMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim()
    if (candidate.startsWith('{') && candidate.endsWith('}')) {
      return candidate
    }
  }

  const start = normalized.indexOf('{')
  const end = normalized.lastIndexOf('}')

  if (start >= 0 && end > start) {
    return normalized.slice(start, end + 1)
  }

  return null
}

function uniqueNormalized(values: string[], maxItems = 8): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const rawValue of values) {
    const value = sanitizeText(String(rawValue || '')).toLowerCase()

    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    result.push(value)

    if (result.length >= maxItems) {
      break
    }
  }

  return result
}

function safeParseGeminiPlan(payload: unknown, goal: string): GeminiPlan {
  const parsed =
    typeof payload === 'object' && payload !== null
      ? (payload as Partial<GeminiPlan>)
      : {}

  const pricingPreference =
    parsed.pricingPreference === 'free' ||
    parsed.pricingPreference === 'freemium' ||
    parsed.pricingPreference === 'paid' ||
    parsed.pricingPreference === 'enterprise'
      ? parsed.pricingPreference
      : 'any'

  const searchTerms = uniqueNormalized(
    Array.isArray(parsed.searchTerms)
      ? parsed.searchTerms
      : goal.split(/\s+/).filter(Boolean),
    8
  )

  const categories = uniqueNormalized(Array.isArray(parsed.categories) ? parsed.categories : [], 4)
  const recommendedCapabilities = uniqueNormalized(
    Array.isArray(parsed.recommendedCapabilities) ? parsed.recommendedCapabilities : [],
    6
  )

  return {
    intentSummary: sanitizeText(parsed.intentSummary || goal),
    searchTerms,
    categories,
    pricingPreference,
    recommendedCapabilities,
  }
}

async function buildGeminiPlan(goal: string): Promise<GeminiPlan> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Missing Gemini API key.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You classify user goals for an AI tools marketplace. Read the goal and return only compact JSON with:
{
  "intentSummary": string,
  "searchTerms": string[],
  "categories": string[],
  "pricingPreference": "free" | "freemium" | "paid" | "enterprise" | "any",
  "recommendedCapabilities": string[]
}

Rules:
- Be practical and marketplace-oriented.
- Keep searchTerms short and useful for database matching.
- categories should be broad labels like "writing", "video", "coding", "productivity", "marketing", "design", "resume", "research".
- If pricing is unclear, use "any".
- Output JSON only.

User goal:
${goal}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini request failed: ${errorText}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('Gemini returned an empty response.')
    }

    const jsonText = extractJsonObject(text)

    if (!jsonText) {
      throw new Error('Gemini response did not contain JSON.')
    }

    return safeParseGeminiPlan(JSON.parse(jsonText), goal)
  } catch (error) {
    console.error('Gemini plan fallback:', error)
    return buildFallbackPlan(goal)
  } finally {
    clearTimeout(timeout)
  }
}

function scoreTool(tool: ToolCandidate, plan: GeminiPlan): number {
  const haystack = [
    tool.name,
    tool.category,
    ...(Array.isArray(tool.tags) ? tool.tags : []),
    tool.description,
    tool.pricing,
    tool.source,
  ]
    .join(' ')
    .toLowerCase()

  let score = 0

  for (const term of plan.searchTerms) {
    if (tool.name.toLowerCase().includes(term)) score += 7
    if (tool.category.toLowerCase().includes(term)) score += 5
    if ((tool.tags || []).some((item) => item.toLowerCase().includes(term))) score += 5
    if (tool.description.toLowerCase().includes(term)) score += 3
    if (haystack.includes(term)) score += 1
  }

  for (const category of plan.categories) {
    if (tool.category.toLowerCase().includes(category)) score += 6
    if ((tool.tags || []).some((item) => item.toLowerCase().includes(category))) score += 6
    if (tool.description.toLowerCase().includes(category)) score += 2
  }

  for (const capability of plan.recommendedCapabilities) {
    if (tool.description.toLowerCase().includes(capability)) score += 3
    if (tool.name.toLowerCase().includes(capability)) score += 4
  }

  if (plan.pricingPreference !== 'any' && tool.pricing.toLowerCase() === plan.pricingPreference) {
    score += 4
  }

  if (tool.source === 'whatsthatai-original') {
    score += 2
  }

  if (tool.avgRating) {
    score += Math.min(tool.avgRating, 5)
  }

  if (tool.totalReviews > 0) {
    score += Math.min(tool.totalReviews, 10) * 0.2
  }

  return score
}

function buildReason(tool: ToolCandidate, plan: GeminiPlan): string {
  const reasons: string[] = []
  const description = tool.description.toLowerCase()
  const category = tool.category.toLowerCase()
  const tags = (tool.tags || []).join(' ').toLowerCase()

  const matchedCategory = plan.categories.find(
    (item) => category.includes(item) || description.includes(item) || tags.includes(item)
  )
  const matchedCapability = plan.recommendedCapabilities.find(
    (item) => description.includes(item) || tool.name.toLowerCase().includes(item)
  )

  if (matchedCategory) {
    reasons.push(`Strong fit for ${matchedCategory} workflows`)
  }

  if (matchedCapability) {
    reasons.push(`Useful for ${matchedCapability}`)
  }

  if (plan.pricingPreference !== 'any' && tool.pricing.toLowerCase() === plan.pricingPreference) {
    reasons.push(`${tool.pricing} pricing matches your preference`)
  }

  if (!reasons.length && plan.searchTerms.length > 0) {
    reasons.push(`Relevant to ${plan.searchTerms.slice(0, 2).join(' and ')}`)
  }

  return reasons[0] || 'Looks aligned with your goal'
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, {
      key: 'assistant-recommend',
      limit: 20,
      windowMs: 60 * 1000,
      message: 'Too many guide requests. Please try again shortly.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const parsed = assistantRecommendationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const goal = parsed.data.goal
    const plan = await buildGeminiPlan(goal)

    const keywordClauses = plan.searchTerms.flatMap((term) => [
      { name: { contains: term } },
      { category: { contains: term } },
      { description: { contains: term } },
      {
        tagLinks: {
          some: {
            tag: {
              name: { contains: term },
            },
          },
        },
      },
    ])

    const categoryClauses = plan.categories.flatMap((term) => [
      { category: { contains: term } },
      { description: { contains: term } },
      {
        tagLinks: {
          some: {
            tag: {
              name: { contains: term },
            },
          },
        },
      },
    ])

    const pricingFilter =
      plan.pricingPreference === 'free' ||
      plan.pricingPreference === 'freemium' ||
      plan.pricingPreference === 'paid'
        ? { pricing: plan.pricingPreference }
        : {}

    const candidates = await db.tool.findMany({
      where: {
        status: 'approved',
        active: true,
        ...pricingFilter,
        ...(keywordClauses.length || categoryClauses.length
          ? {
              OR: [...keywordClauses, ...categoryClauses],
            }
          : {}),
      },
      include: {
        tagLinks: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      take: 40,
    })

    const fallbackCandidates =
      candidates.length > 0
        ? candidates
        : await db.tool.findMany({
            where: {
              status: 'approved',
              active: true,
            },
            include: {
              tagLinks: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
            take: 40,
          })

    const mappedTools = (await attachRatingsToTools(fallbackCandidates)) as ToolCandidate[]

    const rankedTools = mappedTools
      .map((tool) => ({
        ...tool,
        matchScore: scoreTool(tool, plan),
        reason: buildReason(tool, plan),
      }))
      .filter((tool) => tool.matchScore > 0)
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, 4)

    return NextResponse.json({
      intentSummary: plan.intentSummary,
      assistantMessage:
        rankedTools.length > 0
          ? `I looked at your goal and found a few tools that seem like a strong fit.`
          : `I could not find a confident match yet. Try describing the project in a bit more detail.`,
      tools: rankedTools,
      searchQuery: plan.searchTerms.join(' '),
      categories: plan.categories,
      pricingPreference: plan.pricingPreference,
    })
  } catch (error) {
    console.error('Assistant recommendation error:', error)
    return NextResponse.json(
      { error: 'Could not generate recommendations right now.' },
      { status: 500 }
    )
  }
}

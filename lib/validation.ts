import { z } from 'zod'

export function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const sanitizedString = (min = 1, max = 500) =>
  z
    .string()
    .transform((value) => sanitizeText(value))
    .pipe(z.string().min(min).max(max))

const optionalSanitizedString = (max = 600) =>
  z
    .string()
    .transform((value) => sanitizeText(value))
    .pipe(z.string().max(max))
    .optional()

export const toolSubmissionSchema = z.object({
  name: sanitizedString(2, 120),
  url: z.string().url(),
  description: sanitizedString(2, 500),
  category: sanitizedString(1, 80),
  pricing: z.enum(['free', 'freemium', 'paid', 'enterprise']).optional(),
})

export const reviewSchema = z.object({
  toolId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: optionalSanitizedString(600).default(''),
})

export const reviewDeleteSchema = z.object({
  toolId: z.coerce.number().int().positive(),
})

export const searchSchema = z.object({
  query: sanitizedString(1, 120),
  filter: optionalSanitizedString(80),
})

export const instagramUrlSchema = z.object({
  url: z
    .string()
    .url()
    .refine((value) => {
      try {
        const parsed = new URL(value)
        return ['instagram.com', 'www.instagram.com'].includes(parsed.hostname.toLowerCase())
      } catch {
        return false
      }
    }, 'URL must be a valid Instagram URL'),
})

export const assistantRecommendationSchema = z.object({
  goal: sanitizedString(6, 600),
})

export const onboardingPreferenceSchema = z.object({
  categories: z.array(z.string()).min(1).max(5),
})

export const curatedCollectionSchema = z.object({
  title: sanitizedString(3, 120),
  slug: sanitizedString(3, 160)
    .transform((value) => value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')),
  description: optionalSanitizedString(600).default(''),
  summary: optionalSanitizedString(600).default(''),
  type: z.enum(['starter', 'trending', 'custom']),
  active: z.coerce.boolean().default(true),
  categories: z.array(z.string()).max(5).default([]),
  toolIds: z.array(z.coerce.number().int().positive()).max(12).default([]),
  notesByToolId: z.record(z.string(), z.string()).optional().default({}),
})

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(', ')
}

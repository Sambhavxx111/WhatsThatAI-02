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

const optionalSanitizedString = (max = 300) =>
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
  comment: optionalSanitizedString(300).default(''),
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

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(', ')
}

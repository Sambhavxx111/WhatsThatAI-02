import { createHash, randomBytes } from 'node:crypto'
import { db } from '@/lib/db'
import { sendTransactionalEmail } from '@/lib/mail'

type VerificationTokenType = 'email_verification' | 'admin_mfa'

type VerificationInput = {
  userId?: number | null
  email: string
  type: VerificationTokenType
  rawToken: string
  expiresAt: Date
  metadata?: Record<string, unknown>
}

export function hashOpaqueToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export function createOpaqueToken(size = 32): string {
  return randomBytes(size).toString('hex')
}

export function createNumericCode(length = 6): string {
  const minimum = 10 ** (length - 1)
  const maximum = 10 ** length - 1
  const number = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
  return String(number)
}

export async function clearActiveVerificationTokens(email: string, type: VerificationTokenType) {
  await db.verificationToken.updateMany({
    where: {
      email,
      type,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  })
}

export async function createVerificationTokenRecord(input: VerificationInput) {
  await clearActiveVerificationTokens(input.email, input.type)

  return db.verificationToken.create({
    data: {
      userId: input.userId ?? null,
      email: input.email,
      type: input.type,
      tokenHash: hashOpaqueToken(input.rawToken),
      expiresAt: input.expiresAt,
      metadata: input.metadata ?? null,
    },
  })
}

export async function consumeVerificationToken(input: {
  id?: string | null
  email?: string | null
  type: VerificationTokenType
  rawToken: string
}) {
  const tokenHash = hashOpaqueToken(input.rawToken)
  const now = new Date()

  const token = await db.verificationToken.findFirst({
    where: {
      ...(input.id ? { id: input.id } : {}),
      ...(input.email ? { email: input.email } : {}),
      type: input.type,
      tokenHash,
      consumedAt: null,
      expiresAt: {
        gt: now,
      },
    },
  })

  if (!token) {
    return null
  }

  await db.verificationToken.update({
    where: {
      id: token.id,
    },
    data: {
      consumedAt: now,
    },
  })

  return token
}

export async function sendEmailVerificationEmail(input: {
  email: string
  token: string
  name?: string | null
}) {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(input.token)}`
  const greeting = input.name ? `Hi ${input.name},` : 'Hi,'

  await sendTransactionalEmail({
    to: input.email,
    subject: 'Verify your WhatsThatAI account',
    text: `${greeting}\n\nVerify your email to finish setting up your WhatsThatAI account:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<p>${greeting}</p><p>Verify your email to finish setting up your WhatsThatAI account.</p><p><a href="${verifyUrl}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  })
}

export async function sendAdminMfaEmail(input: {
  email: string
  code: string
  name?: string | null
}) {
  const greeting = input.name ? `Hi ${input.name},` : 'Hi,'

  await sendTransactionalEmail({
    to: input.email,
    subject: 'Your WhatsThatAI admin verification code',
    text: `${greeting}\n\nUse this verification code to finish signing in to the WhatsThatAI admin portal:\n\n${input.code}\n\nThis code expires in 10 minutes.`,
    html: `<p>${greeting}</p><p>Use this verification code to finish signing in to the WhatsThatAI admin portal.</p><p style="font-size:24px;font-weight:700;letter-spacing:0.2em">${input.code}</p><p>This code expires in 10 minutes.</p>`,
  })
}

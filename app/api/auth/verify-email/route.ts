import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consumeVerificationToken } from '@/lib/verification'

export async function GET(request: NextRequest) {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${appUrl}/login?verified=missing`)
  }

  const verificationToken = await consumeVerificationToken({
    type: 'email_verification',
    rawToken: token,
  }).catch(() => null)

  if (!verificationToken) {
    return NextResponse.redirect(`${appUrl}/login?verified=invalid`)
  }

  if (verificationToken.userId) {
    await db.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        emailVerifiedAt: new Date(),
      },
    })
  } else {
    await db.user.updateMany({
      where: {
        email: verificationToken.email,
      },
      data: {
        emailVerifiedAt: new Date(),
      },
    })
  }

  return NextResponse.redirect(`${appUrl}/login?verified=success`)
}

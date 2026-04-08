import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { removeProfileImage, saveProfileImage } from '@/lib/avatar-storage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: 'profile-avatar',
      limit: 20,
      windowMs: 60 * 1000,
      message: 'Too many profile picture updates. Please try again shortly.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Upload must use multipart/form-data.' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const uploaded = formData.get('file') ?? formData.get('avatar')

    if (!(uploaded instanceof File)) {
      return NextResponse.json({ error: 'No profile picture provided.' }, { status: 400 })
    }

    const savedAvatar = await saveProfileImage(uploaded)
    const existingUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        profileImageUrl: true,
      },
    })

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        profileImageUrl: savedAvatar.publicUrl,
      },
    })

    if (existingUser?.profileImageUrl) {
      await removeProfileImage(existingUser.profileImageUrl)
    }

    return NextResponse.json({
      success: true,
      profileImageUrl: savedAvatar.publicUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update profile picture.'
    const status =
      message.includes('allowed') ||
      message.includes('5MB') ||
      message.includes('multipart/form-data') ||
      message.includes('No profile picture')
        ? 400
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const existingUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        profileImageUrl: true,
      },
    })

    if (existingUser?.profileImageUrl) {
      await removeProfileImage(existingUser.profileImageUrl)
    }

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        profileImageUrl: null,
      },
    })

    return NextResponse.json({
      success: true,
      profileImageUrl: null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not remove profile picture.' },
      { status: 500 }
    )
  }
}

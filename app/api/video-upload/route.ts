import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/api-rate-limit'
import { saveTempVideoFile } from '@/lib/upload-security'

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: 'video-upload',
      limit: 10,
      windowMs: 60 * 1000,
      message: 'Too many video uploads. Please wait and try again.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const contentType = request.headers.get('content-type') || ''

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Upload must use multipart/form-data.' }, { status: 400 })
    }

    const formData = await request.formData()
    const uploaded = formData.get('file') ?? formData.get('video')

    if (!(uploaded instanceof File)) {
      return NextResponse.json({ error: 'No video file provided.' }, { status: 400 })
    }

    const savedFile = await saveTempVideoFile(uploaded)

    return NextResponse.json({
      success: true,
      file: {
        name: savedFile.fileName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not upload video.'
    const status =
      message.includes('allowed') ||
      message.includes('50MB') ||
      message.includes('extension') ||
      message.includes('No video file') ||
      message.includes('multipart/form-data')
        ? 400
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}

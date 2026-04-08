import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { getAvatarContentType, getAvatarFilePath } from '@/lib/avatar-storage'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const rawFileName = String(params?.fileName || '')
    const safeFileName = path.basename(rawFileName)

    if (!safeFileName || safeFileName !== rawFileName) {
      return NextResponse.json({ error: 'Invalid avatar file.' }, { status: 400 })
    }

    const filePath = getAvatarFilePath(safeFileName)
    const fileBuffer = await fs.readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': getAvatarContentType(safeFileName),
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Avatar not found.' }, { status: 404 })
  }
}

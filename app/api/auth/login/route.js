import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeUser, setAuthCookie, signAuthToken, verifyPassword } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '')

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const validPassword = await verifyPassword(normalizedPassword, user.password)

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const token = signAuthToken(user)
    const response = NextResponse.json({ success: true, user: sanitizeUser(user) })
    return setAuthCookie(response, token)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Could not log in.' }, { status: 500 })
  }
}

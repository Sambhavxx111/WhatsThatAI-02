import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, sanitizeUser, setAuthCookie, signAuthToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()
    const trimmedName = String(name || '').trim()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '')

    if (!trimmedName || !normalizedEmail || normalizedPassword.length < 6) {
      return NextResponse.json({ error: 'Name, email, and a 6+ character password are required.' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(normalizedPassword)
    const user = await db.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
      },
    })

    const token = signAuthToken(user)
    const response = NextResponse.json({ success: true, user: sanitizeUser(user) })
    return setAuthCookie(response, token)
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 })
  }
}

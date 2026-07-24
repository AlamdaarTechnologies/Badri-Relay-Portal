import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import Admin from '@/models/Admin'
import * as bcrypt from 'bcrypt'
import { signToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const admin = await Admin.findOne({ email })

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Strict Lock Check
    if (admin.inUse && admin.lastHeartbeat) {
      const now = new Date()
      const diff = now.getTime() - new Date(admin.lastHeartbeat).getTime()
      if (diff < 5000) {
        return NextResponse.json({ error: 'Admin account is currently in use' }, { status: 403 })
      }
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET is not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Create session
    const crypto = await import('crypto')
    const sessionToken = crypto.randomBytes(16).toString('hex')

    await Admin.updateOne({ _id: admin._id }, {
      inUse: true,
      lastHeartbeat: new Date(),
      sessionToken
    })

    // Create JWT
    const token = await signToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role || 'admin',
      sessionToken
    }, secret, '7d')

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({ success: true, email: admin.email, role: admin.role || 'admin' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import Admin from '@/models/Admin'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const payload = await verifyToken(token, secret)
    
    await connectToDatabase()
    const admin = await Admin.findById(payload.adminId)

    if (!admin) {
      cookieStore.delete('admin_token')
      return NextResponse.json({ error: 'Invalid admin' }, { status: 401 })
    }

    // Verify session token
    if (admin.sessionToken !== payload.sessionToken) {
      cookieStore.delete('admin_token')
      return NextResponse.json({ error: 'Session overwritten' }, { status: 401 })
    }

    await Admin.updateOne({ _id: admin._id }, {
      inUse: true,
      lastHeartbeat: new Date()
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    // If token invalid, clear it
    const cookieStore = await cookies()
    cookieStore.delete('admin_token')
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}

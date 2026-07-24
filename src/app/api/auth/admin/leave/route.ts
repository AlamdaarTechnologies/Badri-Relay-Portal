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
      return NextResponse.json({ success: true }) // Nothing to do
    }

    const secret = process.env.JWT_SECRET
    if (!secret) return NextResponse.json({ success: true })

    const payload = await verifyToken(token, secret)
    
    await connectToDatabase()
    const admin = await Admin.findById(payload.adminId)

    if (admin && admin.sessionToken === payload.sessionToken) {
      await Admin.updateOne({ _id: admin._id }, {
        inUse: false
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: true }) // Ignore errors on leave
  }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectToDatabase from '@/lib/mongoose'
import Admin from '@/models/Admin'
import { verifyToken } from '@/lib/jwt'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (token) {
    try {
      const secret = process.env.JWT_SECRET
      if (secret) {
        const payload = await verifyToken(token, secret)
        await connectToDatabase()
        await Admin.updateOne({ _id: payload.adminId }, { inUse: false })
      }
    } catch (err) {
      // Token invalid or expired, just continue to delete
    }
  }

  cookieStore.delete('admin_token')
  return NextResponse.json({ success: true })
}

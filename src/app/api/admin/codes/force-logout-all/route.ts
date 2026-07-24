import { NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import AccessCode from '@/models/AccessCode'
import ViewerSession from '@/models/ViewerSession'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

// Helper to verify the caller is an admin
async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null

  const secret = process.env.JWT_SECRET
  if (!secret) return null

  try {
    return await verifyToken(token, secret)
  } catch {
    return null
  }
}

export async function POST() {
  const caller = await verifyAdmin()
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    await connectToDatabase()

    // Delete all viewer sessions
    await ViewerSession.deleteMany({})

    // Reset inUse flag for all access codes
    await AccessCode.updateMany({}, { inUse: false })

    return NextResponse.json({ success: true, message: 'All viewers have been forced logged out.' })
  } catch (error) {
    console.error('Failed to force logout all viewers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

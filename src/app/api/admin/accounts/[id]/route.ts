import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import Admin from '@/models/Admin'
import ViewerSession from '@/models/ViewerSession'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

// Helper to verify the caller is a master admin
async function verifyMasterAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null

  const secret = process.env.JWT_SECRET
  if (!secret) return null

  try {
    const payload = await verifyToken(token, secret)
    if (payload.role !== 'master') return null
    return payload
  } catch {
    return null
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await verifyMasterAdmin()
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    await connectToDatabase()
    const { id } = await params

    // Prevent deleting yourself (the master)
    if (id === caller.adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const admin = await Admin.findById(id)
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Prevent deleting other master admins
    if (admin.role === 'master') {
      return NextResponse.json({ error: 'Cannot delete a master admin' }, { status: 400 })
    }

    await Admin.deleteOne({ _id: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 })
  }
}

// Force logout an admin
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await verifyMasterAdmin()
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    await connectToDatabase()
    const { id } = await params

    await Admin.updateOne({ _id: id }, {
      inUse: false,
      sessionToken: null
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to force logout admin' }, { status: 500 })
  }
}

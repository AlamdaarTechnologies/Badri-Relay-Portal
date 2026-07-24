import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import Admin from '@/models/Admin'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import * as bcrypt from 'bcrypt'

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

export async function GET() {
  const caller = await verifyMasterAdmin()
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    await connectToDatabase()
    const admins = await Admin.find({}).select('-passwordHash -sessionToken').sort({ createdAt: -1 })
    return NextResponse.json(admins)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const caller = await verifyMasterAdmin()
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    await connectToDatabase()
    const { email, password, label } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await Admin.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 409 })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const newAdmin = await Admin.create({
      email,
      passwordHash,
      role: 'admin',
      label: label || null
    })

    return NextResponse.json({
      _id: newAdmin._id,
      email: newAdmin.email,
      role: newAdmin.role,
      label: newAdmin.label,
      inUse: newAdmin.inUse,
      createdAt: newAdmin.createdAt
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}

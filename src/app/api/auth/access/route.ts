import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import AccessCode from '@/models/AccessCode'
import ViewerSession from '@/models/ViewerSession'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const { code } = await req.json()

    if (!code || typeof code !== 'string' || code.length !== 8) {
      return NextResponse.json({ error: 'Invalid ITS Number format' }, { status: 400 })
    }

    // 1. Find the code
    const accessCode = await AccessCode.findOne({ code })

    if (!accessCode) {
      return NextResponse.json({ error: 'Invalid ITS Number' }, { status: 404 })
    }

    // 2. Check if code is disabled or already in use
    if (accessCode.isDisabled) {
      return NextResponse.json({ error: 'This ITS Number has been disabled' }, { status: 403 })
    }
    if (accessCode.inUse) {
      return NextResponse.json({ error: 'Code already in use' }, { status: 403 })
    }

    // 3. Create a new session
    const sessionToken = crypto.randomBytes(32).toString('hex')
    
    await ViewerSession.create({
      accessCodeId: accessCode._id,
      sessionToken,
    })
    
    await AccessCode.updateOne({ _id: accessCode._id }, { inUse: true })

    // 4. Set session cookie (session length, dies when browser closes)
    const cookieStore = await cookies()
    cookieStore.set('viewer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // No maxAge, so it's a session cookie
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ITS Number error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

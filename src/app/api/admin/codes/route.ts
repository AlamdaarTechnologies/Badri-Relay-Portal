import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import AccessCode from '@/models/AccessCode'

import ViewerSession from '@/models/ViewerSession'

export async function GET() {
  try {
    await connectToDatabase()
    const codes = await AccessCode.find({}).sort({ createdAt: -1 })
    
    // Fetch all sessions to calculate real-time online status
    const activeSessions = await ViewerSession.find({})
    const now = Date.now()
    const STALE_THRESHOLD = 2 * 60 * 1000 // 2 minutes
    
    // A code is actually in use if there is a session that has pinged within the last 2 minutes
    const trulyActiveCodes = new Set(
      activeSessions
        .filter(session => {
          if (!session.lastHeartbeat) return false
          return (now - new Date(session.lastHeartbeat).getTime()) < STALE_THRESHOLD
        })
        .map(session => session.code)
    )

    const codesWithRealtimeStatus = codes.map(codeDoc => {
      const code = codeDoc.toObject()
      // Override the database flag with real-time heartbeat data
      code.inUse = trulyActiveCodes.has(code.code)
      return code
    })

    return NextResponse.json(codesWithRealtimeStatus)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const { code, label } = await req.json()
    
    if (!code || typeof code !== 'string' || code.length !== 8 || !/^\d{8}$/.test(code)) {
      return NextResponse.json({ error: 'Code must be exactly 8 digits' }, { status: 400 })
    }

    const existing = await AccessCode.findOne({ code })
    if (existing) {
      return NextResponse.json({ error: 'ITS Number already exists' }, { status: 409 })
    }

    const newCode = await AccessCode.create({
      code,
      label: label || null
    })

    return NextResponse.json(newCode)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import AccessCode from '@/models/AccessCode'
import ViewerSession from '@/models/ViewerSession'

export async function GET() {
  try {
    await connectToDatabase()
    const totalCodes = await AccessCode.countDocuments()
    const sessions = await ViewerSession.find({})
    const now = Date.now()
    const STALE_THRESHOLD = 3 * 1000 // 3 seconds

    // Filter sessions to only those that have pinged in the last 3 seconds
    const activeSessionsArray = sessions.filter(s => {
      if (!s.lastHeartbeat) return false
      return (now - new Date(s.lastHeartbeat).getTime()) < STALE_THRESHOLD
    })

    const activeSessionsCount = activeSessionsArray.length
    
    // Unique codes currently in use
    const uniqueActiveCodeIds = new Set(
      activeSessionsArray.map(s => s.accessCodeId.toString())
    )
    const activeCodesCount = uniqueActiveCodeIds.size

    return NextResponse.json({
      totalCodes,
      activeSessions: activeSessionsCount,
      activeCodesCount
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

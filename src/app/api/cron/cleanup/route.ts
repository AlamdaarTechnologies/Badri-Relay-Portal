import { NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import ViewerSession from '@/models/ViewerSession'
import AccessCode from '@/models/AccessCode'

// Optional: you can add a CRON_SECRET check here as recommended by Vercel
// to ensure only Vercel Cron can trigger this endpoint.
export async function GET(request: Request) {
  try {
    await connectToDatabase()
    const authHeader = request.headers.get('authorization')
    const CRON_SECRET = process.env.CRON_SECRET

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Find all sessions where lastHeartbeat is older than 5 seconds ago
    const fiveSecondsAgo = new Date(Date.now() - 5000)

    const staleSessions = await ViewerSession.find({
      lastHeartbeat: { $lt: fiveSecondsAgo }
    })

    if (staleSessions.length === 0) {
      return NextResponse.json({ success: true, message: 'No stale sessions found' })
    }

    const accessCodeIds = staleSessions.map(s => s.accessCodeId)
    const sessionIds = staleSessions.map(s => s._id)

    // 2. Delete sessions and mark codes as available
    await ViewerSession.deleteMany({ _id: { $in: sessionIds } })
    await AccessCode.updateMany(
      { _id: { $in: accessCodeIds } },
      { inUse: false }
    )

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${staleSessions.length} stale sessions`
    })
  } catch (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

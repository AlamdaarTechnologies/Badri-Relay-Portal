import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import ViewerSession from '@/models/ViewerSession'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('viewer_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    const session = await ViewerSession.findOne({ sessionToken })

    if (!session) {
      // Clear invalid cookie
      cookieStore.delete('viewer_session')
      return NextResponse.json({ error: 'Session not found' }, { status: 401 })
    }

    // Update lastHeartbeat
    await ViewerSession.updateOne(
      { _id: session._id },
      { lastHeartbeat: new Date() }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

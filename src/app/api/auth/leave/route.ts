import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import ViewerSession from '@/models/ViewerSession'
import AccessCode from '@/models/AccessCode'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('viewer_session')?.value

    if (sessionToken) {
      const session = await ViewerSession.findOne({ sessionToken })

      if (session) {
        await ViewerSession.deleteOne({ _id: session._id })
        await AccessCode.updateOne({ _id: session.accessCodeId }, { inUse: false })
      }
      
      cookieStore.delete('viewer_session')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

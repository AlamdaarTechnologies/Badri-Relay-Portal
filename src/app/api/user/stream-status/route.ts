import { NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import LiveStream from '@/models/LiveStream'

export async function GET() {
  try {
    await connectToDatabase()
    const stream = await LiveStream.findOne({ isVisible: true }).sort({ createdAt: -1 })

    return NextResponse.json({ 
      isLive: !!stream,
      stream: stream ? {
        title: stream.title,
        type: stream.type || 'rtmp',
        externalUrl: stream.externalUrl
      } : null
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}

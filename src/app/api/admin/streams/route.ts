import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import LiveStream from '@/models/LiveStream'

export async function GET() {
  try {
    await connectToDatabase()
    const streams = await LiveStream.find({}).sort({ createdAt: -1 })
    return NextResponse.json(streams)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const existingStreamCount = await LiveStream.countDocuments()
    if (existingStreamCount >= 1) {
      return NextResponse.json({ error: 'Only one stream can exist at a time. Delete the existing stream first.' }, { status: 400 })
    }

    const { title, streamKey, type = 'rtmp', externalUrl } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (type === 'rtmp' && !streamKey) {
      return NextResponse.json({ error: 'Stream key is required for RTMP streams' }, { status: 400 })
    }

    if (type === 'external' && !externalUrl) {
      return NextResponse.json({ error: 'External URL is required for external streams' }, { status: 400 })
    }

    // For external streams, we just generate a dummy stream key since it's required and unique in schema
    const crypto = await import('crypto')
    const finalStreamKey = type === 'external' ? crypto.randomBytes(16).toString('hex') : streamKey

    const stream = await LiveStream.create({
      title, 
      streamKey: finalStreamKey,
      type,
      externalUrl: type === 'external' ? externalUrl : undefined
    })

    return NextResponse.json(stream)
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Stream key already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 })
  }
}

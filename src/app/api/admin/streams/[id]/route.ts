import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import LiveStream from '@/models/LiveStream'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await req.json()
    const stream = await LiveStream.findOneAndUpdate({ _id: id }, body, { new: true })
    return NextResponse.json(stream)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    await LiveStream.deleteOne({ _id: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 })
  }
}

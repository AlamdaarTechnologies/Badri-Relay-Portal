import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import AccessCode from '@/models/AccessCode'
import ViewerSession from '@/models/ViewerSession'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    await AccessCode.deleteOne({ _id: id })
    await ViewerSession.deleteMany({ accessCodeId: id })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete code' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const { isDisabled } = await req.json()
    
    await AccessCode.updateOne({ _id: id }, { isDisabled })
    
    if (isDisabled) {
      await AccessCode.updateOne({ _id: id }, { inUse: false })
      await ViewerSession.deleteMany({ accessCodeId: id })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update code status' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    
    await AccessCode.updateOne({ _id: id }, { inUse: false })
    await ViewerSession.deleteMany({ accessCodeId: id })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to force logout' }, { status: 500 })
  }
}

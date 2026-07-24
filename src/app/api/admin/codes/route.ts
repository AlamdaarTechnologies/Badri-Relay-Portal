import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import AccessCode from '@/models/AccessCode'

export async function GET() {
  try {
    await connectToDatabase()
    const codes = await AccessCode.find({}).sort({ createdAt: -1 })
    return NextResponse.json(codes)
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

import { NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import AccessCode from '@/models/AccessCode'
import ViewerSession from '@/models/ViewerSession'

export async function GET() {
  try {
    await connectToDatabase()
    const totalCodes = await AccessCode.countDocuments()
    const activeSessions = await ViewerSession.countDocuments()
    
    // We consider "used codes" as those currently inUse
    const activeCodesCount = await AccessCode.countDocuments({ inUse: true })

    return NextResponse.json({
      totalCodes,
      activeSessions,
      activeCodesCount
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

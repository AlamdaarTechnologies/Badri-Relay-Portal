import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Protect Viewer Routes
  if (pathname.startsWith('/user/live')) {
    const viewerSession = request.cookies.get('viewer_session')?.value
    
    if (!viewerSession) {
      return NextResponse.redirect(new URL('/user', request.url))
    }
    return NextResponse.next()
  }

  // 2. Protect Admin Routes (except login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('admin_token')?.value

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const secret = process.env.JWT_SECRET
      if (!secret) throw new Error('No secret')
        
      const { payload } = await jwtVerify(adminToken, new TextEncoder().encode(secret))
      
      // Protect /admin/accounts - only master admins
      if (pathname.startsWith('/admin/accounts') && payload.role !== 'master') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      
      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/user/live/:path*',
    '/admin/:path*',
  ],
}

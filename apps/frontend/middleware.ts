import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_FILE = /(.*)\.(.*)$/
const AUTH_PATHS = ['/auth', '/auth/login', '/auth/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public files, _next, api and favicons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/' + 'favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Allow auth routes
  // If user is already authenticated, prevent access to auth pages (login/register)
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get('accessToken')?.value
    if (token) {
      // redirect authenticated users away from auth pages to home
      const homeUrl = new URL('/', req.url)
      return NextResponse.redirect(homeUrl)
    }

    return NextResponse.next()
  }

  // Check cookie for accessToken
  const token = req.cookies.get('accessToken')?.value

  if (!token) {
    // Redirect to login without rendering protected page
    const loginUrl = new URL('/auth/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}

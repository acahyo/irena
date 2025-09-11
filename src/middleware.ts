import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  const employeeSession = request.cookies.get('employee-session');
  const { pathname } = request.nextUrl;

  // If trying to access dashboard pages without an admin session, redirect to admin login
  if (pathname.startsWith('/dashboard') && !adminSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If trying to access portal pages without an employee session, redirect to employee login
  if (pathname.startsWith('/portal') && !employeeSession) {
    return NextResponse.redirect(new URL('/login/employee', request.url));
  }

  // If already logged in as admin and trying to access a login page, redirect to dashboard
  if ((pathname === '/' || pathname.startsWith('/login')) && adminSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If already logged in as employee and trying to access a login page, redirect to portal
   if ((pathname === '/' || pathname.startsWith('/login')) && employeeSession) {
      return NextResponse.redirect(new URL('/portal', request.url));
  }


  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

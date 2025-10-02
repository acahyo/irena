
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getEmployee } from './actions/employees';

export async function middleware(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  const employeeSessionCookie = request.cookies.get('employee-session');
  const { pathname } = request.nextUrl;

  // If trying to access dashboard pages without an admin session, redirect to admin login
  if (pathname.startsWith('/dashboard') && !adminSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If trying to access portal pages without an employee session, redirect to employee login
  if (pathname.startsWith('/portal') && !employeeSessionCookie) {
    return NextResponse.redirect(new URL('/login/employee', request.url));
  }

  // If trying to access driver-dashboard pages without an employee session, redirect to driver login
  if (pathname.startsWith('/driver-dashboard') && !employeeSessionCookie) {
    return NextResponse.redirect(new URL('/login/driver', request.url));
  }
  
  // If trying to access pj-dashboard pages without an employee session, redirect to pj login
  if (pathname.startsWith('/pj-dashboard') && !employeeSessionCookie) {
    return NextResponse.redirect(new URL('/login/pj', request.url));
  }

  // If already logged in as admin and trying to access a login page, redirect to dashboard
  if ((pathname === '/' || pathname.startsWith('/login')) && adminSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If already logged in as employee/driver/pj and trying to access a login page
   if ((pathname === '/' || pathname.startsWith('/login')) && employeeSessionCookie) {
        try {
            const sessionData = JSON.parse(employeeSessionCookie.value);
            const roles = sessionData.roles || [];
            
            if (pathname.startsWith('/login/driver') && roles.includes('Driver LV Office')) {
                return NextResponse.redirect(new URL('/driver-dashboard', request.url));
            }
             if (pathname.startsWith('/login/pj') && roles.includes('PJ')) {
                return NextResponse.redirect(new URL('/pj-dashboard', request.url));
            }
             if (pathname.startsWith('/login/employee') && !roles.includes('Driver LV Office') && !roles.includes('PJ')) {
                return NextResponse.redirect(new URL('/portal', request.url));
            }
             if (pathname === '/') {
                 if (roles.includes('Driver LV Office')) {
                    return NextResponse.redirect(new URL('/driver-dashboard', request.url));
                } else if (roles.includes('PJ')) {
                    return NextResponse.redirect(new URL('/pj-dashboard', request.url));
                } else {
                    return NextResponse.redirect(new URL('/portal', request.url));
                }
             }

        } catch (e) {
             // Invalid cookie, let it proceed to be handled by page logic (which will redirect)
             return NextResponse.next();
        }
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

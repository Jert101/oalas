import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // If no token and trying to access protected routes, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Role-based dashboard redirections
    if (pathname === '/dashboard' || pathname === '/teacher/dashboard') {
      if (token?.role === 'Admin') {
        return NextResponse.redirect(new URL('/admin/console', req.url))
      }
      if (token?.role === 'Dean/Program Head') {
        return NextResponse.redirect(new URL('/dean/dashboard', req.url))
      }
      if (token?.role === 'Finance Officer') {
        return NextResponse.redirect(new URL('/finance/dashboard', req.url))
      }
      // Teachers stay at /teacher/dashboard
    }

    // Admin-only routes
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'Admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Finance department routes
    if (pathname.startsWith('/finance')) {
      if (token?.role !== 'Finance Officer' && token?.role !== 'Admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Dean/Program Head routes
    if (pathname.startsWith('/dean')) {
      if (token?.role !== 'Dean/Program Head' && token?.role !== 'Admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Teacher routes
    if (pathname.startsWith('/teacher')) {
      if (token?.role !== 'Teacher/Instructor' && !['Admin'].includes(token?.role || '')) {
        // Redirect to their appropriate dashboard
        if (token?.role === 'Finance Officer') {
          return NextResponse.redirect(new URL('/finance/dashboard', req.url))
        } else if (token?.role === 'Dean/Program Head') {
          return NextResponse.redirect(new URL('/dean/dashboard', req.url))
        } else if (token?.role === 'Admin') {
          return NextResponse.redirect(new URL('/admin/console', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login and public pages without token
        const pathname = req.nextUrl.pathname
        if (pathname.startsWith('/auth') || 
            pathname === '/' || 
            pathname.startsWith('/api/auth')) {
          return true
        }

        // Check if user has token for protected routes
        return !!token
      }
    }
  }
)

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

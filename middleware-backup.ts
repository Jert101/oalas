import { withAuth     // Admin routes
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'Admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Finance department routes
    if (pathname.startsWith('/finance')) {
      if (token?.role !== 'Finance Department' && token?.role !== 'Admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Dean/Program Head routes
    if (pathname.startsWith('/dean')) {
      if (token?.role !== 'Dean/Program Head' && token?.role !== 'Admin') {/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // If no token and trying to access protected routes, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirect admin users from regular dashboard to admin console
    if (pathname === '/dashboard' && token?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/console', req.url))
    }

    // Admin-only routes
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Finance department routes
    if (pathname.startsWith('/finance')) {
      if (token?.role !== 'FINANCE_DEPARTMENT' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Dean/Program Head routes
    if (pathname.startsWith('/dean')) {
      if (token?.role !== 'DEAN_PROGRAM_HEAD' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login and public pages without token
        const pathname = req.nextUrl.pathname
        if (pathname.startsWith('/login') || 
            pathname.startsWith('/auth') || 
            pathname === '/' || 
            pathname.startsWith('/api/auth')) {
          return true
        }
        // For protected routes, require token
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/finance/:path*', 
    '/dean/:path*',
    '/dashboard'
  ]
}

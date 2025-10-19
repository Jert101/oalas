import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    
    // Public routes allowed without auth (must run BEFORE token checks)
    if (pathname.startsWith('/auth') || 
        pathname === '/' || 
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/account')) {
      return NextResponse.next()
    }

    // If no token and trying to access protected routes, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    // EMERGENCY ROUTING: Handle Maintenance Office immediately  
    if (token?.role === 'Maintenance Office' && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dean/dashboard', req.url))
    }
    
    console.log("[Middleware] Token data:", {
      email: token.email,
      role: token.role,
      roleType: typeof token.role,
      roleLength: token.role?.length,
      isDepartmentHead: (token as any)?.isDepartmentHead,
      isDepartmentHeadType: typeof (token as any)?.isDepartmentHead,
      pathname: pathname,
      allTokenKeys: Object.keys(token || {})
    })

    // If already authenticated and hitting public entry points, send to role dashboard
    if (pathname === '/' || pathname === '/login') {
      // Send to centralized dashboard first; role mapping happens below
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Role-based dashboard redirections
    if (pathname === '/dashboard') {
      if (token?.role === 'Admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      
      // PRIORITY: Check specific role-based routing FIRST (before general isDepartmentHead check)
      if (token?.role === 'Finance Department' || token?.role === 'Finance Officer' || token?.role === 'Finance Office Head') {
        console.log("[Middleware] 💰 Finance role detected - redirecting to finance dashboard:", {
          role: token?.role,
          redirectingTo: '/finance/dashboard'
        })
        return NextResponse.redirect(new URL('/finance/dashboard', req.url))
      }
      
      if (token?.role === 'Teacher/Instructor' || token?.role === 'Teacher') {
        return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
      }
      
      // Non-teaching staff routing (Office Clerk + all Non Teaching Staff category roles)
      const nonTeachingRoles = ['Office Clerk'] // Will be expanded based on admin/roles Non Teaching Staff category
      if (nonTeachingRoles.includes(token?.role || '')) {
        console.log("[Middleware] 🏢 Non-teaching staff detected - redirecting to non-teaching dashboard:", {
          role: token?.role,
          redirectingTo: '/non-teaching-staff/dashboard'
        })
        return NextResponse.redirect(new URL('/non-teaching-staff/dashboard', req.url))
      }
      // Office Head routing (users with isDepartmentHead: true)
      if ((token as any)?.isDepartmentHead === true) {
        console.log("[Middleware] ✅ Office head detected - redirecting to office-head dashboard:", {
          role: token?.role,
          isDepartmentHead: (token as any)?.isDepartmentHead,
          redirectingTo: '/office-head/dashboard'
        })
        return NextResponse.redirect(new URL('/office-head/dashboard', req.url))
      }
      
      if (token?.role === 'Dean/Program Head' || token?.role === 'Department Head') {
        return NextResponse.redirect(new URL('/dean/dashboard', req.url))
      }
      
      // Default to teacher dashboard
      console.log("[Middleware] 📍 Default routing - redirecting to teacher dashboard:", {
        role: token?.role,
        reason: 'No specific role match found'
      })
      return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
    }

    // Admin-only routes
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
      // EMERGENCY ACCESS: Always allow Maintenance Office
      if (token?.role === 'Maintenance Office') {
        console.log("[Middleware] 🚨 EMERGENCY ACCESS: Maintenance Office granted dean access")
        return NextResponse.next()
      }
      
      // Allow admin, dean/program head, department head, and any office head
      const isDean = token?.role === 'Dean/Program Head' || token?.role === 'Department Head'
      const isAdmin = token?.role === 'Admin'
      const isOfficeHead = (token as any)?.isDepartmentHead // Any role marked as office head
      
      // FALLBACK: Allow specific Non Teaching Staff roles
      const nonTeachingOfficeRoles = [
        'Guidance Office', 'Registrar Office', 'Maintenance Office', 
        'Administrative Assistant', 'Library Staff', 'IT Support',
        'Security Office', 'Clinic Staff', 'Accounting Office'
      ]
      const isFallbackOfficeRole = nonTeachingOfficeRoles.includes(token?.role || '')
      
      console.log("[Middleware] Dean route access check:", {
        pathname,
        role: token?.role,
        isDean,
        isAdmin,
        isOfficeHead: isOfficeHead,
        isFallbackOfficeRole,
        isDepartmentHead: (token as any)?.isDepartmentHead
      })
      
      if (!isDean && !isAdmin && !isOfficeHead && !isFallbackOfficeRole) {
        console.log("[Middleware] Access denied to dean route for:", token?.role)
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Teacher routes
    if (pathname.startsWith('/teacher')) {
      if ((token?.role !== 'Teacher/Instructor' && token?.role !== 'Teacher') && !['Admin'].includes(token?.role || '')) {
        // Redirect to their appropriate dashboard
        if (token?.role === 'Finance Department') {
          return NextResponse.redirect(new URL('/finance/dashboard', req.url))
        } else if (token?.role === 'Dean/Program Head') {
          return NextResponse.redirect(new URL('/dean/dashboard', req.url))
        } else if (token?.role === 'Admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        }
      }
    }

    // Non-teaching staff routes (Office Clerk + all Non Teaching Staff category roles)
    if (pathname.startsWith('/non-teaching-staff')) {
      const nonTeachingRoles = ['Office Clerk'] // Will be expanded based on admin/roles Non Teaching Staff category
      if (!nonTeachingRoles.includes(token?.role || '') && token?.role !== 'Admin') {
        // Redirect to their appropriate dashboard
        if (token?.role === 'Finance Department') {
          return NextResponse.redirect(new URL('/finance/dashboard', req.url))
        } else if (token?.role === 'Dean/Program Head') {
          return NextResponse.redirect(new URL('/dean/dashboard', req.url))
        } else if (token?.role === 'Admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (token?.role === 'Teacher/Instructor') {
          return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
        }
      }
    }

    // Office-head routes (users with isDepartmentHead: true)
    if (pathname.startsWith('/office-head')) {
      const isOfficeHead = (token as any)?.isDepartmentHead === true
      const isAdmin = token?.role === 'Admin'
      
      if (!isOfficeHead && !isAdmin) {
        console.log("[Middleware] Access denied to office-head route for:", token?.role)
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        console.log("[Middleware] 🔍 AUTHORIZED CALLBACK:", {
          pathname: pathname,
          hasToken: !!token,
          tokenRole: token?.role,
          tokenEmail: token?.email
        })
        
        // Allow access to login and public pages without token
        if (pathname.startsWith('/auth') || 
            pathname === '/' || 
            pathname.startsWith('/api/auth') ||
            pathname.startsWith('/api/account')) {
          console.log("[Middleware] ✅ Public route allowed:", pathname)
          return true
        }

        // Check if user has token for protected routes
        const hasValidToken = !!token
        console.log("[Middleware] 🔍 Protected route check:", {
          pathname: pathname,
          hasValidToken: hasValidToken,
          result: hasValidToken ? 'ALLOWED' : 'DENIED'
        })
        
        return hasValidToken
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

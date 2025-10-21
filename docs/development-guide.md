# Development Guide - OALASS

## Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **MySQL**: 8.0 or higher
- **Git**: Latest version

### Development Tools
- **Code Editor**: VS Code (recommended)
- **Database Client**: MySQL Workbench or similar
- **API Testing**: Postman or Insomnia
- **Version Control**: Git

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd oalass
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/oalass"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Service (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# WebSocket Server
WEBSOCKET_SERVER_URL="http://localhost:3001"
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with initial data
npm run db:seed:admin
npm run db:seed:leave-fields
```

### 5. Start Development Servers
```bash
# Start both Next.js and WebSocket server
npm run dev:full

# Or start individually:
# Next.js app (port 3000)
npm run dev

# WebSocket server (port 3001)
node websocket-server.js
```

## Development Workflow

### Code Organization

#### File Structure Standards
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   └── [role]/            # Role-based pages
├── components/            # Reusable components
│   ├── ui/                # Base UI components
│   └── [feature]/         # Feature-specific components
├── lib/                   # Utilities and services
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

#### Naming Conventions
- **Files**: kebab-case (e.g., `leave-application.tsx`)
- **Components**: PascalCase (e.g., `LeaveApplicationForm`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types**: PascalCase (e.g., `UserRole`)

### API Development

#### Creating API Routes
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Your logic here
    return NextResponse.json({ success: true, data: {} })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### API Route Patterns
- **Authentication**: Always check session first
- **Authorization**: Verify user roles and permissions
- **Validation**: Use Zod schemas for input validation
- **Error Handling**: Consistent error response format
- **Logging**: Log errors for debugging

### Database Development

#### Prisma Schema Changes
```bash
# 1. Modify schema.prisma
# 2. Generate migration
npx prisma migrate dev --name migration_name

# 3. Generate Prisma client
npx prisma generate
```

#### Database Seeding
```bash
# Seed admin users
npm run db:seed:admin

# Seed leave types
npm run db:seed:leave-fields

# Seed finance data
npm run db:seed:finance
```

#### Query Optimization
```typescript
// Good: Include related data
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    department: true,
    role: true,
    leaveApplications: true
  }
})

// Good: Use select for specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    department: { select: { name: true } }
  }
})
```

### Component Development

#### Creating Components
```typescript
// src/components/example-component.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ExampleComponentProps {
  title: string
  onSubmit: (data: any) => void
}

export function ExampleComponent({ title, onSubmit }: ExampleComponentProps) {
  const [value, setValue] = useState('')

  return (
    <div className="space-y-4">
      <h2>{title}</h2>
      <Input 
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button onClick={() => onSubmit({ value })}>
        Submit
      </Button>
    </div>
  )
}
```

#### Component Best Practices
- **Props Interface**: Always define TypeScript interfaces
- **Default Props**: Use default parameters for optional props
- **Error Boundaries**: Wrap components that might fail
- **Accessibility**: Include ARIA labels and keyboard navigation
- **Performance**: Use React.memo for expensive components

### Form Development

#### Using React Hook Form
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: FormData) => {
    // Handle form submission
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### Real-time Development

#### WebSocket Integration
```typescript
// src/hooks/use-realtime.ts
import { useEffect, useState } from 'react'

export function useRealtime(event: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!)
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', event }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setData(data)
      setLoading(false)
    }

    return () => ws.close()
  }, [event])

  return { data, loading }
}
```

## Testing

### Unit Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### API Testing
```typescript
// tests/api/auth.test.ts
import { POST } from '@/app/api/auth/signin/route'

describe('/api/auth/signin', () => {
  it('should authenticate valid user', async () => {
    const request = new Request('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### Component Testing
```typescript
// tests/components/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from '@/components/login-form'

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn()
    render(<LoginForm onSubmit={mockSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(mockSubmit).toHaveBeenCalled()
  })
})
```

## Debugging

### Development Tools
- **React DevTools**: Component inspection
- **Next.js DevTools**: Performance monitoring
- **Prisma Studio**: Database inspection
- **WebSocket Inspector**: Real-time debugging

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
npm run db:push

# Reset database
npm run db:reset
```

#### Authentication Issues
```typescript
// Debug session
console.log('Session:', session)
console.log('User:', session?.user)
console.log('Role:', session?.user?.role)
```

#### WebSocket Connection Issues
```typescript
// Check WebSocket connection
const ws = new WebSocket('ws://localhost:3001')
ws.onopen = () => console.log('Connected')
ws.onerror = (error) => console.error('WebSocket error:', error)
```

## Code Quality

### Linting and Formatting
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Git Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

## Deployment

### Local Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

### Environment Variables for Production
```bash
# Database
DATABASE_URL="mysql://user:pass@host:port/db"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret"

# Email
RESEND_API_KEY="production-resend-key"
FROM_EMAIL="noreply@yourdomain.com"

# WebSocket
WEBSOCKET_SERVER_URL="https://ws.yourdomain.com"
```

### Database Migration
```bash
# Deploy migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load components
const AdminDashboard = dynamic(() => import('@/components/admin-dashboard'), {
  loading: () => <div>Loading...</div>
})
```

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/profile-picture.jpg"
  alt="Profile Picture"
  width={100}
  height={100}
  priority
/>
```

### Database Optimization
```typescript
// Use indexes for frequently queried fields
// Limit data with select
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  },
  take: 20,
  skip: 0
})
```

## Security Best Practices

### Input Validation
```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  role: z.enum(['admin', 'teacher', 'dean'])
})

// Validate input
const validatedData = userSchema.parse(requestBody)
```

### Authentication Checks
```typescript
// Always check authentication
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Check user roles
const allowedRoles = ['admin', 'dean']
if (!allowedRoles.includes(session.user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### SQL Injection Prevention
```typescript
// Use Prisma ORM (prevents SQL injection)
const user = await prisma.user.findUnique({
  where: { email: userEmail } // Safe parameterized query
})

// Never use raw SQL with user input
// BAD: `SELECT * FROM users WHERE email = '${userEmail}'`
```

## Troubleshooting

### Common Development Issues

#### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

#### Database Connection Failed
```bash
# Check MySQL service
sudo service mysql status

# Restart MySQL
sudo service mysql restart
```

#### Prisma Client Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset Prisma client
rm -rf node_modules/.prisma
npm install
```

#### WebSocket Connection Failed
```bash
# Check WebSocket server
node websocket-server.js

# Check port availability
netstat -tulpn | grep 3001
```

### Performance Issues

#### Slow Database Queries
- Check database indexes
- Use `select` to limit fields
- Implement pagination
- Use database query logging

#### Memory Leaks
- Check for unclosed WebSocket connections
- Clear intervals and timeouts
- Use React DevTools Profiler
- Monitor memory usage

#### Bundle Size Issues
- Use dynamic imports
- Remove unused dependencies
- Optimize images
- Use tree shaking

## Getting Help

### Documentation Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community Support
- GitHub Issues for bug reports
- Stack Overflow for questions
- Discord/Slack for real-time help
- Code reviews for best practices

### Internal Resources
- Code review process
- Team coding standards
- Architecture decisions
- Performance benchmarks

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function TestFinancePage() {
  const [testResults, setTestResults] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // Test 1: Check if API endpoint exists
      console.log('🧪 Test 1: Checking API endpoint...')
      const response = await fetch('/api/finance/reports?type=summary')
      results.apiEndpoint = {
        status: response.status,
        ok: response.ok,
        message: response.status === 401 ? 'API working (auth required)' : 
                response.status === 200 ? 'API working' : 'API error'
      }

      // Test 2: Check authentication
      console.log('🧪 Test 2: Checking authentication...')
      const authResponse = await fetch('/api/auth/session')
      const session = await authResponse.json()
      results.authentication = {
        hasSession: !!session?.user,
        userRole: session?.user?.role || 'Not logged in',
        message: session?.user ? `Logged in as ${session.user.name}` : 'Not logged in'
      }

      // Test 3: Check if user has finance role
      const allowedRoles = ['Finance Department', 'Finance Officer', 'Finance Office Head', 'Admin']
      results.roleAccess = {
        hasAccess: allowedRoles.includes(session?.user?.role),
        userRole: session?.user?.role,
        message: allowedRoles.includes(session?.user?.role) ? 
                'Has finance access' : 'No finance access - need to login with finance account'
      }

      // Test 4: Check database connection (if authenticated)
      if (results.roleAccess.hasAccess) {
        console.log('🧪 Test 4: Checking database connection...')
        try {
          const dbResponse = await fetch('/api/finance/reports?type=summary')
          results.database = {
            status: dbResponse.status,
            ok: dbResponse.ok,
            message: dbResponse.ok ? 'Database connected' : 'Database error'
          }
        } catch (error) {
          results.database = {
            status: 'error',
            ok: false,
            message: 'Database connection failed'
          }
        }
      }

    } catch (error) {
      results.error = {
        message: 'Test failed: ' + error.message
      }
    }

    setTestResults(results)
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'working':
        return 'bg-green-100 text-green-800'
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Finance Reports System Test</h1>
        <p className="text-muted-foreground">
          This page helps diagnose issues with the Finance Reports system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runTests} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run System Tests'
              )}
            </Button>

            {Object.keys(testResults).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results:</h3>
                
                {testResults.apiEndpoint && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.apiEndpoint.ok ? 'ok' : 'error')}
                      <span className="font-medium">API Endpoint</span>
                    </div>
                    <Badge className={getStatusColor(testResults.apiEndpoint.ok ? 'ok' : 'error')}>
                      {testResults.apiEndpoint.message}
                    </Badge>
                  </div>
                )}

                {testResults.authentication && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.authentication.hasSession ? 'ok' : 'error')}
                      <span className="font-medium">Authentication</span>
                    </div>
                    <Badge className={getStatusColor(testResults.authentication.hasSession ? 'ok' : 'error')}>
                      {testResults.authentication.message}
                    </Badge>
                  </div>
                )}

                {testResults.roleAccess && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.roleAccess.hasAccess ? 'ok' : 'error')}
                      <span className="font-medium">Role Access</span>
                    </div>
                    <Badge className={getStatusColor(testResults.roleAccess.hasAccess ? 'ok' : 'error')}>
                      {testResults.roleAccess.message}
                    </Badge>
                  </div>
                )}

                {testResults.database && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.database.ok ? 'ok' : 'error')}
                      <span className="font-medium">Database</span>
                    </div>
                    <Badge className={getStatusColor(testResults.database.ok ? 'ok' : 'error')}>
                      {testResults.database.message}
                    </Badge>
                  </div>
                )}

                {testResults.error && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Error</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      {testResults.error.message}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔧 Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Check Authentication</h4>
              <p className="text-sm text-muted-foreground">
                Make sure you're logged in with a finance account:
              </p>
              <ul className="text-sm text-muted-foreground ml-4 mt-2">
                <li>• Email: finance.officer@ckcm.edu</li>
                <li>• Password: password123</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Check Database</h4>
              <p className="text-sm text-muted-foreground">
                Run the seeder to ensure test data exists:
              </p>
              <code className="block bg-gray-100 p-2 rounded mt-2 text-sm">
                npm run db:seed:finance
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Check Server</h4>
              <p className="text-sm text-muted-foreground">
                Make sure the development server is running:
              </p>
              <code className="block bg-gray-100 p-2 rounded mt-2 text-sm">
                npm run dev
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Access Reports</h4>
              <p className="text-sm text-muted-foreground">
                Navigate to the finance reports page:
              </p>
              <a 
                href="/finance/reports" 
                className="block text-blue-600 hover:underline mt-2"
              >
                http://localhost:3000/finance/reports
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

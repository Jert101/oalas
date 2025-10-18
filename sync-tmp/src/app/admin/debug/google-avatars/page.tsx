'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TestTube, BarChart3 } from 'lucide-react'

interface AvatarStats {
  totalUsers: number
  usersWithGooglePics: number
  usersWithFallback: number
  googlePictureStats: {
    total: number
    averageLength: number
    maxLength: number
    problematicCount: number
  }
  problematicUrls: Array<{
    email: string
    length: number
    isLong: boolean
  }>
}

export default function GoogleAvatarsDebugPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<AvatarStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/google-avatars?action=status')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch avatar stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const testCurrentUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/google-avatars?action=test')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error('Failed to test current user:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshCurrentUser = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/debug/google-avatars?action=refresh')
      const data = await response.json()
      setTestResult(data)
      // Refresh stats after updating
      fetchStats()
    } catch (error) {
      console.error('Failed to refresh current user:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'Admin') {
      fetchStats()
    }
  }, [session])

  if (session?.user?.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Admin access required</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google Avatars Debug</h1>
          <p className="text-muted-foreground">Monitor and test Google profile picture handling</p>
        </div>
        <Button onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Google Pictures</CardTitle>
              <Badge variant="secondary">{stats.usersWithGooglePics}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.googlePictureStats.total}</div>
              <p className="text-xs text-muted-foreground">
                Avg length: {stats.googlePictureStats.averageLength} chars
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallback Pictures</CardTitle>
              <Badge variant={stats.usersWithFallback > stats.usersWithGooglePics ? "destructive" : "secondary"}>
                {stats.usersWithFallback}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersWithFallback}</div>
              <p className="text-xs text-muted-foreground">Using /ckcm.png</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problematic URLs</CardTitle>
              <Badge variant={stats.googlePictureStats.problematicCount > 0 ? "destructive" : "default"}>
                {stats.googlePictureStats.problematicCount}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.googlePictureStats.problematicCount}</div>
              <p className="text-xs text-muted-foreground">
                Max: {stats.googlePictureStats.maxLength} chars
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Current User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testCurrentUser} disabled={loading}>
                <TestTube className="mr-2 h-4 w-4" />
                Test Fetch
              </Button>
              <Button onClick={refreshCurrentUser} disabled={refreshing} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Force Refresh
              </Button>
            </div>

            {testResult && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {stats && stats.problematicUrls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Problematic URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.problematicUrls.map((url, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="truncate max-w-[200px]">{url.email}</span>
                    <Badge variant="destructive">{url.length} chars</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}






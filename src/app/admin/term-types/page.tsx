"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermTypeTable } from "@/components/admin/term-type-table"
import { TermTypeForm } from "@/components/admin/term-type-form"
import { 
  Settings, 
  RefreshCw, 
  AlertCircle,
  Loader2
} from "lucide-react"

interface TermType {
  term_type_id: number
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    calendarPeriods: number
    leaveLimits: number
  }
}

export default function TermTypesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [termTypes, setTermTypes] = useState<TermType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTermType, setEditingTermType] = useState<TermType | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/')
      return
    }

    if ((session.user as any)?.role !== 'Admin') {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  const fetchTermTypes = async () => {
    try {
      const response = await fetch('/api/admin/term-types')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch term types')
      }

      setTermTypes(result.data || [])
    } catch (error) {
      console.error('Error fetching term types:', error)
      toast.error('Failed to fetch term types')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (session && (session.user as any)?.role === 'Admin') {
      fetchTermTypes()
    }
  }, [session])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchTermTypes()
  }

  const handleCreate = () => {
    setEditingTermType(null)
    setFormMode('create')
    setIsFormOpen(true)
  }

  const handleEdit = (termType: TermType) => {
    setEditingTermType(termType)
    setFormMode('edit')
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    fetchTermTypes()
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingTermType(null)
  }

  if (status === 'loading') {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!session) {
    return null
  }

  if ((session.user as any)?.role !== 'Admin') {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Access denied. Admin role required.
              </AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Term Types Management</h1>
              <p className="text-muted-foreground">
                Manage academic term types used throughout the system
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Error State */}
          {!isLoading && termTypes.length === 0 && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                No term types found. Create your first term type to get started.
              </AlertDescription>
            </Alert>
          )}

          {/* Term Types Table */}
          {!isLoading && (
            <TermTypeTable
              termTypes={termTypes}
              onRefresh={handleRefresh}
              onEdit={handleEdit}
              onCreate={handleCreate}
            />
          )}

          {/* Term Type Form Modal */}
          <TermTypeForm
            isOpen={isFormOpen}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
            termType={editingTermType}
            mode={formMode}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

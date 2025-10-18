"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Edit2, 
  Trash2, 
  Calendar, 
  Settings, 
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle
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

interface TermTypeTableProps {
  termTypes: TermType[]
  onRefresh: () => void
  onEdit: (termType: TermType) => void
  onCreate: () => void
}

export function TermTypeTable({ termTypes, onRefresh, onEdit, onCreate }: TermTypeTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (termTypeId: number, termTypeName: string) => {
    setDeletingId(termTypeId)
    
    try {
      const response = await fetch(`/api/admin/term-types/${termTypeId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete term type')
      }

      toast.success(`Term type "${termTypeName}" deleted successfully`)
      onRefresh()

    } catch (error) {
      console.error('Error deleting term type:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete term type')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Term Types</h2>
          <p className="text-muted-foreground">
            Manage academic term types used in calendar periods and leave limits
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Term Type
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Term Types</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{termTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              {termTypes.filter(t => t.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Term Types</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {termTypes.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently available for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Term Types</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {termTypes.filter(t => !t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Disabled from use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Term Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Term Types List</CardTitle>
          <CardDescription>
            All term types in the system with their usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {termTypes.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Term Types</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first term type
              </p>
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Term Type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termTypes.map((termType) => (
                  <TableRow key={termType.term_type_id}>
                    <TableCell className="font-medium">
                      {termType.name}
                    </TableCell>
                    <TableCell>
                      {termType.description || (
                        <span className="text-muted-foreground italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={termType.isActive ? "default" : "secondary"}>
                        {termType.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {termType._count.calendarPeriods}
                        </div>
                        <div className="flex items-center">
                          <Settings className="h-3 w-3 mr-1" />
                          {termType._count.leaveLimits}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(termType.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(termType.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(termType)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingId === termType.term_type_id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Term Type</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{termType.name}"? 
                                {termType._count.calendarPeriods > 0 || termType._count.leaveLimits > 0 ? (
                                  <span className="block mt-2 text-red-600 font-medium">
                                    This term type is currently being used by:
                                    {termType._count.calendarPeriods > 0 && (
                                      <span className="block">• {termType._count.calendarPeriods} calendar period(s)</span>
                                    )}
                                    {termType._count.leaveLimits > 0 && (
                                      <span className="block">• {termType._count.leaveLimits} leave limit(s)</span>
                                    )}
                                    <span className="block mt-2">You cannot delete it while it's in use.</span>
                                  </span>
                                ) : (
                                  " This action cannot be undone."
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(termType.term_type_id, termType.name)}
                                disabled={deletingId === termType.term_type_id || 
                                         termType._count.calendarPeriods > 0 || 
                                         termType._count.leaveLimits > 0}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deletingId === termType.term_type_id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


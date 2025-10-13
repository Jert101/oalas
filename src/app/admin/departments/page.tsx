"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Plus } from "lucide-react"

interface Department { department_id: number; name: string; description?: string | null; }

export default function DepartmentsPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Department[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Edit states
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    try {
      const res = await fetch("/api/admin/departments")
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch { toast.error("Failed to load departments") }
  }

  async function onAdd() {
    if (!name.trim()) { toast.error("Name is required"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/departments", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }) 
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add department")
      }
      setName(""); setDescription(""); toast.success("Department added"); fetchItems()
    } catch (error: any) { 
      toast.error(error.message || "Failed to add department") 
    } finally { setSubmitting(false) }
  }

  async function onEdit() {
    if (!editName.trim()) { toast.error("Name is required"); return }
    if (!editingDepartment) return
    
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/admin/departments/${editingDepartment.department_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update department")
      }
      setEditingDepartment(null); setEditName(""); setEditDescription(""); 
      toast.success("Department updated"); fetchItems()
    } catch (error: any) {
      toast.error(error.message || "Failed to update department")
    } finally { setEditSubmitting(false) }
  }

  async function onDelete(department: Department) {
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/admin/departments/${department.department_id}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete department")
      }
      toast.success("Department deleted"); fetchItems()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete department")
    } finally { setDeleteSubmitting(false) }
  }

  function startEdit(department: Department) {
    setEditingDepartment(department)
    setEditName(department.name)
    setEditDescription(department.description || "")
  }

  if (status === "loading") return null
  if (status === "unauthenticated" || session?.user?.role !== "Admin") redirect("/login")

  return (
    <SidebarProvider style={{"--sidebar-width":"16rem","--header-height":"3.5rem"} as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Add new college departments (e.g., Bachelor of Science in Computer Science)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Department Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e)=>setName(e.target.value)} 
                    placeholder="e.g., Bachelor of Science in Computer Science"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input 
                    value={description} 
                    onChange={(e)=>setDescription(e.target.value)} 
                    placeholder="Department description"
                  />
                </div>
              </div>
              <Button onClick={onAdd} disabled={submitting}>
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? "Adding..." : "Add Department"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Departments</CardTitle>
              <CardDescription>College departments and programs currently in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(i => (
                    <TableRow key={i.department_id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>{i.description || "No description"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => startEdit(i)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Department</DialogTitle>
                                <DialogDescription>Update the department name and description.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Department Name</Label>
                                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingDepartment(null)}>Cancel</Button>
                                <Button onClick={onEdit} disabled={editSubmitting}>
                                  {editSubmitting ? "Saving..." : "Save Changes"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{i.name}"? This action cannot be undone.
                                  {" "}This will fail if there are users assigned to this department.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDelete(i)} 
                                  disabled={deleteSubmitting} 
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleteSubmitting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No departments found. Add a department to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}



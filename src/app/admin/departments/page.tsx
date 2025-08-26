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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Department { department_id: number; name: string; description?: string | null; category: "NON_TEACHING_PERSONNEL" | "ACADEMIC_DEPARTMENT" }

export default function DepartmentsPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Department[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Department["category"]>("NON_TEACHING_PERSONNEL")
  const [submitting, setSubmitting] = useState(false)

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
      const res = await fetch("/api/admin/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, category }) })
      if (!res.ok) throw new Error()
      setName(""); setDescription(""); toast.success("Department added"); fetchItems()
    } catch { toast.error("Failed to add department") } finally { setSubmitting(false) }
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
              <CardDescription>Add new departments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e)=>setName(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e)=>setDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v:any)=>setCategory(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NON_TEACHING_PERSONNEL">Non Teaching Personnel</SelectItem>
                      <SelectItem value="ACADEMIC_DEPARTMENT">Academic Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={onAdd} disabled={submitting}>Add</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Existing</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(i => (
                    <TableRow key={i.department_id}>
                      <TableCell>{i.name}</TableCell>
                      <TableCell>{i.category}</TableCell>
                      <TableCell>{i.description || ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}



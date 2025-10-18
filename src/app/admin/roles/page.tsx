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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Plus, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Category {
  category_id: number;
  name: string;
  description?: string | null;
  color?: string;
  isActive: boolean;
  _count?: { roles: number };
}

interface Role { 
  role_id: number; 
  name: string; 
  description?: string | null; 
  category_id?: number | null;
  category?: Category | null;
}

export default function RolesPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Role[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Role form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  
  // Role edit states
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategoryId, setEditCategoryId] = useState<string>("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  
  // Category form states
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [categoryColor, setCategoryColor] = useState("#6b7280")
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  
  // Category edit states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryDescription, setEditCategoryDescription] = useState("")
  const [editCategoryColor, setEditCategoryColor] = useState("#6b7280")
  const [editCategorySubmitting, setEditCategorySubmitting] = useState(false)
  const [deleteCategorySubmitting, setDeleteCategorySubmitting] = useState(false)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  useEffect(() => { 
    fetchItems()
    fetchCategories()
  }, [])

  async function fetchItems() {
    try {
      const res = await fetch("/api/admin/roles")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.roles || [])
    } catch { toast.error("Failed to load roles") }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories")
      if (!res.ok) throw new Error()
      setCategories(await res.json())
    } catch { toast.error("Failed to load categories") }
  }

  // Quick add role states
  const [quickAddOpen, setQuickAddOpen] = useState<number | null>(null)
  const [quickName, setQuickName] = useState("")
  const [quickDescription, setQuickDescription] = useState("")
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  // Role functions
  async function onAddRole() {
    if (!name.trim()) { toast.error("Name is required"); return }
    if (!categoryId) { toast.error("Category is required"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/roles", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name, description, category_id: parseInt(categoryId) }) 
      })
      if (!res.ok) throw new Error()
      setName(""); setDescription(""); setCategoryId(""); toast.success("Role added"); fetchItems()
    } catch { toast.error("Failed to add role") } finally { setSubmitting(false) }
  }

  async function onQuickAddRole(categoryId: number) {
    if (!quickName.trim()) { toast.error("Name is required"); return }
    setQuickSubmitting(true)
    try {
      const res = await fetch("/api/admin/roles", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name: quickName, description: quickDescription, category_id: categoryId }) 
      })
      if (!res.ok) throw new Error()
      setQuickName(""); setQuickDescription(""); setQuickAddOpen(null); toast.success("Role added"); fetchItems()
    } catch { toast.error("Failed to add role") } finally { setQuickSubmitting(false) }
  }

  async function onEditRole() {
    if (!editName.trim()) { toast.error("Name is required"); return }
    if (!editCategoryId) { toast.error("Category is required"); return }
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/admin/roles/${editingRole?.role_id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name: editName, description: editDescription, category_id: parseInt(editCategoryId) }) 
      })
      if (!res.ok) throw new Error()
      setEditingRole(null); setEditName(""); setEditDescription(""); setEditCategoryId(""); toast.success("Role updated"); fetchItems()
    } catch { toast.error("Failed to update role") } finally { setEditSubmitting(false) }
  }

  async function onDeleteRole(role: Role) {
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/admin/roles/${role.role_id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Role deleted"); fetchItems()
    } catch { toast.error("Failed to delete role") } finally { setDeleteSubmitting(false) }
  }

  function startEditRole(role: Role) {
    setEditingRole(role)
    setEditName(role.name)
    setEditDescription(role.description || "")
    setEditCategoryId(role.category_id?.toString() || "")
  }

  // Category functions
  async function onAddCategory() {
    if (!categoryName.trim()) { toast.error("Name is required"); return }
    setCategorySubmitting(true)
    try {
      const res = await fetch("/api/admin/categories", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name: categoryName, description: categoryDescription, color: categoryColor }) 
      })
      if (!res.ok) throw new Error()
      setCategoryName(""); setCategoryDescription(""); setCategoryColor("#6b7280"); toast.success("Category added"); fetchCategories()
    } catch { toast.error("Failed to add category") } finally { setCategorySubmitting(false) }
  }

  async function onEditCategory() {
    if (!editCategoryName.trim()) { toast.error("Name is required"); return }
    setEditCategorySubmitting(true)
    try {
      const res = await fetch(`/api/admin/categories/${editingCategory?.category_id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name: editCategoryName, description: editCategoryDescription, color: editCategoryColor }) 
      })
      if (!res.ok) throw new Error()
      setEditingCategory(null); setEditCategoryName(""); setEditCategoryDescription(""); setEditCategoryColor("#6b7280"); toast.success("Category updated"); fetchCategories(); fetchItems()
    } catch { toast.error("Failed to update category") } finally { setEditCategorySubmitting(false) }
  }

  async function onDeleteCategory(category: Category) {
    setDeleteCategorySubmitting(true)
    try {
      const res = await fetch(`/api/admin/categories/${category.category_id}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      toast.success("Category deleted"); fetchCategories(); fetchItems()
    } catch (error: any) { 
      toast.error(error.message || "Failed to delete category") 
    } finally { setDeleteCategorySubmitting(false) }
  }

  function startEditCategory(category: Category) {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setEditCategoryDescription(category.description || "")
    setEditCategoryColor(category.color || "#6b7280")
  }

  function groupByCategory(roles: Role[]) {
    const grouped = roles.reduce((acc, role) => {
      const categoryName = role.category?.name || 'Uncategorized'
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(role)
      return acc
    }, {} as Record<string, Role[]>)
    return grouped
  }

  const filteredItems = selectedCategory 
    ? items.filter(item => item.category_id === selectedCategory)
    : items

  const groupedRoles = groupByCategory(filteredItems)

  if (status === "loading") return null
  if (status === "unauthenticated" || session?.user?.role !== "Admin") redirect("/login")

  return (
    <SidebarProvider style={{"--sidebar-width":"16rem","--header-height":"3.5rem"} as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="p-4 md:p-6 space-y-6">
          <Tabs defaultValue="roles" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roles">Roles Management</TabsTrigger>
              <TabsTrigger value="categories">Categories Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="roles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Role</CardTitle>
                  <CardDescription>Create a new role and assign it to a category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Role name" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Role description" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={onAddRole} disabled={submitting}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </CardContent>
              </Card>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  size="sm"
                >
                  All Categories
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.category_id}
                    variant={selectedCategory === cat.category_id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat.category_id)}
                    size="sm"
                    style={{ borderColor: cat.color }}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>

              {/* Role Cards by Category */}
              <div className="space-y-6">
                {Object.entries(groupedRoles)
                  .filter(([categoryName]) => categoryName !== 'Uncategorized')
                  .map(([categoryName, roles]) => {
                  const category = categories.find(cat => cat.name === categoryName) || roles[0]?.category
                  return (
                    <Card key={categoryName}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {categoryName}
                            <span className="text-sm text-muted-foreground">({roles.length} role{roles.length !== 1 ? 's' : ''})</span>
                          </CardTitle>
                          {category && (
                            <Button 
                              size="sm" 
                              onClick={() => setQuickAddOpen(category.category_id)}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Role
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Quick Add Role Form */}
                        {quickAddOpen === category?.category_id && (
                          <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                            <h4 className="font-medium mb-3">Add New Role to {categoryName}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div>
                                <Label>Role Name</Label>
                                <Input 
                                  value={quickName} 
                                  onChange={(e) => setQuickName(e.target.value)} 
                                  placeholder="Enter role name"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Description (Optional)</Label>
                                <Input 
                                  value={quickDescription} 
                                  onChange={(e) => setQuickDescription(e.target.value)} 
                                  placeholder="Enter role description"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => category && onQuickAddRole(category.category_id)}
                                disabled={quickSubmitting}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Role
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setQuickAddOpen(null)
                                  setQuickName("")
                                  setQuickDescription("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roles.map(role => (
                            <TableRow key={role.role_id}>
                              <TableCell className="font-medium">{role.name}</TableCell>
                              <TableCell>{role.description || "No description"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" onClick={() => startEditRole(role)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Role</DialogTitle>
                                        <DialogDescription>Update the role name, description, and category.</DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label>Name</Label>
                                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                        </div>
                                        <div>
                                          <Label>Description</Label>
                                          <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                        </div>
                                        <div>
                                          <Label>Category</Label>
                                          <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {categories.map(cat => (
                                                <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                                                  {cat.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
                                        <Button onClick={onEditRole} disabled={editSubmitting}>Save Changes</Button>
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
                                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete the role "{role.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDeleteRole(role)} disabled={deleteSubmitting} className="bg-red-600 hover:bg-red-700">
                                          Delete
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
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Category</CardTitle>
                  <CardDescription>Create a new category for organizing roles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={categoryName} onChange={(e)=>setCategoryName(e.target.value)} placeholder="Category name" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input value={categoryDescription} onChange={(e)=>setCategoryDescription(e.target.value)} placeholder="Category description" />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input type="color" value={categoryColor} onChange={(e)=>setCategoryColor(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={onAddCategory} disabled={categorySubmitting}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Categories</CardTitle>
                  <CardDescription>Manage your role categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Roles Count</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map(category => (
                        <TableRow key={category.category_id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description || "No description"}</TableCell>
                          <TableCell>{category._count?.roles || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm text-muted-foreground">{category.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => startEditCategory(category)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Category</DialogTitle>
                                    <DialogDescription>Update the category name, description, and color.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Name</Label>
                                      <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Input value={editCategoryDescription} onChange={(e) => setEditCategoryDescription(e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>Color</Label>
                                      <Input type="color" value={editCategoryColor} onChange={(e) => setEditCategoryColor(e.target.value)} />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                                    <Button onClick={onEditCategory} disabled={editCategorySubmitting}>Save Changes</Button>
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
                                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the category "{category.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteCategory(category)} disabled={deleteCategorySubmitting} className="bg-red-600 hover:bg-red-700">
                                      Delete
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Trash2, Plus, Settings, Eye } from "lucide-react"

interface LeaveType { leave_type_id: number; name: string; description?: string | null }

export default function LeaveTypesPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<LeaveType[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Edit states
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  
  // Configure fields states
  const [configuringLeaveType, setConfiguringLeaveType] = useState<LeaveType | null>(null)
  const [formFields, setFormFields] = useState<any[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [fieldsSaving, setFieldsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    try {
      const res = await fetch("/api/admin/leave-types")
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch {
      toast.error("Failed to load leave types")
    }
  }

  async function onAdd() {
    if (!name.trim()) { toast.error("Name is required"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/leave-types", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }) 
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add leave type")
      }
      setName(""); setDescription(""); toast.success("Leave type added"); fetchItems()
    } catch (error: any) { 
      toast.error(error.message || "Failed to add leave type") 
    } finally { setSubmitting(false) }
  }

  async function onEdit() {
    if (!editName.trim()) { toast.error("Name is required"); return }
    if (!editingLeaveType) return
    
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/admin/leave-types/${editingLeaveType.leave_type_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update leave type")
      }
      setEditingLeaveType(null); setEditName(""); setEditDescription(""); 
      toast.success("Leave type updated"); fetchItems()
    } catch (error: any) {
      toast.error(error.message || "Failed to update leave type")
    } finally { setEditSubmitting(false) }
  }

  async function onDelete(leaveType: LeaveType) {
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/admin/leave-types/${leaveType.leave_type_id}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete leave type")
      }
      toast.success("Leave type deleted"); fetchItems()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete leave type")
    } finally { setDeleteSubmitting(false) }
  }

  function startEdit(leaveType: LeaveType) {
    setEditingLeaveType(leaveType)
    setEditName(leaveType.name)
    setEditDescription(leaveType.description || "")
  }

  async function startConfigureFields(leaveType: LeaveType) {
    setConfiguringLeaveType(leaveType)
    setFieldsLoading(true)
    try {
      const res = await fetch(`/api/admin/leave-types/${leaveType.leave_type_id}/fields`)
      if (res.ok) {
        const data = await res.json()
        console.log('Loaded fields:', data.formFields) // Debug log
        
        // Combine basic fields with custom fields
        const basicFields = getBasicLeaveFields()
        const customFields = data.formFields || []
        const allFields = [...basicFields, ...customFields]
        
        setFormFields(allFields)
      } else {
        console.log('No fields found, using defaults') // Debug log
        // If no fields exist yet, start with basic fields + default custom fields
        const basicFields = getBasicLeaveFields()
        const defaultCustomFields = getDefaultFieldsForLeaveType(leaveType.name)
        const allFields = [...basicFields, ...defaultCustomFields]
        setFormFields(allFields)
      }
    } catch (error) {
      console.error('Error loading fields:', error) // Debug log
      toast.error("Failed to load form fields")
      setFormFields([])
    } finally {
      setFieldsLoading(false)
    }
  }

  function getBasicLeaveFields() {
    return [
      {
        fieldName: "startDate",
        fieldLabel: "Start Date",
        fieldType: "date",
        isRequired: true,
        placeholder: "Select leave start date",
        helpText: "The date when your leave begins",
        displayOrder: -6,
        isBasic: true
      },
      {
        fieldName: "endDate",
        fieldLabel: "End Date", 
        fieldType: "date",
        isRequired: true,
        placeholder: "Select leave end date",
        helpText: "The date when your leave ends",
        displayOrder: -5,
        isBasic: true
      },
      {
        fieldName: "numberOfDays",
        fieldLabel: "Number of Days",
        fieldType: "number",
        isRequired: true,
        placeholder: "Total days of leave",
        helpText: "Total number of leave days requested",
        displayOrder: -4,
        isBasic: true
      },
      {
        fieldName: "hours",
        fieldLabel: "Hours per Day",
        fieldType: "number",
        isRequired: true,
        placeholder: "Hours (1-24)",
        helpText: "Number of hours per day (1-24)",
        displayOrder: -3,
        isBasic: true
      },
      {
        fieldName: "leaveType",
        fieldLabel: "Leave Type",
        fieldType: "select",
        isRequired: true,
        placeholder: "Select leave type",
        helpText: "Type of leave being requested",
        displayOrder: -2,
        isBasic: true
      },
      {
        fieldName: "paymentStatus",
        fieldLabel: "Payment Status",
        fieldType: "select",
        isRequired: true,
        options: JSON.stringify(["PAID", "UNPAID"]),
        placeholder: "Select payment status",
        helpText: "Whether this leave is paid or unpaid",
        displayOrder: -1,
        isBasic: true
      }
    ]
  }

  function getDefaultFieldsForLeaveType(leaveTypeName: string) {
    const name = leaveTypeName.toLowerCase()
    
    if (name.includes('sick')) {
      return [
        {
          fieldName: "descriptionOfSickness",
          fieldLabel: "Description of Illness/Condition",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe your illness or medical condition",
          helpText: "Provide details about your medical condition requiring leave",
          displayOrder: 0
        },
        {
          fieldName: "medicalProof",
          fieldLabel: "Medical Certificate",
          fieldType: "file",
          isRequired: false,
          placeholder: "Upload medical certificate or doctor's note",
          helpText: "Medical documentation supporting your leave request",
          displayOrder: 1
        }
      ]
    } else if (name.includes('vacation')) {
      return [
        {
          fieldName: "specificPurpose",
          fieldLabel: "Specific Purpose",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe the specific purpose for this vacation leave",
          helpText: "Provide detailed information about the reason for your vacation",
          displayOrder: 0
        },
        {
          fieldName: "destination",
          fieldLabel: "Destination (Optional)",
          fieldType: "text",
          isRequired: false,
          placeholder: "Where will you be during your leave?",
          helpText: "Optional: Specify your location during the leave period",
          displayOrder: 1
        }
      ]
    } else if (name.includes('emergency')) {
      return [
        {
          fieldName: "natureOfEmergency",
          fieldLabel: "Nature of Emergency",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe the emergency situation",
          helpText: "Provide details about the emergency requiring immediate leave",
          displayOrder: 0
        },
        {
          fieldName: "immediateContactInfo",
          fieldLabel: "Immediate Contact Information",
          fieldType: "text",
          isRequired: true,
          placeholder: "How can we reach you during this emergency?",
          helpText: "Phone number or contact method during the emergency period",
          displayOrder: 1
        }
      ]
    } else if (name.includes('maternity')) {
      return [
        {
          fieldName: "expectedDeliveryDate",
          fieldLabel: "Expected Delivery Date",
          fieldType: "date",
          isRequired: true,
          placeholder: "Expected date of delivery",
          helpText: "The estimated due date as per medical records",
          displayOrder: 0
        },
        {
          fieldName: "medicalCertificate",
          fieldLabel: "Medical Certificate",
          fieldType: "file",
          isRequired: true,
          placeholder: "Upload medical certificate from your doctor",
          helpText: "Medical documentation confirming pregnancy and expected delivery date",
          displayOrder: 1
        }
      ]
    } else if (name.includes('paternity')) {
      return [
        {
          fieldName: "childBirthDate",
          fieldLabel: "Child's Birth Date",
          fieldType: "date",
          isRequired: true,
          placeholder: "Date of child's birth",
          helpText: "The actual or expected birth date of your child",
          displayOrder: 0
        },
        {
          fieldName: "relationshipToChild",
          fieldLabel: "Relationship to Child",
          fieldType: "text",
          isRequired: true,
          placeholder: "e.g., Father, Adoptive Father, Legal Guardian",
          helpText: "Your relationship to the child",
          displayOrder: 1
        }
      ]
    } else {
      // Default fields for other leave types including Travel Order
      return [
        {
          fieldName: "specificPurpose",
          fieldLabel: "Specific Purpose",
          fieldType: "textarea",
          isRequired: true,
          placeholder: "Please describe the specific purpose for this leave/travel",
          helpText: "Provide detailed information about the reason for your request",
          displayOrder: 0
        },
        {
          fieldName: "additionalInformation",
          fieldLabel: "Additional Information",
          fieldType: "textarea",
          isRequired: false,
          placeholder: "Any additional relevant information",
          helpText: "Optional: Provide any other details that might be relevant",
          displayOrder: 1
        }
      ]
    }
  }

  async function saveFormFields() {
    if (!configuringLeaveType) return
    
    setFieldsSaving(true)
    try {
      // Only save custom fields (not basic fields) to the database
      const customFieldsOnly = formFields.filter(field => !field.isBasic)
      
      const res = await fetch(`/api/admin/leave-types/${configuringLeaveType.leave_type_id}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formFields: customFieldsOnly })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save form fields")
      }
      
      toast.success("Form fields configured successfully")
      setConfiguringLeaveType(null)
      setFormFields([])
      setShowPreview(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save form fields")
    } finally {
      setFieldsSaving(false)
    }
  }

  function addFormField() {
    const newField = {
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      isRequired: false,
      placeholder: "",
      helpText: "",
      displayOrder: formFields.length
    }
    setFormFields([...formFields, newField])
  }

  function updateFormField(index: number, updates: any) {
    const updated = formFields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    )
    setFormFields(updated)
  }

  function removeFormField(index: number) {
    const updated = formFields.filter((_, i) => i !== index)
    setFormFields(updated)
  }

  function renderFormPreview() {
    const sortedFields = formFields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    
    return (
      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div className="border-b pb-4 mb-6">
          <h3 className="text-lg font-semibold">{configuringLeaveType?.name} Application Form</h3>
          <p className="text-sm text-muted-foreground">Preview of how the form will appear to users</p>
        </div>

        {/* Basic Information Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">
                Employee Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                value="John Doe (Sample)" 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Employee ID
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                value="EMP001" 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Department
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                value="Computer Science Department" 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Position/Role
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                value="Assistant Professor" 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Employment Status
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                value="Regular" 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Application Date
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                value={new Date().toLocaleDateString()} 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Leave Details Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Leave Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedFields.map((field, index) => (
            <div key={index} className={`${field.fieldName === 'specificPurpose' || field.fieldName === 'descriptionOfSickness' || field.fieldName === 'natureOfEmergency' || field.fieldType === 'textarea' ? 'md:col-span-2' : ''}`}>
              <Label className="text-sm font-medium">
                {field.fieldLabel || field.fieldName}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.fieldType === 'text' && (
                <Input 
                  placeholder={field.placeholder || ""} 
                  disabled 
                  className="mt-1"
                />
              )}
              
              {field.fieldType === 'textarea' && (
                <textarea 
                  placeholder={field.placeholder || ""} 
                  disabled 
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50 resize-none h-20"
                />
              )}
              
              {field.fieldType === 'number' && (
                <Input 
                  type="number" 
                  placeholder={field.placeholder || ""} 
                  disabled 
                  className="mt-1"
                />
              )}
              
              {field.fieldType === 'date' && (
                <Input 
                  type="date" 
                  disabled 
                  className="mt-1"
                />
              )}
              
              {field.fieldType === 'file' && (
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                  <div className="text-sm text-gray-500">
                    📁 {field.placeholder || "Click to upload file"}
                  </div>
                </div>
              )}
              
              {field.fieldType === 'select' && (
                <select disabled className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50">
                  <option>{field.placeholder || "Select an option"}</option>
                  {field.options && JSON.parse(field.options).map((option: string, i: number) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              )}
              
              {field.helpText && (
                <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
              )}
            </div>
            ))}
          </div>
        </div>

        {/* Leave Balance Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Leave Balance Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Label className="text-sm font-medium text-blue-800">Available Days</Label>
              <div className="text-lg font-bold text-blue-900">15 days</div>
              <p className="text-xs text-blue-600">Current leave balance</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <Label className="text-sm font-medium text-orange-800">Used Days</Label>
              <div className="text-lg font-bold text-orange-900">5 days</div>
              <p className="text-xs text-orange-600">This academic year</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Label className="text-sm font-medium text-green-800">Remaining Days</Label>
              <div className="text-lg font-bold text-green-900">10 days</div>
              <p className="text-xs text-green-600">After this request</p>
            </div>
          </div>
        </div>

        {/* Supervisor Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Supervisor Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Immediate Supervisor</Label>
              <Input 
                value="Dr. Jane Smith" 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Department Head</Label>
              <Input 
                value="Prof. Robert Johnson" 
                disabled 
                className="mt-1 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Additional Information</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input type="checkbox" disabled className="rounded" />
              <Label className="text-sm">I understand that this leave is subject to approval</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" disabled className="rounded" />
              <Label className="text-sm">I will ensure all pending work is completed or delegated</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" disabled className="rounded" />
              <Label className="text-sm">I will provide necessary handover to colleagues if required</Label>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6 mt-6">
          <div className="flex gap-2">
            <Button disabled className="bg-blue-600 text-white">Submit Application</Button>
            <Button disabled variant="outline">Save as Draft</Button>
            <Button disabled variant="outline">Cancel</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            By submitting this application, you acknowledge that all information provided is accurate and complete.
          </p>
        </div>
      </div>
    )
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
              <CardTitle>Leave Types</CardTitle>
              <CardDescription>Manage leave types like Sick Leave, Vacation, Personal Leave, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Leave Type Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e)=>setName(e.target.value)} 
                    placeholder="e.g., Sick Leave, Vacation, Personal Leave"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Description (Optional)</Label>
                  <Input 
                    value={description} 
                    onChange={(e)=>setDescription(e.target.value)} 
                    placeholder="Brief description of the leave type"
                  />
                </div>
              </div>
              <Button onClick={onAdd} disabled={submitting}>
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? "Adding..." : "Add Leave Type"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Leave Types</CardTitle>
              <CardDescription>Available leave types in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(i => (
                    <TableRow key={i.leave_type_id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>{i.description || "No description"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => startConfigureFields(i)}
                            title="Configure Form Fields"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => startEdit(i)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Leave Type</DialogTitle>
                                <DialogDescription>Update the leave type name and description.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Leave Type Name</Label>
                                  <Input 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)} 
                                    placeholder="e.g., Sick Leave, Vacation"
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Input 
                                    value={editDescription} 
                                    onChange={(e) => setEditDescription(e.target.value)} 
                                    placeholder="Optional description"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingLeaveType(null)}>Cancel</Button>
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
                                <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{i.name}"? This action cannot be undone.
                                  {" "}This will fail if there are leave applications or limits using this leave type.
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
                        No leave types found. Add a leave type to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Configure Fields Dialog */}
          <Dialog open={!!configuringLeaveType} onOpenChange={() => {
            setConfiguringLeaveType(null)
            setShowPreview(false)
          }}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configure Form Fields - {configuringLeaveType?.name}</DialogTitle>
                <DialogDescription>
                  Configure what fields appear in the leave application form for this leave type.
                </DialogDescription>
              </DialogHeader>
              
              {fieldsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-muted-foreground">Loading form fields...</div>
                </div>
              ) : (
                <Tabs defaultValue="configure" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="configure">Configure Fields</TabsTrigger>
                    <TabsTrigger value="preview">Form Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="configure" className="space-y-4 mt-4">
                    <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Form Fields</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Core fields are required for all leave applications. You can add custom fields below.
                      </p>
                    </div>
                    <Button onClick={addFormField} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Field
                    </Button>
                  </div>
                  
                  {formFields.map((field, index) => (
                    <div key={index} className={`border rounded-lg p-4 space-y-3 ${field.isBasic ? 'bg-blue-50 border-blue-200' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">Field {index + 1}</h5>
                          {field.isBasic && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Core Field
                            </span>
                          )}
                        </div>
                        {!field.isBasic && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeFormField(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Field Name (Internal)</Label>
                          <Input
                            value={field.fieldName || ""}
                            onChange={(e) => updateFormField(index, { fieldName: e.target.value })}
                            placeholder="e.g., specificPurpose"
                            readOnly={field.isBasic}
                            className={field.isBasic ? "bg-gray-100" : ""}
                          />
                        </div>
                        <div>
                          <Label>Field Label (Display)</Label>
                          <Input
                            value={field.fieldLabel || ""}
                            onChange={(e) => updateFormField(index, { fieldLabel: e.target.value })}
                            placeholder="e.g., Specific Purpose"
                            readOnly={field.isBasic}
                            className={field.isBasic ? "bg-gray-100" : ""}
                          />
                        </div>
                        <div>
                          <Label>Field Type</Label>
                          <select
                            value={field.fieldType || "text"}
                            onChange={(e) => updateFormField(index, { fieldType: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${field.isBasic ? "bg-gray-100" : ""}`}
                            disabled={field.isBasic}
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="file">File Upload</option>
                            <option value="select">Select Dropdown</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.isRequired || false}
                            onChange={(e) => updateFormField(index, { isRequired: e.target.checked })}
                            className="rounded"
                            disabled={field.isBasic}
                          />
                          <Label>Required Field</Label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Placeholder Text</Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={(e) => updateFormField(index, { placeholder: e.target.value })}
                            placeholder="Placeholder text for the field"
                          />
                        </div>
                        <div>
                          <Label>Help Text</Label>
                          <Input
                            value={field.helpText || ""}
                            onChange={(e) => updateFormField(index, { helpText: e.target.value })}
                            placeholder="Additional help text"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                      {formFields.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                          No form fields configured. Click "Add Field" to create custom fields for this leave type.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-4">
                    {renderFormPreview()}
                  </TabsContent>
                </Tabs>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setConfiguringLeaveType(null)
                  setShowPreview(false)
                }}>
                  Cancel
                </Button>
                <Button onClick={saveFormFields} disabled={fieldsSaving}>
                  {fieldsSaving ? "Saving..." : "Save Configuration"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}



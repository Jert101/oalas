"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2, Save, X } from "lucide-react"

// Validation schema
const termTypeSchema = z.object({
  name: z.string().min(1, "Term type name is required").max(100, "Name too long"),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
})

type TermTypeFormData = z.infer<typeof termTypeSchema>

interface TermType {
  term_type_id: number
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TermTypeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  termType?: TermType | null
  mode: 'create' | 'edit'
}

export function TermTypeForm({ isOpen, onClose, onSuccess, termType, mode }: TermTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TermTypeFormData>({
    resolver: zodResolver(termTypeSchema),
    defaultValues: {
      name: termType?.name || "",
      description: termType?.description || "",
      isActive: termType?.isActive ?? true
    }
  })

  const onSubmit = async (data: TermTypeFormData) => {
    setIsLoading(true)
    
    try {
      const url = mode === 'create' 
        ? '/api/admin/term-types'
        : `/api/admin/term-types/${termType?.term_type_id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save term type')
      }

      toast.success(
        mode === 'create' 
          ? 'Term type created successfully' 
          : 'Term type updated successfully'
      )
      
      form.reset()
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error saving term type:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save term type')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Term Type' : 'Edit Term Type'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new term type to the system. Term types are used to categorize academic periods.'
              : 'Update the term type information. Changes will affect calendar periods and leave limits.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Academic, Summer, Midyear" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name for the term type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this term type..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help identify this term type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Active term types can be used in calendar periods and leave limits
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


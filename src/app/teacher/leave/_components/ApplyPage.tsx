"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { LeaveForm } from "./LeaveForm"
import { TravelOrderForm } from "./TravelOrderForm"
import {
  type ApplicationType,
  type LeaveType,
  type UserData,
  type LeaveBalance,
  type LeaveApplication,
  type TravelOrder,
  getSchemaForLeaveType,
  travelOrderSchema
} from "./types"

const LEAVE_TYPES = {
  VACATION: {
    title: "Vacation Leave",
    description: "For personal time off and vacations",
    icon: "🏖️"
  },
  SICK: {
    title: "Sick Leave",
    description: "For medical appointments and illness",
    icon: "🏥"
  },
  EMERGENCY: {
    title: "Emergency Leave",
    description: "For urgent personal matters",
    icon: "🚨"
  },
  MATERNITY: {
    title: "Maternity Leave",
    description: "For childbirth and recovery",
    icon: "👶"
  },
  PATERNITY: {
    title: "Paternity Leave",
    description: "For fathers after childbirth",
    icon: "👨‍👦"
  }
} as const

export default function ApplyPage() {
  // Application flow states
  const [step, setStep] = useState<"select-type" | "select-leave" | "show-balance" | "form">("select-type")
  const [applicationType, setApplicationType] = useState<ApplicationType>(null)
  const [leaveType, setLeaveType] = useState<LeaveType>(null)
  
  // User and balance data states
  const [userData, setUserData] = useState<UserData | null>(null)
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Separate forms for leave and travel
  const leaveForm = useForm<LeaveApplication>({
    resolver: zodResolver(getSchemaForLeaveType(leaveType))
  })

  const travelForm = useForm<TravelOrder>({
    resolver: zodResolver(travelOrderSchema)
  })

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/teacher/profile")
        const data = await response.json()
        if (!data.success) throw new Error(data.message)
        setUserData(data.data)
      } catch (error) {
        toast.error("Failed to load user data")
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Fetch leave balance when leave type is selected
  const fetchLeaveBalance = async (type: LeaveType) => {
    if (!type) return null
    setIsLoading(true)
    try {
      const response = await fetch(`/api/teacher/leave/balance?type=${type}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.message)
      setLeaveBalance(data.data)
      return data.data
    } catch (error) {
      toast.error("Failed to load leave balance")
      console.error("Error fetching leave balance:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplicationTypeSelect = (type: ApplicationType) => {
    setApplicationType(type)
    if (type === "leave") {
      setStep("select-leave")
    } else {
      setStep("form")
      // Reset travel form with initial data
      travelForm.reset({
        name: userData?.name || "",
        department: userData?.department || "",
        dateCreated: new Date(),
        transportationFee: 0,
        seminarFee: 0,
        mealsAccommodation: 0,
        totalCashRequested: 0
      })
    }
  }

  const handleLeaveTypeSelect = async (type: LeaveType) => {
    setLeaveType(type)
    const balance = await fetchLeaveBalance(type)
    if (balance) {
      setStep("show-balance")
      // Reset leave form with initial data
      leaveForm.reset({
        name: userData?.name || "",
        department: userData?.department || "",
        dateCreated: new Date(),
        leaveType: type || "",
        paymentStatus: balance.remaining > 0 ? "paid" : "unpaid",
        hours: 8
      })
    }
  }

  const handleProceedToForm = () => {
    setStep("form")
  }

  const handleBack = () => {
    switch (step) {
      case "select-leave":
        setStep("select-type")
        setApplicationType(null)
        break
      case "show-balance":
        setStep("select-leave")
        setLeaveType(null)
        setLeaveBalance(null)
        break
      case "form":
        if (applicationType === "leave") {
          setStep("show-balance")
        } else {
          setStep("select-type")
          setApplicationType(null)
        }
        break
    }
  }

  const onSubmit = async (values: LeaveApplication | TravelOrder) => {
    setIsLoading(true)
    try {
      const endpoint = applicationType === "leave" 
        ? "/api/teacher/leave/apply"
        : "/api/teacher/travel/apply"

      const formData = new FormData()
      for (const [key, value] of Object.entries(values)) {
        if (value instanceof File) {
          formData.append(key, value)
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString())
        } else {
          formData.append(key, String(value))
        }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Application submitted successfully")
        setStep("select-type")
        setApplicationType(null)
        setLeaveType(null)
        leaveForm.reset()
        travelForm.reset()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application")
      console.error("Error submitting application:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Leave Management System</h1>
        <p className="text-muted-foreground">
          Welcome back, {userData?.name}
        </p>
      </div>

      {step === "select-type" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleApplicationTypeSelect("leave")}
          >
            <CardHeader>
              <CardTitle>Leave Application</CardTitle>
              <CardDescription>Apply for various types of leave</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleApplicationTypeSelect("travel")}
          >
            <CardHeader>
              <CardTitle>Travel Order</CardTitle>
              <CardDescription>Request for official travel</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {step === "select-leave" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(LEAVE_TYPES).map(([key, { title, description, icon }]) => (
            <Card 
              key={key}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleLeaveTypeSelect(key as LeaveType)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <CardTitle>{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {step === "show-balance" && leaveBalance && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Leave Balance</CardTitle>
            <CardDescription>Current academic period: {leaveBalance.academicPeriod}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Allowed Days:</span>
                <span className="font-medium">{leaveBalance.allowed}</span>
              </div>
              <div className="flex justify-between">
                <span>Used Days:</span>
                <span className="font-medium">{leaveBalance.used}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Days:</span>
                <span className="font-medium text-primary">{leaveBalance.remaining}</span>
              </div>
              <div className="flex items-center justify-end space-x-4 pt-4">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button onClick={handleProceedToForm}>
                  Continue to Application
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "form" && userData && (
        <div className="space-y-6">
          {applicationType === "leave" ? (
            <Form {...leaveForm}>
              <form onSubmit={leaveForm.handleSubmit(onSubmit)}>
                <LeaveForm
                  type={leaveType!}
                  userData={userData}
                  leaveBalance={leaveBalance!}
                  form={leaveForm}
                  onCancel={handleBack}
                />
              </form>
            </Form>
          ) : (
            <Form {...travelForm}>
              <form onSubmit={travelForm.handleSubmit(onSubmit)}>
                <TravelOrderForm
                  userData={userData}
                  form={travelForm}
                  onCancel={handleBack}
                />
              </form>
            </Form>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  BarChart3,
  TrendingUp
} from "lucide-react"

interface SectionCardsProps {
  className?: string
}

export function SectionCards({ className }: SectionCardsProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  // Role-based statistics
  const getRoleStats = () => {
    switch (userRole) {
      case "Admin":
        return {
          title1: "Total Users",
          value1: "1,234",
          subtitle1: "Active accounts",
          icon1: Users,
          color1: "text-blue-600",
          title2: "Pending Requests",
          value2: "5",
          subtitle2: "Account setup",
          icon2: AlertCircle,
          color2: "text-yellow-600",
          title3: "Departments",
          value3: "8",
          subtitle3: "Active departments",
          icon3: Building,
          color3: "text-purple-600",
          title4: "System Status",
          value4: "Online",
          subtitle4: "All systems operational",
          icon4: CheckCircle,
          color4: "text-green-600"
        }
      case "Teacher/Instructor":
        return {
          title1: "Leave Balance",
          value1: "15 days",
          subtitle1: "Remaining this year",
          icon1: Calendar,
          color1: "text-blue-600",
          title2: "Pending Applications",
          value2: "2",
          subtitle2: "Awaiting approval",
          icon2: AlertCircle,
          color2: "text-yellow-600",
          title3: "Approved Leave",
          value3: "5 days",
          subtitle3: "This academic year",
          icon3: CheckCircle,
          color3: "text-green-600",
          title4: "Department",
          value4: "Computer Science",
          subtitle4: "Your department",
          icon4: Building,
          color4: "text-purple-600"
        }
      case "Dean/Program Head":
        return {
          title1: "Pending Approvals",
          value1: "5",
          subtitle1: "Awaiting review",
          icon1: AlertCircle,
          color1: "text-yellow-600",
          title2: "Faculty Members",
          value2: "25",
          subtitle2: "In your department",
          icon2: Users,
          color2: "text-blue-600",
          title3: "Approved This Month",
          value3: "12",
          subtitle3: "Leave applications",
          icon3: CheckCircle,
          color3: "text-green-600",
          title4: "Department Reports",
          value4: "Updated",
          subtitle4: "Real-time data",
          icon4: BarChart3,
          color4: "text-purple-600"
        }
      case "Finance Department":
      case "Finance Officer":
      case "Finance Office Head":
        return {
          title1: "Total Budget",
          value1: "₱500,000",
          subtitle1: "Annual allocation",
          icon1: DollarSign,
          color1: "text-green-600",
          title2: "Budget Usage",
          value2: "64%",
          subtitle2: "₱320,000 used",
          icon2: BarChart3,
          color2: "text-blue-600",
          title3: "Pending Payroll",
          value3: "₱45,000",
          subtitle3: "This week",
          icon3: TrendingUp,
          color3: "text-orange-600",
          title4: "Monthly Expenses",
          value4: "₱180,000",
          subtitle4: "Current month",
          icon4: FileText,
          color4: "text-red-600"
        }
      case "Non Teaching Personnel":
        return {
          title1: "Leave Requests",
          value1: "3",
          subtitle1: "Pending approval",
          icon1: AlertCircle,
          color1: "text-yellow-600",
          title2: "Work Days",
          value2: "22",
          subtitle2: "This month",
          icon2: Calendar,
          color2: "text-blue-600",
          title3: "Department Tasks",
          value3: "5",
          subtitle3: "Active tasks",
          icon3: FileText,
          color3: "text-green-600",
          title4: "Training Hours",
          value4: "12 hrs",
          subtitle4: "This year",
          icon4: TrendingUp,
          color4: "text-purple-600"
        }
      default:
        return {
          title1: "Welcome",
          value1: "Dashboard",
          subtitle1: "OALASS System",
          icon1: Building,
          color1: "text-blue-600",
          title2: "Quick Access",
          value2: "Available",
          subtitle2: "All features",
          icon2: CheckCircle,
          color2: "text-green-600",
          title3: "System Status",
          value3: "Online",
          subtitle3: "All operational",
          icon3: CheckCircle,
          color3: "text-green-600",
          title4: "Support",
          value4: "24/7",
          subtitle4: "Available",
          icon4: Users,
          color4: "text-purple-600"
        }
    }
  }

  const stats = getRoleStats()

  return (
    <div className={`grid gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stats.title1}</CardTitle>
          <stats.icon1 className={`h-4 w-4 ${stats.color1}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.value1}</div>
          <p className="text-xs text-muted-foreground">{stats.subtitle1}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stats.title2}</CardTitle>
          <stats.icon2 className={`h-4 w-4 ${stats.color2}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.value2}</div>
          <p className="text-xs text-muted-foreground">{stats.subtitle2}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stats.title3}</CardTitle>
          <stats.icon3 className={`h-4 w-4 ${stats.color3}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.value3}</div>
          <p className="text-xs text-muted-foreground">{stats.subtitle3}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stats.title4}</CardTitle>
          <stats.icon4 className={`h-4 w-4 ${stats.color4}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.value4}</div>
          <p className="text-xs text-muted-foreground">{stats.subtitle4}</p>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  FileText,
  BarChart3,
  ArrowRight,
  Calendar,
  CreditCard,
  PieChart
} from "lucide-react"
import { useRouter } from "next/navigation"

interface FinanceStats {
  totalBudget: number
  usedBudget: number
  pendingPayroll: number
  monthlyExpenses: number
  budgetUsage: number
  savingsRate: number
  remainingBudget: number
}

export default function FinanceDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<FinanceStats>({
    totalBudget: 0,
    usedBudget: 0,
    pendingPayroll: 0,
    monthlyExpenses: 0,
    budgetUsage: 0,
    savingsRate: 0,
    remainingBudget: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/finance/dashboard-stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStats({
              totalBudget: data.data.totalBudget,
              usedBudget: data.data.usedBudget,
              budgetUsage: data.data.budgetUsage,
              remainingBudget: data.data.remainingBudget,
              monthlyExpenses: data.data.monthlyExpenses,
              pendingPayroll: data.data.pendingPayroll,
              savingsRate: data.data.savingsRate
            })
          }
        }
      } catch (error) {
        console.error('Error loading finance stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const remainingBudget = stats.totalBudget - stats.usedBudget

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {session?.user?.name}. Manage financial reports, budgets, and payroll.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => router.push('/finance/reports')} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Reports
          </Button>
          <Button onClick={() => router.push('/finance/payroll')}>
            <Calculator className="mr-2 h-4 w-4" />
            Payroll
          </Button>
        </div>
      </div>

      {/* Financial Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Annual allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.budgetUsage}%</div>
            <p className="text-xs text-muted-foreground">
              ₱{stats.usedBudget.toLocaleString()} used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.pendingPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This week's payroll
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.monthlyExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Financial Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{remainingBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savingsRate}%</div>
            <p className="text-xs text-muted-foreground">
              Budget efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Status</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">On Track</div>
            <p className="text-xs text-muted-foreground">
              All payments scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/finance/reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Reports
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/finance/payroll')}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Process Payroll
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/finance/budget')}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Budget Management
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Budget:</span>
                <span className="font-medium">₱{stats.totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Used Budget:</span>
                <span className="font-medium">₱{stats.usedBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining:</span>
                <span className="font-medium text-green-600">₱{remainingBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Usage Rate:</span>
                <span className="font-medium">{stats.budgetUsage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users,
  Building,
  Mail,
  Phone,
  Calendar
} from "lucide-react"

export default function FinanceFacultyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Faculty Directory</h1>
        <p className="text-muted-foreground">
          Complete directory of all faculty members and staff
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/ckcm.png" alt="John Doe" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-sm font-medium">John Doe</h3>
                <p className="text-xs text-gray-500">Computer Science</p>
                <p className="text-xs text-gray-400">john.doe@ckcm.edu.ph</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/ckcm.png" alt="Jane Smith" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Jane Smith</h3>
                <p className="text-xs text-gray-500">Information Technology</p>
                <p className="text-xs text-gray-400">jane.smith@ckcm.edu.ph</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/ckcm.png" alt="Mike Johnson" />
                <AvatarFallback>MJ</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Mike Johnson</h3>
                <p className="text-xs text-gray-500">Business Administration</p>
                <p className="text-xs text-gray-400">mike.johnson@ckcm.edu.ph</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/ckcm.png" alt="Sarah Wilson" />
                <AvatarFallback>SW</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Sarah Wilson</h3>
                <p className="text-xs text-gray-500">Engineering</p>
                <p className="text-xs text-gray-400">sarah.wilson@ckcm.edu.ph</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/ckcm.png" alt="David Brown" />
                <AvatarFallback>DB</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-sm font-medium">David Brown</h3>
                <p className="text-xs text-gray-500">Education</p>
                <p className="text-xs text-gray-400">david.brown@ckcm.edu.ph</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/ckcm.png" alt="Lisa Davis" />
                <AvatarFallback>LD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-sm font-medium">Lisa Davis</h3>
                <p className="text-xs text-gray-500">Non-Teaching Personnel</p>
                <p className="text-xs text-gray-400">lisa.davis@ckcm.edu.ph</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">104</div>
              <div className="text-sm text-gray-600">Total Faculty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">79</div>
              <div className="text-sm text-gray-600">Teaching Staff</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">25</div>
              <div className="text-sm text-gray-600">Non-Teaching Staff</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">6</div>
              <div className="text-sm text-gray-600">Departments</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

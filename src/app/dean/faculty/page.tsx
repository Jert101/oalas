"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { 
  Users, 
  UserCheck, 
  UserX,
  Mail,
  Calendar,
  Eye
} from "lucide-react"

interface FacultyMember {
  users_id: string
  name: string
  email: string
  profilePicture: string
  status: {
    name: string
  }
  department: {
    name: string
  }
  createdAt: string
}

export default function DeanFacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const res = await fetch('/api/dean/dashboard-stats')
        if (!res.ok) throw new Error('Failed to load faculty')
        const data = await res.json()
        if (data.success) {
          // For now, we'll use mock data since the API doesn't return faculty list
          setFaculty([
            {
              users_id: "1",
              name: "John Doe",
              email: "john.doe@ckcm.edu.ph",
              profilePicture: "/ckcm.png",
              status: { name: "Regular" },
              department: { name: "Computer Science" },
              createdAt: "2024-01-01"
            },
            {
              users_id: "2", 
              name: "Jane Smith",
              email: "jane.smith@ckcm.edu.ph",
              profilePicture: "/ckcm.png",
              status: { name: "Probation" },
              department: { name: "Computer Science" },
              createdAt: "2024-02-01"
            }
          ])
        }
      } catch (error) {
        console.error('Error loading faculty:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFaculty()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Regular':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Regular</Badge>
      case 'Probation':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Probation</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Faculty Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage faculty members in your department
        </p>
      </div>

      {/* Faculty Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faculty.length}</div>
            <p className="text-xs text-muted-foreground">
              In your department
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Faculty</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faculty.filter(f => f.status.name === 'Regular').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Probationary</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faculty.filter(f => f.status.name === 'Probation').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Under probation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Faculty List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Faculty Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faculty.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No faculty found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No faculty members are currently assigned to your department.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {faculty.map((member) => (
                <div
                  key={member.users_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profilePicture || '/ckcm.png'} alt={member.name} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDate(member.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {getStatusBadge(member.status.name)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

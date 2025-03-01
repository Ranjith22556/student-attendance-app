"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, QrCode, RefreshCw, Clock, Calendar, BookOpen, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

// Define types for our data
interface ClassItem {
  id: string;
  subject: string;
  day: string;
  period: string;
  room: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  subject: string;
  date: string;
  day: string;
  period: string;
  attended: boolean;
}

export default function CheckInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [checkInSuccess, setCheckInSuccess] = useState<boolean | null>(null)
  const [qrVisible, setQrVisible] = useState(false)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(true)

  useEffect(() => {
    // Fetch timetable and attendance data when authenticated
    if (status === "authenticated") {
      fetchTodayClasses()
      fetchRecentAttendance()
    }
  }, [status])

  const fetchTodayClasses = async () => {
    try {
      setLoading(true)
      
      // Get today's day name
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const today = days[new Date().getDay()]
      
      // Fetch timetable from API
      const response = await fetch('/api/timetable')
      
      if (!response.ok) {
        throw new Error('Failed to fetch timetable')
      }
      
      const data = await response.json()
      
      // Check if user has any classes
      const hasClasses = data.timetable && data.timetable.length > 0
      setIsNewUser(!hasClasses)
      
      if (!hasClasses) {
        setLoading(false)
        return
      }
      
      // Filter for today's classes and transform the data
      const todayClasses = data.timetable
        .filter((item: any) => item.day === today)
        .map((item: any) => ({
          id: item._id,
          subject: item.subject,
          day: item.day,
          period: item.period,
          room: item.room || 'Not specified',
          status: 'upcoming' // Default status
        }))
      
      // Get today's date
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      
      // Fetch today's attendance records
      const attendanceResponse = await fetch(`/api/attendance?startDate=${todayDate.toISOString()}`)
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        
        // Update classes with attendance status
        const updatedClasses = todayClasses.map((cls: any) => {
          const attendanceRecord = attendanceData.attendance.find(
            (record: any) => record.timetableId === cls.id
          )
          
          if (attendanceRecord && attendanceRecord.attended) {
            return { ...cls, status: 'checked-in' }
          }
          
          return cls
        })
        
        setClasses(updatedClasses)
      } else {
        setClasses(todayClasses)
      }
      
      // Update class statuses based on current time
      updateClassStatuses(todayClasses)
    } catch (error) {
      console.error('Error fetching today\'s classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentAttendance = async () => {
    try {
      // Get date for 7 days ago
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      // Fetch recent attendance from API
      const response = await fetch(`/api/attendance?startDate=${sevenDaysAgo.toISOString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records')
      }
      
      const data = await response.json()
      
      // Transform the data
      const recentRecords = data.attendance.map((item: any) => ({
        id: item._id,
        subject: item.subject,
        date: new Date(item.date).toLocaleDateString(),
        day: item.day,
        period: item.period,
        attended: item.attended
      }))
      
      setRecentAttendance(recentRecords)
    } catch (error) {
      console.error('Error fetching recent attendance:', error)
    }
  }

  const updateClassStatuses = (classList: ClassItem[]) => {
    const now = new Date()
    const currentHour = now.getHours()
    
    // Map period to approximate hour (adjust as needed)
    const periodToHour: Record<string, number> = {
      "1st Period": 8,
      "2nd Period": 9,
      "3rd Period": 10,
      "4th Period": 11,
      "5th Period": 13, // After lunch
      "6th Period": 14,
      "7th Period": 15,
      "8th Period": 16
    }
    
    const updatedClasses = classList.map(cls => {
      const classHour = periodToHour[cls.period] || 0
      
      // Class is in the past
      if (classHour < currentHour && currentHour - classHour < 2) {
        return { ...cls, status: "in-progress" }
      } else if (classHour < currentHour) {
        return { ...cls, status: "missed" }
      }
      return cls
    })
    
    setClasses(updatedClasses)
    
    // Update every minute
    setTimeout(() => {
      updateClassStatuses(updatedClasses)
    }, 60000)
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your check-in page</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  const handleCheckIn = async (classId: string) => {
    setIsCheckingIn(true)
    const classToCheckIn = classes.find(c => c.id === classId)
    setSelectedClass(classToCheckIn?.subject || "")
    
    try {
      // Record attendance via API
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timetableId: classId,
          day: classToCheckIn?.day,
          period: classToCheckIn?.period,
          date: new Date().toISOString().split('T')[0],
          attended: true
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record attendance')
      }
      
      // Update the class status
      setClasses(classes.map(cls => 
        cls.id === classId ? { ...cls, status: "checked-in" } : cls
      ))
      
      setCheckInSuccess(true)
      
      // Refresh recent attendance
      fetchRecentAttendance()
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setCheckInSuccess(null)
      }, 3000)
    } catch (error) {
      console.error('Error recording attendance:', error)
      setCheckInSuccess(false)
    } finally {
      setIsCheckingIn(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-in":
        return "text-green-500"
      case "in-progress":
        return "text-amber-500"
      case "missed":
        return "text-red-500"
      default:
        return "text-blue-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "checked-in":
        return "Checked In"
      case "in-progress":
        return "In Progress"
      case "missed":
        return "Missed"
      default:
        return "Upcoming"
    }
  }

  const toggleQrCode = () => {
    setQrVisible(!qrVisible)
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Check-In</h1>
        <p className="text-muted-foreground">
          Mark your attendance for today's classes
        </p>
      </div>

      {checkInSuccess && (
        <Alert className="mb-6" variant="default">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Check-In Successful</AlertTitle>
          <AlertDescription>You have successfully checked in to {selectedClass}.</AlertDescription>
        </Alert>
      )}

      {isNewUser ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to Check-In!</CardTitle>
            <CardDescription>
              Start by adding classes to your timetable to enable attendance tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-8">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Classes Found</h3>
              <p className="text-center text-muted-foreground mb-6">
                You haven't added any classes to your timetable yet. 
                Add classes to start tracking your attendance.
              </p>
              <Button onClick={() => router.push('/timetable')}>
                Set Up Your Timetable
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classes.length}</div>
                <p className="text-sm text-muted-foreground">
                  {classes.filter(c => c.status === "checked-in").length} checked in
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentAttendance.length > 0 
                    ? Math.round((recentAttendance.filter(r => r.attended).length / recentAttendance.length) * 100) 
                    : 0}%
                </div>
                <div className="mt-2">
                  <Progress 
                    value={recentAttendance.length > 0 
                      ? (recentAttendance.filter(r => r.attended).length / recentAttendance.length) * 100 
                      : 0} 
                    className="h-2" 
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {recentAttendance.filter(r => r.attended).length} of {recentAttendance.length} classes attended this week
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="today" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="today">Today's Classes</TabsTrigger>
              <TabsTrigger value="qrcode">QR Check-In</TabsTrigger>
              <TabsTrigger value="history">Recent Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="space-y-4">
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <Card key={cls.id} className="overflow-hidden">
                    <div className={`h-2 ${cls.status === "checked-in" ? "bg-green-500" : cls.status === "in-progress" ? "bg-amber-500" : cls.status === "missed" ? "bg-red-500" : "bg-blue-500"}`}></div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{cls.subject}</CardTitle>
                          <CardDescription>{cls.room}</CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cls.status)}`}>
                          {getStatusText(cls.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{cls.period}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-3">
                      {cls.status === "upcoming" || cls.status === "in-progress" ? (
                        <Button 
                          className="w-full" 
                          onClick={() => handleCheckIn(cls.id)}
                          disabled={isCheckingIn}
                        >
                          {isCheckingIn && selectedClass === cls.subject ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Checking In...
                            </>
                          ) : (
                            "Check In"
                          )}
                        </Button>
                      ) : cls.status === "checked-in" ? (
                        <Button variant="outline" className="w-full" disabled>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Checked In
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Missed
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Classes Today</CardTitle>
                    <CardDescription>
                      You don't have any classes scheduled for today.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center py-6">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground">
                      Check back on your next scheduled class day or update your timetable.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => router.push('/timetable')}>
                      View Timetable
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="qrcode" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Check-In</CardTitle>
                  <CardDescription>
                    Scan the QR code displayed by your instructor to check in to class
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Button 
                    variant="outline" 
                    className="mb-6"
                    onClick={toggleQrCode}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {qrVisible ? "Hide QR Code" : "Show My QR Code"}
                  </Button>
                  
                  {qrVisible && (
                    <div className="border p-4 rounded-lg mb-4">
                      <div className="w-64 h-64 bg-white flex items-center justify-center">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`student:${session?.user?.email}`)}`} 
                          alt="Your QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Show this to your instructor to verify your attendance
                      </p>
                    </div>
                  )}
                  
                  <div className="w-full mt-4">
                    <Label htmlFor="manual-code" className="mb-2 block">Or enter a check-in code:</Label>
                    <div className="flex gap-2">
                      <Input id="manual-code" placeholder="Enter code" />
                      <Button>Submit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((record) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{record.subject}</CardTitle>
                          <CardDescription>{record.day} - {record.period}</CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${record.attended ? "text-green-500" : "text-red-500"}`}>
                          {record.attended ? "Present" : "Absent"}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{record.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">
                    Your recent attendance activity will appear here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
} 
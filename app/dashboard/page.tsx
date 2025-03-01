"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CalendarDays, 
  Clock, 
  GraduationCap, 
  LineChart, 
  BarChart, 
  Calendar, 
  CheckCircle, 
  Bell, 
  Trophy,
  Flame,
  AlertTriangle,
  PlusCircle,
  BookOpen,
  Sparkles
} from "lucide-react"

// Define types for our data
interface AttendanceStats {
  overall: {
    totalClasses: number;
    attendedClasses: number;
    attendanceRate: number;
    totalHours: number;
    attendedHours: number;
    hourlyAttendanceRate: number;
    status: string;
  };
  subjects: {
    subject: string;
    totalClasses: number;
    attendedClasses: number;
    attendanceRate: number;
    totalHours: number;
    attendedHours: number;
    hourlyAttendanceRate: number;
    status: string;
    classesNeeded: number;
    trend: string;
    recentAttendance: number[];
  }[];
  monthly: any[];
  weekly: any[];
  dayWise: any[];
}

interface TodayClass {
  id: string;
  subject: string;
  period: string;
  room: string;
  attended?: boolean | null; // null means not yet marked
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isNewUser, setIsNewUser] = useState(true)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([])
  const [nextClass, setNextClass] = useState<TodayClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
    
    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch timetable data
      const timetableResponse = await fetch('/api/timetable')
      
      if (!timetableResponse.ok) {
        throw new Error('Failed to fetch timetable')
      }
      
      const timetableData = await timetableResponse.json()
      
      // Check if user has any timetable entries
      if (timetableData.timetable.length === 0) {
        setIsNewUser(true)
        setLoading(false)
        return
      }
      
      // User has timetable entries, not a new user
      setIsNewUser(false)
      
      // Get today's classes
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const today = days[new Date().getDay()]
      
      const classesToday = timetableData.timetable
        .filter((item: any) => item.day === today)
        .map((item: any) => ({
          id: item._id,
          subject: item.subject,
          period: item.period,
          room: item.room || 'Not specified',
          attended: null // Default to not marked
        }))
      
      // Get today's date
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      
      // Fetch today's attendance records
      const attendanceResponse = await fetch(`/api/attendance?startDate=${todayDate.toISOString()}`)
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        
        // Update classes with attendance status
        const updatedClasses = classesToday.map((cls: TodayClass) => {
          const attendanceRecord = attendanceData.attendance.find(
            (record: any) => record.timetableId === cls.id
          )
          
          return {
            ...cls,
            attended: attendanceRecord ? attendanceRecord.attended : null
          }
        })
        
        setTodayClasses(updatedClasses)
      } else {
        setTodayClasses(classesToday)
      }
      
      // Find next class based on current time
      if (classesToday.length > 0) {
        const currentHour = new Date().getHours()
        
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
        
        // Sort classes by period hour
        const sortedClasses = [...classesToday].sort((a, b) => {
          const hourA = periodToHour[a.period] || 0
          const hourB = periodToHour[b.period] || 0
          return hourA - hourB
        })
        
        // Find next class (first class with hour > current hour)
        const next = sortedClasses.find(cls => {
          const classHour = periodToHour[cls.period] || 0
          return classHour > currentHour
        })
        
        setNextClass(next || null)
      }
      
      // Fetch attendance statistics
      const statsResponse = await fetch('/api/attendance/stats')
      
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch attendance statistics')
      }
      
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch unread notifications
      const notificationsResponse = await fetch('/api/notifications/unread')
      
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setUnreadNotifications(notificationsData.unreadNotifications)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendancePrompt = async (classId: string, attended: boolean) => {
    try {
      const response = await fetch('/api/attendance/prompt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timetableId: classId,
          attended
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to record attendance')
      }
      
      // Update the class in the local state
      setTodayClasses(classes => 
        classes.map(cls => 
          cls.id === classId ? { ...cls, attended } : cls
        )
      )
      
      // Refresh stats
      const statsResponse = await fetch('/api/attendance/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error recording attendance:', error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {session?.user?.name}! {isNewUser ? "Let's set up your attendance tracking." : "Here's an overview of your attendance."}
        </p>
      </div>

      {isNewUser ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">Get Started with Attendance Tracking</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Welcome to your attendance dashboard! Start by setting up your timetable to track your classes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="flex items-center gap-2">
                  <Link href="/timetable">
                    <PlusCircle className="h-4 w-4" />
                    Create Your Timetable
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/check-in">Explore Check-in Features</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayClasses.length}</div>
              {todayClasses.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {todayClasses.map(cls => cls.subject).join(', ')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No classes scheduled today</p>
              )}
              <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                <Link href="/timetable">View timetable</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Class</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nextClass ? nextClass.subject : '--'}
              </div>
              {nextClass ? (
                <p className="text-xs text-muted-foreground">
                  {nextClass.period} in {nextClass.room}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No upcoming classes today</p>
              )}
              <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                <Link href="/check-in">Check in</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.overall?.attendedClasses && stats.overall.attendedClasses > 0 ? '1 day' : '0 days'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.overall?.attendedClasses && stats.overall.attendedClasses > 0 
                  ? 'Keep it up!' 
                  : 'Start your streak!'}
              </p>
              <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                <Link href="/achievements">View achievements</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.subjects ? stats.subjects.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.subjects && stats.subjects.length > 0 
                  ? `${stats.subjects.filter(s => s.hourlyAttendanceRate >= 75).length} subjects above 75%` 
                  : 'No subjects added yet'}
              </p>
              <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                <Link href="/timetable">Manage subjects</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Actions
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-none overflow-hidden group hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Check In</CardTitle>
            <CardDescription>Mark your attendance</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex justify-center py-2 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary/90 hover:bg-primary group-hover:shadow-sm" asChild>
              <Link href="/check-in" className="flex items-center justify-center gap-1">
                Check In Now
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border-none overflow-hidden group hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Achievements</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex justify-center py-2 group-hover:scale-110 transition-transform duration-300">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-yellow-200 dark:border-yellow-900 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 group-hover:shadow-sm" asChild>
              <Link href="/achievements" className="flex items-center justify-center gap-1">
                View Achievements
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-none overflow-hidden group hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Stay updated</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex justify-center py-2 group-hover:scale-110 transition-transform duration-300">
              <Bell className="h-8 w-8 text-primary" />
              {unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full group-hover:shadow-sm" asChild>
              <Link href="/notifications" className="flex items-center justify-center gap-1">
                View Notifications
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-none overflow-hidden group hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Timetable</CardTitle>
            <CardDescription>Manage your schedule</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex justify-center py-2 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-green-200 dark:border-green-900 hover:bg-green-100 dark:hover:bg-green-900/50 group-hover:shadow-sm" asChild>
              <Link href="/timetable" className="flex items-center justify-center gap-1">
                View Timetable
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Timetable</CardTitle>
            <CardDescription>
              Manage your weekly class schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              View and manage your class schedule for the week. Add new classes and keep track of your timetable.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/timetable">View Timetable</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>
              Analyze your attendance patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <BarChart className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              View detailed statistics and charts about your attendance. Track your progress and identify areas for improvement.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/statistics">View Statistics</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>
              View and manage your subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isNewUser ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground text-center">
                  No subjects added yet. Create your timetable to start tracking attendance for your subjects.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/timetable">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Subjects
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 font-medium">Subject</div>
                  <div className="text-right font-medium">Attendance</div>
                </div>
                {stats?.subjects && stats.subjects.length > 0 ? (
                  <div className="space-y-3">
                    {stats.subjects.map((subject, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center">
                        <div className="col-span-2 truncate">{subject.subject}</div>
                        <div className="text-right">
                          <span className={`font-medium ${subject.hourlyAttendanceRate >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                            {subject.hourlyAttendanceRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No attendance data yet
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isNewUser && (
        <>
          {/* Subject Attendance Section */}
          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Subject Attendance
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            {stats?.subjects && stats.subjects.map((subject, index) => (
              <Card 
                key={index} 
                className="border overflow-hidden group transition-all duration-300 hover:shadow-md dark:hover:shadow-primary/5"
              >
                <div className={`h-1.5 w-full ${subject.hourlyAttendanceRate >= 75 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{subject.subject}</CardTitle>
                      <CardDescription>
                        {subject.totalHours} total hours
                      </CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subject.hourlyAttendanceRate >= 75 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {subject.hourlyAttendanceRate >= 75 ? 'On Track' : 'At Risk'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <div className="text-3xl font-bold">
                      {subject.hourlyAttendanceRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      of required 75%
                    </div>
                  </div>
                  
                  <div className="mt-3 relative">
                    <div className="absolute h-2 w-full bg-muted rounded-full"></div>
                    <div className="absolute h-2 w-3/4 bg-muted-foreground/20 rounded-full"></div>
                    <Progress 
                      value={subject.hourlyAttendanceRate} 
                      className={`h-2 relative z-10 ${subject.hourlyAttendanceRate >= 75 ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"}`}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      {subject.attendedHours} of {subject.totalHours} hours attended
                    </p>
                    <p className="text-xs font-medium">
                      {((subject.attendedHours / subject.totalHours) * 100).toFixed(0)}% classes
                    </p>
                  </div>
                  
                  {/* Mini trend visualization */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Recent Attendance</span>
                      <span className={`text-xs ${subject.trend === 'up' ? 'text-green-500' : subject.trend === 'down' ? 'text-red-500' : 'text-yellow-500'}`}>
                        {subject.trend === 'up' ? '↑ Improving' : subject.trend === 'down' ? '↓ Declining' : '→ Stable'}
                      </span>
                    </div>
                    <div className="flex items-end h-8 gap-1 mt-1">
                      {subject.recentAttendance.map((value, i) => (
                        <div 
                          key={i} 
                          className={`w-full ${value ? 'bg-green-500' : 'bg-red-500'} rounded-sm transition-all duration-300 group-hover:opacity-80`}
                          style={{ height: value ? '100%' : '30%' }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  {subject.hourlyAttendanceRate < 75 && (
                    <div className="mt-3 flex items-center p-2 rounded-md bg-red-50 dark:bg-red-950/50 text-xs text-red-800 dark:text-red-200 animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>
                        {subject.classesNeeded > 0 
                          ? `Need to attend ${subject.classesNeeded} more classes to reach 75%` 
                          : 'Below 75% minimum requirement'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Today's Classes Section */}
          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Today's Classes
          </h2>
          {todayClasses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayClasses.map((cls) => (
                <Card key={cls.id} className="relative overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    cls.attended === true ? 'bg-green-500' : 
                    cls.attended === false ? 'bg-red-500' : 
                    'bg-blue-500'
                  }`}></div>
                  <CardHeader className="pb-2 pl-6">
                    <CardTitle className="text-lg">{cls.subject}</CardTitle>
                    <CardDescription>
                      {cls.period} • {cls.room}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-6">
                    {cls.attended === null ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">Did you attend this class?</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            onClick={() => handleAttendancePrompt(cls.id, false)}
                          >
                            No
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleAttendancePrompt(cls.id, true)}
                          >
                            Yes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${cls.attended ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-sm font-medium">
                          {cls.attended ? 'Attended' : 'Missed'}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto text-xs"
                          onClick={() => handleAttendancePrompt(cls.id, !cls.attended)}
                        >
                          Change
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">No classes scheduled for today</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enjoy your day off or add classes to your timetable
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}


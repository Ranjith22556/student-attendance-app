"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Button } from "@/components/ui/button"

// Define types for statistics
interface SubjectStats {
  id: string;
  subject: string;
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number;
}

interface MonthlyData {
  month: string;
  attendance: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function StatisticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subjects, setSubjects] = useState<SubjectStats[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [overallAttendance, setOverallAttendance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch timetable data to check if user has any entries
      const timetableResponse = await fetch('/api/timetable')
      if (!timetableResponse.ok) {
        throw new Error('Failed to fetch timetable')
      }
      
      const timetableData = await timetableResponse.json()
      const hasClasses = timetableData.timetable && timetableData.timetable.length > 0
      setIsNewUser(!hasClasses)
      
      if (!hasClasses) {
        setLoading(false)
        return
      }
      
      // Fetch attendance stats
      const statsResponse = await fetch('/api/attendance/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch attendance statistics')
      }
      
      const statsData = await statsResponse.json()
      
      // Process subject data
      if (statsData.subjects && statsData.subjects.length > 0) {
        const subjectStats = statsData.subjects.map((subject: any, index: number) => ({
          id: index.toString(),
          subject: subject.subject,
          totalClasses: subject.totalClasses || 0,
          attendedClasses: subject.attendedClasses || 0,
          attendanceRate: subject.attendanceRate || 0
        }))
        
        setSubjects(subjectStats)
      }
      
      // Set overall attendance
      if (statsData.overall) {
        setOverallAttendance(Math.round(statsData.overall.attendanceRate || 0))
      }
      
      // Generate monthly data (simplified for now)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const currentMonth = new Date().getMonth()
      
      const monthlyStats = months.map((month, index) => {
        // For now, we'll use a simplified approach
        // In a real app, you'd query attendance data by month
        if (index <= currentMonth) {
          return {
            month,
            attendance: index === currentMonth 
              ? (statsData.overall?.attendanceRate || 0) 
              : 0
          }
        }
        return { month, attendance: 0 }
      })
      
      setMonthlyData(monthlyStats)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your statistics</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  const pieData = subjects.map(subject => ({
    name: subject.subject,
    value: subject.attendanceRate
  }))

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return "text-green-500"
    if (percentage >= 75) return "text-yellow-500"
    return "text-red-500"
  }

  const getStatusText = (percentage: number): string => {
    if (percentage >= 90) return "Excellent"
    if (percentage >= 75) return "Good"
    return "Needs Improvement"
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Statistics</h1>
        <p className="text-muted-foreground">
          Analyze your attendance patterns and performance
        </p>
      </div>

      {isNewUser ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to Statistics!</CardTitle>
            <CardDescription>
              Start adding classes to your timetable and tracking attendance to view your statistics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Your statistics will appear here once you:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Create your personalized class schedule in the Timetable section</li>
              <li>Check in to your classes regularly</li>
              <li>Build up attendance data over time</li>
            </ul>
            <Button onClick={() => router.push('/timetable')}>
              Set Up Your Timetable
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallAttendance}%</div>
                <p className={`text-sm ${getStatusColor(overallAttendance)}`}>
                  {getStatusText(overallAttendance)}
                </p>
              </CardContent>
            </Card>
            
            {subjects.length > 0 && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {subjects.reduce((best, subject) => (subject.attendanceRate > best.attendanceRate ? subject : best)).subject}
                    </div>
                    <p className="text-sm text-green-500">
                      {Math.round(subjects.reduce((best, subject) => (subject.attendanceRate > best.attendanceRate ? subject : best)).attendanceRate)}% attendance
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {subjects.reduce((worst, subject) => (subject.attendanceRate < worst.attendanceRate ? subject : worst)).subject}
                    </div>
                    <p className="text-sm text-red-500">
                      {Math.round(subjects.reduce((worst, subject) => (subject.attendanceRate < worst.attendanceRate ? subject : worst)).attendanceRate)}% attendance
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subjects">By Subject</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="semester">Current Semester</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="overview" className="space-y-6">
              {subjects.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Overview</CardTitle>
                      <CardDescription>Your attendance percentage by subject</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={subjects}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="subject" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                            <Legend />
                            <Bar dataKey="attendanceRate" name="Attendance %" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Distribution</CardTitle>
                      <CardDescription>Relative attendance across subjects</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div className="h-[300px] w-full max-w-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Data Available</CardTitle>
                    <CardDescription>
                      Start checking in to your classes to generate attendance statistics.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Your attendance data will be displayed here once you've checked in to some classes.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4">
              {subjects.length > 0 ? (
                subjects.map(subject => (
                  <Card key={subject.id}>
                    <CardHeader>
                      <CardTitle>{subject.subject}</CardTitle>
                      <CardDescription>
                        Attended {subject.attendedClasses} out of {subject.totalClasses} classes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Attendance Percentage</span>
                          <span className={getStatusColor(subject.attendanceRate)}>{Math.round(subject.attendanceRate)}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${subject.attendanceRate >= 75 ? 'bg-primary' : 'bg-red-500'}`} 
                            style={{ width: `${subject.attendanceRate}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {subject.attendanceRate >= 75 
                            ? "You're doing well in this subject!" 
                            : "Your attendance is below the required minimum of 75%."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Subjects Available</CardTitle>
                    <CardDescription>
                      Add subjects to your timetable to see subject-specific statistics.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => router.push('/timetable')}>
                      Go to Timetable
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Attendance Trends</CardTitle>
                  <CardDescription>Your attendance percentage over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                        <Legend />
                        <Bar dataKey="attendance" name="Attendance %" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
} 
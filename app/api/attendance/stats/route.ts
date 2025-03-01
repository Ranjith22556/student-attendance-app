import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { ObjectId } from 'mongodb'

// GET /api/attendance/stats - Get attendance statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user ID from email
    const usersCollection = await getCollection('users')
    const user = await usersCollection.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get query parameters for date range filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build date query if provided
    const dateQuery: any = {}
    if (startDate || endDate) {
      if (startDate) {
        dateQuery.$gte = new Date(startDate)
      }
      if (endDate) {
        dateQuery.$lte = new Date(endDate)
      }
    }
    
    // Get timetable entries for this user
    const timetableCollection = await getCollection('timetable')
    const timetable = await timetableCollection.find({ 
      userId: user._id 
    }).toArray()
    
    // Get attendance records with date filtering if applicable
    const attendanceCollection = await getCollection('attendance')
    const attendanceQuery: any = { userId: user._id }
    
    if (Object.keys(dateQuery).length > 0) {
      attendanceQuery.date = dateQuery
    }
    
    const attendance = await attendanceCollection.find(attendanceQuery).toArray()
    
    // Get unique subjects from timetable
    const uniqueSubjects = [...new Set(timetable.map(item => item.subject))]
    
    // Calculate statistics for each subject
    const subjectStats = uniqueSubjects.map(subject => {
      // Get all timetable entries for this subject
      const subjectEntries = timetable.filter(entry => entry.subject === subject)
      
      // Get the first entry to access totalHours and attendedHours
      const firstEntry = subjectEntries[0]
      
      // Get all attendance records for this subject
      const subjectAttendance = attendance.filter(a => a.subject === subject)
      
      // Calculate attendance metrics
      const totalClasses = subjectAttendance.length
      const attendedClasses = subjectAttendance.filter(a => a.attended).length
      
      // Calculate attendance rate based on recorded classes
      const recordedAttendanceRate = totalClasses > 0 
        ? (attendedClasses / totalClasses) * 100 
        : 0
      
      // Calculate attendance rate based on total and attended hours from timetable
      const hourlyAttendanceRate = firstEntry.totalHours > 0 
        ? (firstEntry.attendedHours / firstEntry.totalHours) * 100 
        : 0
      
      // Get recent attendance trend (last 5 classes)
      const recentAttendance = subjectAttendance
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(a => a.attended ? 1 : 0)
      
      // Calculate if attendance is improving, steady, or declining
      let trend = "steady"
      if (recentAttendance.length >= 3) {
        const recentSum = recentAttendance.slice(0, 3).reduce((sum: number, val: number) => sum + val, 0)
        const earlierSum = recentAttendance.length > 3 
          ? recentAttendance.slice(3).reduce((sum: number, val: number) => sum + val, 0) 
          : 0
        
        if (recentSum > earlierSum) trend = "improving"
        else if (recentSum < earlierSum) trend = "declining"
      }
      
      // Calculate classes needed to reach 75% attendance
      const currentAttendance = firstEntry.attendedHours
      const currentTotal = firstEntry.totalHours
      const targetPercentage = 75
      
      let classesNeeded = 0
      if ((currentAttendance / currentTotal) * 100 < targetPercentage) {
        // Formula: (currentAttended + x) / (currentTotal + x) = targetPercentage/100
        // Solving for x: x = (targetPercentage*currentTotal - 100*currentAttended) / (100 - targetPercentage)
        classesNeeded = Math.ceil(
          (targetPercentage * currentTotal - 100 * currentAttendance) / (100 - targetPercentage)
        )
        if (classesNeeded < 0) classesNeeded = 0
      }
      
      return {
        subject,
        totalHours: firstEntry.totalHours,
        attendedHours: firstEntry.attendedHours,
        totalClasses,
        attendedClasses,
        recordedAttendanceRate,
        hourlyAttendanceRate,
        attendanceRate: hourlyAttendanceRate, // Use hourly rate as the primary rate
        trend,
        recentAttendance,
        classesNeeded,
        status: hourlyAttendanceRate >= 75 ? "good" : "at-risk"
      }
    })
    
    // Calculate monthly attendance data
    const monthlyData = calculateMonthlyAttendance(attendance)
    
    // Calculate weekly attendance data
    const weeklyData = calculateWeeklyAttendance(attendance)
    
    // Calculate day-wise attendance patterns
    const dayWiseData = calculateDayWiseAttendance(attendance)
    
    // Overall statistics
    const totalClasses = attendance.length
    const attendedClasses = attendance.filter(a => a.attended).length
    const overallAttendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
    
    // Calculate total hours from timetable
    const totalHours = timetable.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
    const attendedHours = timetable.reduce((sum, entry) => sum + (entry.attendedHours || 0), 0)
    const overallHourlyRate = totalHours > 0 ? (attendedHours / totalHours) * 100 : 0
    
    return NextResponse.json({
      overall: {
        totalClasses,
        attendedClasses,
        attendanceRate: overallAttendanceRate,
        totalHours,
        attendedHours,
        hourlyAttendanceRate: overallHourlyRate,
        status: overallHourlyRate >= 75 ? "good" : "at-risk"
      },
      subjects: subjectStats,
      monthly: monthlyData,
      weekly: weeklyData,
      dayWise: dayWiseData
    })
  } catch (error) {
    console.error('Error fetching attendance statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance statistics' },
      { status: 500 }
    )
  }
}

// Helper function to calculate monthly attendance
function calculateMonthlyAttendance(attendance: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthlyData = Array(12).fill(0).map((_, i) => ({
    month: months[i],
    totalClasses: 0,
    attendedClasses: 0,
    attendanceRate: 0
  }))
  
  attendance.forEach(record => {
    const date = new Date(record.date)
    const month = date.getMonth()
    
    monthlyData[month].totalClasses++
    if (record.attended) {
      monthlyData[month].attendedClasses++
    }
  })
  
  // Calculate attendance rates
  monthlyData.forEach(month => {
    if (month.totalClasses > 0) {
      month.attendanceRate = (month.attendedClasses / month.totalClasses) * 100
    }
  })
  
  return monthlyData
}

// Helper function to calculate weekly attendance
function calculateWeeklyAttendance(attendance: any[]) {
  // Get the last 10 weeks
  const now = new Date()
  const weeklyData = []
  
  for (let i = 9; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7 + now.getDay()))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    const weekAttendance = attendance.filter(record => {
      const date = new Date(record.date)
      return date >= weekStart && date <= weekEnd
    })
    
    const totalClasses = weekAttendance.length
    const attendedClasses = weekAttendance.filter(a => a.attended).length
    const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
    
    weeklyData.push({
      week: `Week ${10-i}`,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      totalClasses,
      attendedClasses,
      attendanceRate
    })
  }
  
  return weeklyData
}

// Helper function to calculate day-wise attendance patterns
function calculateDayWiseAttendance(attendance: any[]) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayWiseData = days.map(day => ({
    day,
    totalClasses: 0,
    attendedClasses: 0,
    attendanceRate: 0
  }))
  
  attendance.forEach(record => {
    const date = new Date(record.date)
    const dayIndex = date.getDay()
    
    dayWiseData[dayIndex].totalClasses++
    if (record.attended) {
      dayWiseData[dayIndex].attendedClasses++
    }
  })
  
  // Calculate attendance rates
  dayWiseData.forEach(day => {
    if (day.totalClasses > 0) {
      day.attendanceRate = (day.attendedClasses / day.totalClasses) * 100
    }
  })
  
  return dayWiseData
} 
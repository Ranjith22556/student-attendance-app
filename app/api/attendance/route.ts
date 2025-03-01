import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { ObjectId } from 'mongodb'

// GET /api/attendance - Get user's attendance records
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build query
    const query: any = { userId: user._id }
    
    if (subjectId) {
      query.subjectId = new ObjectId(subjectId)
    }
    
    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate)
      }
      if (endDate) {
        query.date.$lte = new Date(endDate)
      }
    }
    
    // Get attendance records
    const attendanceCollection = await getCollection('attendance')
    const attendance = await attendanceCollection.find(query).sort({ date: -1 }).toArray()
    
    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

// POST /api/attendance - Record attendance
export async function POST(request: NextRequest) {
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
    
    // Get attendance data from request
    const { day, period, date, attended, timetableId } = await request.json()
    
    if (!day || !period || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Find the class in the timetable
    const timetableCollection = await getCollection('timetable')
    let classEntry;
    
    if (timetableId) {
      classEntry = await timetableCollection.findOne({
        _id: new ObjectId(timetableId),
        userId: user._id
      });
    } else {
      classEntry = await timetableCollection.findOne({
        userId: user._id,
        day,
        period
      });
    }
    
    if (!classEntry) {
      return NextResponse.json(
        { error: 'No class found for the specified day and period' },
        { status: 404 }
      )
    }
    
    // Check if attendance already recorded for this date and class
    const attendanceCollection = await getCollection('attendance')
    const existingAttendance = await attendanceCollection.findOne({
      userId: user._id,
      timetableId: classEntry._id,
      date: new Date(date)
    })
    
    // Update the subject's attended hours in the timetable
    const attendanceChange = attended === true ? 1 : 0;
    const previousAttendance = existingAttendance?.attended === true ? 1 : 0;
    const hoursDifference = attendanceChange - previousAttendance;
    
    if (hoursDifference !== 0) {
      // Update all entries for this subject
      await timetableCollection.updateMany(
        { 
          userId: user._id,
          subject: classEntry.subject
        },
        { 
          $inc: { 
            attendedHours: hoursDifference,
            totalHours: existingAttendance ? 0 : 1 // Only increment total hours if this is a new record
          } 
        }
      );
    }
    
    if (existingAttendance) {
      // Update existing attendance record
      const result = await attendanceCollection.updateOne(
        { _id: existingAttendance._id },
        { $set: { attended: attended === true, updatedAt: new Date() } }
      )
      
      return NextResponse.json({
        success: true,
        updated: true,
        message: 'Attendance record updated',
        hoursDifference
      })
    } else {
      // Create new attendance record
      const result = await attendanceCollection.insertOne({
        userId: user._id,
        timetableId: classEntry._id,
        subject: classEntry.subject,
        day,
        period,
        date: new Date(date),
        attended: attended === true,
        createdAt: new Date()
      })
      
      return NextResponse.json({
        success: true,
        id: result.insertedId,
        message: 'Attendance recorded',
        hoursDifference
      })
    }
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}

// PUT /api/attendance/prompt - Record attendance from dashboard prompt
export async function PUT(request: NextRequest) {
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
    
    // Get attendance data from request
    const { timetableId, attended } = await request.json()
    
    if (!timetableId) {
      return NextResponse.json(
        { error: 'Missing timetable ID' },
        { status: 400 }
      )
    }
    
    // Find the class in the timetable
    const timetableCollection = await getCollection('timetable')
    const classEntry = await timetableCollection.findOne({
      _id: new ObjectId(timetableId),
      userId: user._id
    })
    
    if (!classEntry) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }
    
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if attendance already recorded for today and this class
    const attendanceCollection = await getCollection('attendance')
    const existingAttendance = await attendanceCollection.findOne({
      userId: user._id,
      timetableId: classEntry._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    })
    
    // Update the subject's attended hours in the timetable
    const attendanceChange = attended === true ? 1 : 0;
    const previousAttendance = existingAttendance?.attended === true ? 1 : 0;
    const hoursDifference = attendanceChange - previousAttendance;
    
    if (hoursDifference !== 0) {
      // Update all entries for this subject
      await timetableCollection.updateMany(
        { 
          userId: user._id,
          subject: classEntry.subject
        },
        { 
          $inc: { 
            attendedHours: hoursDifference,
            totalHours: existingAttendance ? 0 : 1 // Only increment total hours if this is a new record
          } 
        }
      );
    }
    
    if (existingAttendance) {
      // Update existing attendance record
      const result = await attendanceCollection.updateOne(
        { _id: existingAttendance._id },
        { $set: { attended: attended === true, updatedAt: new Date() } }
      )
      
      return NextResponse.json({
        success: true,
        updated: true,
        message: 'Attendance record updated'
      })
    } else {
      // Create new attendance record
      const result = await attendanceCollection.insertOne({
        userId: user._id,
        timetableId: classEntry._id,
        subject: classEntry.subject,
        day: classEntry.day,
        period: classEntry.period,
        date: new Date(),
        attended: attended === true,
        createdAt: new Date()
      })
      
      return NextResponse.json({
        success: true,
        id: result.insertedId,
        message: 'Attendance recorded'
      })
    }
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}

// GET /api/attendance/stats - Get attendance statistics
export async function GET_STATS(request: NextRequest) {
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
    
    // Get timetable entries for this user
    const timetableCollection = await getCollection('timetable')
    const timetable = await timetableCollection.find({ 
      userId: user._id 
    }).toArray()
    
    // Get attendance records
    const attendanceCollection = await getCollection('attendance')
    const attendance = await attendanceCollection.find({
      userId: user._id
    }).toArray()
    
    // Calculate statistics
    const subjectStats = timetable.reduce((acc: any, classEntry) => {
      const subjectAttendance = attendance.filter(a => 
        a.timetableId.toString() === classEntry._id.toString()
      )
      
      const totalClasses = subjectAttendance.length
      const attendedClasses = subjectAttendance.filter(a => a.attended).length
      const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
      
      if (!acc[classEntry.subject]) {
        acc[classEntry.subject] = {
          subject: classEntry.subject,
          totalClasses,
          attendedClasses,
          attendanceRate
        }
      } else {
        acc[classEntry.subject].totalClasses += totalClasses
        acc[classEntry.subject].attendedClasses += attendedClasses
        acc[classEntry.subject].attendanceRate = 
          (acc[classEntry.subject].attendedClasses / acc[classEntry.subject].totalClasses) * 100
      }
      
      return acc
    }, {})
    
    // Overall statistics
    const totalClasses = attendance.length
    const attendedClasses = attendance.filter(a => a.attended).length
    const overallAttendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
    
    return NextResponse.json({
      overall: {
        totalClasses,
        attendedClasses,
        attendanceRate: overallAttendanceRate
      },
      subjects: Object.values(subjectStats)
    })
  } catch (error) {
    console.error('Error fetching attendance statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance statistics' },
      { status: 500 }
    )
  }
} 
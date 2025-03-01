import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { ObjectId } from 'mongodb'

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
      timetableId: new ObjectId(timetableId),
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
        timetableId: new ObjectId(timetableId),
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
import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { GET as authHandler } from '@/app/api/auth/[...nextauth]/route'
import { ObjectId } from 'mongodb'

// GET /api/timetable - Get user's timetable
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
    
    // Get timetable entries for this user
    const timetableCollection = await getCollection('timetable')
    const timetable = await timetableCollection.find({ 
      userId: user._id 
    }).toArray()
    
    return NextResponse.json({ timetable })
  } catch (error) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timetable' },
      { status: 500 }
    )
  }
}

// POST /api/timetable - Add a new class to timetable
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
    
    // Get class data from request
    const { day, period, subject, room, totalHours, attendedHours } = await request.json()
    
    if (!day || !period || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if there's already a class in this time slot
    const timetableCollection = await getCollection('timetable')
    const existingClass = await timetableCollection.findOne({
      userId: user._id,
      day,
      period
    })
    
    if (existingClass) {
      return NextResponse.json(
        { error: `There is already a class (${existingClass.subject}) scheduled for ${day} at ${period}` },
        { status: 409 }
      )
    }
    
    // Check if this subject already exists for this user
    const existingSubject = await timetableCollection.findOne({
      userId: user._id,
      subject
    })
    
    // If subject exists, use its totalHours and attendedHours
    // If not, use the provided values or defaults
    const subjectData = existingSubject 
      ? { 
          totalHours: existingSubject.totalHours, 
          attendedHours: existingSubject.attendedHours 
        }
      : { 
          totalHours: totalHours || 0, 
          attendedHours: attendedHours || 0 
        }
    
    // Add new class to timetable
    const result = await timetableCollection.insertOne({
      userId: user._id,
      day,
      period,
      subject,
      room: room || 'Not specified',
      totalHours: subjectData.totalHours,
      attendedHours: subjectData.attendedHours,
      createdAt: new Date()
    })
    
    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message: 'Class added to timetable',
      isNewSubject: !existingSubject
    })
  } catch (error) {
    console.error('Error adding class to timetable:', error)
    return NextResponse.json(
      { error: 'Failed to add class to timetable' },
      { status: 500 }
    )
  }
}

// DELETE /api/timetable - Delete a class from timetable
export async function DELETE(request: NextRequest) {
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
    
    // Get class ID from request
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing class ID' },
        { status: 400 }
      )
    }
    
    // Delete class from timetable
    const timetableCollection = await getCollection('timetable')
    const result = await timetableCollection.deleteOne({
      _id: new ObjectId(id),
      userId: user._id
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Class not found or not authorized to delete' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Class deleted from timetable'
    })
  } catch (error) {
    console.error('Error deleting class from timetable:', error)
    return NextResponse.json(
      { error: 'Failed to delete class from timetable' },
      { status: 500 }
    )
  }
} 
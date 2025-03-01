import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Not authenticated',
        session: null
      }, { status: 401 })
    }
    
    // Get user from database
    const usersCollection = await getCollection('users')
    
    // First, try to find user by email
    const userByEmail = await usersCollection.findOne({ email: session.user.email })
    
    // Then, try to find user by id if available
    let userById = null
    if (session.user.id) {
      try {
        userById = await usersCollection.findOne({ _id: new ObjectId(session.user.id) })
      } catch (error) {
        console.error('Error converting session.user.id to ObjectId:', error)
      }
    }
    
    // Get all users in the database (for debugging)
    const allUsers = await usersCollection.find({}).limit(10).toArray()
    
    return NextResponse.json({
      status: 'success',
      message: 'User data retrieved',
      session: {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image
        }
      },
      userByEmail: userByEmail ? {
        _id: userByEmail._id.toString(),
        email: userByEmail.email,
        name: userByEmail.name
      } : null,
      userById: userById ? {
        _id: userById._id.toString(),
        email: userById.email,
        name: userById.name
      } : null,
      allUsers: allUsers.map(user => ({
        _id: user._id.toString(),
        email: user.email,
        name: user.name
      })),
      userCount: allUsers.length
    })
  } catch (error) {
    console.error('Error retrieving user data:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to retrieve user data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
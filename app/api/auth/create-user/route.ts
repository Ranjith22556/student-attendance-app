import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { getServerSession } from 'next-auth/next'

export async function POST(request: NextRequest) {
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
    
    // Get user collection
    const usersCollection = await getCollection('users')
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: session.user.email })
    
    if (existingUser) {
      return NextResponse.json({
        status: 'success',
        message: 'User already exists',
        user: {
          _id: existingUser._id.toString(),
          name: existingUser.name,
          email: existingUser.email
        }
      })
    }
    
    // Create new user
    const newUser = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      createdAt: new Date()
    }
    
    const result = await usersCollection.insertOne(newUser)
    
    return NextResponse.json({
      status: 'success',
      message: 'User created successfully',
      user: {
        _id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'

export async function GET() {
  try {
    // Try to get users collection
    const usersCollection = await getCollection('users')
    const users = await usersCollection.find({}).toArray()

    // Try to get subjects collection
    const subjectsCollection = await getCollection('subjects')
    const subjects = await subjectsCollection.find({}).toArray()

    return NextResponse.json({
      status: 'success',
      message: 'Database is configured correctly!',
      data: {
        users: users.length,
        subjects: subjects.length
      }
    })
  } catch (error) {
    console.error('Database operation error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to perform database operations',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
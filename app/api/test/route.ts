import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDatabase()
    // Try to ping the database
    await db.command({ ping: 1 })
    return NextResponse.json({ status: 'success', message: 'Connected to MongoDB!' })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to MongoDB' },
      { status: 500 }
    )
  }
} 
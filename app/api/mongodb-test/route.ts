import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    // Log the MongoDB URI (with password masked for security)
    const uri = process.env.MONGODB_URI || '';
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log('Attempting to connect to MongoDB with URI:', maskedUri);

    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { status: 'error', message: 'MONGODB_URI environment variable is not set' },
        { status: 500 }
      );
    }

    // Try to connect directly using MongoClient
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    // Try to get database info
    const adminDb = client.db('admin');
    const result = await adminDb.command({ ping: 1 });
    
    // List available databases
    const dbInfo = await client.db().admin().listDatabases();
    const dbNames = dbInfo.databases.map(db => db.name);
    
    await client.close();
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to MongoDB!',
      ping: result,
      availableDatabases: dbNames
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to connect to MongoDB',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
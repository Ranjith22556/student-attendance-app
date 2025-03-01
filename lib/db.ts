// This file would contain MongoDB connection and schema definitions
// For demonstration purposes, we're using mock data instead

import { ObjectId } from "mongodb"
import { MongoClient } from 'mongodb'

// Check for MongoDB URI
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to environment variables')
}

const uri = process.env.MONGODB_URI
// Log connection attempt (with password masked for security)
const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
console.log('MongoDB connection string (masked):', maskedUri);

// MongoDB connection options
const options = {
  // Add any connection options here if needed
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
      .catch(err => {
        console.error('Failed to connect to MongoDB in development mode:', err);
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
    .catch(err => {
      console.error('Failed to connect to MongoDB in production mode:', err);
      throw err;
    });
}

// Export interfaces
export interface UserDocument {
  _id: ObjectId
  name: string
  email: string
  image?: string
  googleId: string
  dob?: string
  phone?: string
  college?: string
  year?: number
  semester?: number
}

export interface SubjectDocument {
  _id: ObjectId
  name: string
  totalHours: number
  attendedHours: number
  schedule: {
    day: string
    hour: number
  }[]
  userId: ObjectId
}

export interface AttendanceDocument {
  _id: ObjectId
  subjectId: ObjectId
  userId: ObjectId
  date: Date
  attended: boolean
}

// Export a module-scoped MongoClient promise
export default clientPromise

export async function getDatabase() {
  try {
    const client = await clientPromise
    // Extract database name from connection string or use default
    let dbName = 'student-attendance';
    
    // Try to extract database name from connection string if present
    const uriMatch = uri.match(/\/([^/?]+)(\?|$)/);
    if (uriMatch && uriMatch[1]) {
      dbName = uriMatch[1];
      console.log(`Using database name from connection string: ${dbName}`);
    } else {
      console.log(`Using default database name: ${dbName}`);
    }
    
    return client.db(dbName)
  } catch (error) {
    console.error('Error getting database:', error);
    throw error;
  }
}

export async function getCollection(collectionName: string) {
  try {
    const db = await getDatabase()
    return db.collection(collectionName)
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    throw error;
  }
}

// Example MongoDB connection function - only used for fallback
export async function connectToDatabase() {
  try {
    return await getDatabase();
  } catch (error) {
    console.error('Error in connectToDatabase:', error);
    
    // For demo purposes, we'll return a mock object as fallback
    console.warn('Returning mock database object as fallback');
    return {
      collection: (name: string) => ({
        // Mock collection methods
        findOne: async () => null,
        find: async () => ({ toArray: async () => [] }),
        insertOne: async () => ({ insertedId: new ObjectId() }),
        updateOne: async () => ({ modifiedCount: 1 }),
        deleteOne: async () => ({ deletedCount: 1 }),
      }),
    }
  }
}


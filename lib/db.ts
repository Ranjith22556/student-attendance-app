// This file would contain MongoDB connection and schema definitions
// For demonstration purposes, we're using mock data instead

import { ObjectId } from "mongodb"
import { MongoClient } from 'mongodb'

// MongoDB connection string would be stored in environment variables
// const uri = process.env.MONGODB_URI

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

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
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
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
  const client = await clientPromise
  return client.db('student-attendance')
}

export async function getCollection(collectionName: string) {
  const db = await getDatabase()
  return db.collection(collectionName)
}

// Example MongoDB connection function
export async function connectToDatabase() {
  // In a real application, you would connect to MongoDB here
  // const client = new MongoClient(uri)
  // await client.connect()
  // return client.db("attendance_app")

  // For demo purposes, we'll just return a mock object
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


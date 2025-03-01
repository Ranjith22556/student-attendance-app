"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  image?: string
} | null

type AuthContextType = {
  user: User
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Mock authentication for demo purposes
  useEffect(() => {
    // Check if user is stored in localStorage (simulating persistent auth)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async () => {
    // Mock Google sign in
    setLoading(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser = {
      id: "user_123",
      name: "John Doe",
      email: "john.doe@university.edu",
      image: "/placeholder.svg?height=40&width=40",
    }

    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
    setLoading(false)
    router.push("/dashboard")
  }

  const signOut = async () => {
    setLoading(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    setUser(null)
    localStorage.removeItem("user")
    setLoading(false)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, signIn, signOut, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)


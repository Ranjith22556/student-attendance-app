"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

export default function UserInitializer() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Only run once when the session is authenticated
    if (status === "authenticated" && !initialized) {
      initializeUser()
    }
  }, [status, initialized])

  const initializeUser = async () => {
    try {
      // First check if user exists
      const userCheckResponse = await fetch('/api/user-test')
      const userData = await userCheckResponse.json()
      
      // If user doesn't exist by email, create it
      if (!userData.userByEmail) {
        const createResponse = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const createResult = await createResponse.json()
        
        if (createResult.status === 'success') {
          console.log('User created successfully:', createResult.user)
          toast({
            title: "Account initialized",
            description: "Your account has been set up successfully.",
          })
        } else {
          console.error('Failed to create user:', createResult.error)
          toast({
            title: "Account setup failed",
            description: "There was an error setting up your account. Please try again.",
            variant: "destructive"
          })
        }
      }
      
      setInitialized(true)
    } catch (error) {
      console.error('Error initializing user:', error)
      toast({
        title: "Account setup failed",
        description: "There was an error setting up your account. Please try again.",
        variant: "destructive"
      })
    }
  }

  // This component doesn't render anything
  return null
} 
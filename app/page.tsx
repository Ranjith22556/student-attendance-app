"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    // Only redirect if authenticated and not already redirecting
    if (status === "authenticated" && !isRedirecting) {
      setIsRedirecting(true)
      router.push("/dashboard")
    }
    
    // Reset redirecting state if user is logged out
    if (status === "unauthenticated") {
      setIsRedirecting(false)
    }
    
    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    if (error) {
      setLoginError("There was an error signing in. Please try again.")
    } else {
      setLoginError(null)
    }
  }, [status, router, isRedirecting])

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true
      })
    } catch (error) {
      console.error("Sign in error:", error)
      setLoginError("Failed to sign in with Google. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Studance</h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Track your class attendance with ease. Get insights into your attendance patterns and never miss a
                  class again.
                </p>
                
                {loginError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{loginError}</span>
                  </div>
                )}
                
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  {status === "authenticated" ? (
                    <Button className="w-full max-w-sm py-6 text-lg" asChild>
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  ) : status === "loading" ? (
                    <Button className="w-full max-w-sm py-6 text-lg" disabled>
                      Loading...
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGoogleSignIn}
                      className="w-full max-w-sm flex items-center justify-center gap-2 py-6 text-lg"
                      variant="outline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                      </svg>
                      Sign in with Google
                    </Button>
                  )}
                </div>
              </div>
              <div className="mx-auto grid max-w-screen-sm gap-4 sm:grid-cols-2 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Track Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Mark your attendance for each class with a simple click.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Visualize Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      See your attendance patterns with interactive charts.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Manage Timetable</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Create and update your class schedule easily.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Stay Updated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Get insights about your attendance percentage for each subject.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  BarChart, 
  Bell, 
  Calendar, 
  ChevronLeft, 
  LogOut, 
  Menu, 
  User, 
  CheckCircle,
  Trophy,
  AlertCircle,
  Sparkles,
  Home
} from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { cn } from "@/lib/utils"
import React from "react"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const isHomePage = pathname === "/"
  const isDashboardPage = pathname === "/dashboard"
  const isAuthPage = pathname?.includes("/api/auth") || false

  // Add scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/notifications/unread')
          if (response.ok) {
            const data = await response.json()
            setUnreadNotifications(data.count)
          }
        } catch (error) {
          console.error('Failed to fetch unread notifications:', error)
        }
      }
    }

    fetchUnreadNotifications()
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchUnreadNotifications, 30000)
    
    return () => clearInterval(intervalId)
  }, [session])

  // Hide navbar on auth pages
  if (isAuthPage) return null

  const handleLogout = async () => {
    try {
      // Use callbackUrl to ensure proper redirection after logout
      await signOut({ 
        callbackUrl: "/",
        redirect: true
      })
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback manual redirect if signOut fails
      router.push("/")
    }
  }

  const handleBack = () => {
    router.back()
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="h-4 w-4" /> },
    { href: "/check-in", label: "Check-In", icon: <CheckCircle className="h-4 w-4" /> },
    { href: "/timetable", label: "Timetable", icon: <Calendar className="h-4 w-4" /> },
    { href: "/statistics", label: "Statistics", icon: <BarChart className="h-4 w-4" /> },
    { href: "/achievements", label: "Achievements", icon: <Trophy className="h-4 w-4" /> },
  ]

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
      scrolled && "shadow-sm"
    )}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {!isHomePage && !isDashboardPage && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <Link href={session?.user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <div className="hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg">Studance</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        {session?.user && (
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant={pathname === link.href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "transition-all",
                  pathname === link.href ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                asChild
              >
                <Link href={link.href} className="flex items-center gap-1">
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        )}
        
        <div className="flex items-center justify-end space-x-2">
          <ModeToggle />
          
          {session?.user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/10 transition-all hover:ring-primary/30">
                      <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary">{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/timetable">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Timetable</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/statistics">
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>Statistics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/check-in">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Check-In</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/achievements">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>Achievements</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                      {unreadNotifications > 0 && (
                        <span className="ml-auto bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full px-2 py-0.5">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400 focus:text-red-500 dark:focus:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // Only show the Sign In button if we're not on the home page (which is the login page)
            !isHomePage && (
              <Button variant="outline" size="sm" asChild className="font-medium">
                <Link href="/">Sign In</Link>
              </Button>
            )
          )}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {session?.user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 px-4 py-2 pb-safe shadow-md">
          <div className="flex items-center justify-between">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-md transition-colors",
                  pathname === link.href 
                    ? "text-primary bg-primary/10 font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                )}
              >
                <div className="mb-1">
                  {React.cloneElement(link.icon, { className: "h-5 w-5" })}
                </div>
                <span className="text-xs">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}


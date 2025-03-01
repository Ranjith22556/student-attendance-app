"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCheck, Clock, Calendar, AlertTriangle, Info, MessageSquare, Settings, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'attendance' | 'reminder' | 'alert' | 'info';
  date: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
    
    if (status === "authenticated") {
      fetchNotifications()
    }
  }, [status, router])

  const fetchNotifications = async () => {
    setLoading(true)
    
    // In a real app, you would fetch from an API
    // This is mock data for demonstration
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: "1",
          title: "Low Attendance Alert",
          message: "Your attendance in Mathematics is below 75%. Please attend the upcoming classes to meet the minimum requirement.",
          type: "alert",
          date: "2023-06-01T10:30:00",
          read: false
        },
        {
          id: "2",
          title: "Class Reminder",
          message: "You have Physics class tomorrow at 10:00 AM in Room 302.",
          type: "reminder",
          date: "2023-06-02T09:00:00",
          read: false
        },
        {
          id: "3",
          title: "Attendance Recorded",
          message: "Your attendance for today's Computer Science class has been recorded.",
          type: "attendance",
          date: "2023-06-03T14:15:00",
          read: true
        },
        {
          id: "4",
          title: "New Feature Available",
          message: "Check out the new attendance statistics feature on your dashboard!",
          type: "info",
          date: "2023-06-04T16:45:00",
          read: true
        },
        {
          id: "5",
          title: "Class Cancelled",
          message: "Tomorrow's Biology class has been cancelled. Please check your updated timetable.",
          type: "alert",
          date: "2023-06-05T08:20:00",
          read: false
        }
      ]
      
      setNotifications(mockNotifications)
      setLoading(false)
    }, 1000)
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <CheckCheck className="h-5 w-5 text-green-500" />
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'info':
        return <Info className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your attendance and class information
          </p>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  return (
    <div className="container py-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your attendance and class information
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchNotifications}
            className="rounded-full"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All
            <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">{notifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">{unreadNotifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="read">
            Read
            <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">{readNotifications.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification} 
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                getIcon={getNotificationIcon}
                formatDate={formatDate}
              />
            ))
          ) : (
            <EmptyState message="No notifications" />
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="space-y-4">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification} 
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                getIcon={getNotificationIcon}
                formatDate={formatDate}
              />
            ))
          ) : (
            <EmptyState message="No unread notifications" />
          )}
        </TabsContent>
        
        <TabsContent value="read" className="space-y-4">
          {readNotifications.length > 0 ? (
            readNotifications.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification} 
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                getIcon={getNotificationIcon}
                formatDate={formatDate}
              />
            ))
          ) : (
            <EmptyState message="No read notifications" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
  formatDate: (date: string) => string;
}

function NotificationCard({ notification, onMarkAsRead, onDelete, getIcon, formatDate }: NotificationCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md group",
        !notification.read && "border-l-4 border-l-primary"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getIcon(notification.type)}
            </div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {notification.title}
              </CardTitle>
              <CardDescription>
                {formatDate(notification.date)}
              </CardDescription>
            </div>
          </div>
          {!notification.read && (
            <Badge className="bg-primary text-primary-foreground">New</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{notification.message}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        {!notification.read && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
            className="text-xs"
          >
            Mark as read
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDelete(notification.id)}
          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="w-full py-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">{message}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You're all caught up!
        </p>
      </div>
    </Card>
  )
} 
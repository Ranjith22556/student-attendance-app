"use client"

import React, { useState, useEffect, Fragment } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2, AlertCircle, Clock, Calendar, BookOpen, MapPin } from "lucide-react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define types for our timetable data
interface ClassItem {
  id: string;
  day: string;
  period: string;
  subject: string;
  room: string;
  totalHours?: number;
  attendedHours?: number;
}

// Empty timetable for new users
const emptyTimetable: ClassItem[] = []

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const periods = [
  "1st Period", "2nd Period", "3rd Period", "4th Period", 
  "5th Period", "6th Period", "7th Period", "8th Period"
]

// Subject colors will be generated dynamically
const subjectColors: Record<string, string> = {}

// Color palette for subjects
const colorPalette = [
  "bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700",
  "bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700",
  "bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-700",
  "bg-amber-100 border-amber-300 dark:bg-amber-900 dark:border-amber-700",
  "bg-pink-100 border-pink-300 dark:bg-pink-900 dark:border-pink-700",
  "bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:border-indigo-700",
  "bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700",
  "bg-teal-100 border-teal-300 dark:bg-teal-900 dark:border-teal-700",
]

export default function TimetablePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timetable, setTimetable] = useState<ClassItem[]>(emptyTimetable)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newClass, setNewClass] = useState({
    day: "",
    period: "",
    subject: "",
    room: "",
    totalHours: 0,
    attendedHours: 0
  })
  const [isNewSubject, setIsNewSubject] = useState(false)
  const [existingSubjects, setExistingSubjects] = useState<string[]>([])

  // Fetch timetable data from API
  useEffect(() => {
    if (status === "authenticated") {
      fetchTimetable()
    }
  }, [status])

  // Reset error when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setError(null)
    }
  }, [isDialogOpen])

  const fetchTimetable = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/timetable')
      
      if (!response.ok) {
        throw new Error('Failed to fetch timetable')
      }
      
      const data = await response.json()
      
      // Transform the data to match our ClassItem interface
      const transformedData = data.timetable.map((item: any) => ({
        id: item._id,
        day: item.day,
        period: item.period,
        subject: item.subject,
        room: item.room || 'Not specified',
        totalHours: item.totalHours,
        attendedHours: item.attendedHours
      }))
      
      setTimetable(transformedData)
      
      // Extract unique subjects with proper typing
      const subjectSet = new Set<string>();
      data.timetable.forEach((item: any) => {
        if (typeof item.subject === 'string') {
          subjectSet.add(item.subject);
        }
      });
      setExistingSubjects(Array.from(subjectSet));
    } catch (error) {
      console.error('Error fetching timetable:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your timetable</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/")
    return null
  }

  // Check if subject already exists when user enters a subject
  const handleSubjectChange = (value: string) => {
    setNewClass({
      ...newClass,
      subject: value
    })
    
    // Check if this is a new subject
    setIsNewSubject(!existingSubjects.includes(value))
  }

  const handleAddClass = async () => {
    if (newClass.day && newClass.period && newClass.subject) {
      try {
        const response = await fetch('/api/timetable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newClass)
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          setError(data.error || 'Failed to add class')
          return
        }
        
        // Add the new class to the local state
        setTimetable([
          ...timetable,
          {
            id: data.id,
            day: newClass.day,
            period: newClass.period,
            subject: newClass.subject,
            room: newClass.room || "Not specified",
            totalHours: newClass.totalHours,
            attendedHours: newClass.attendedHours
          }
        ])
        
        // Update existing subjects if this was a new subject
        if (data.isNewSubject) {
          setExistingSubjects([...existingSubjects, newClass.subject])
        }
        
        setNewClass({ 
          day: "", 
          period: "", 
          subject: "", 
          room: "",
          totalHours: 0,
          attendedHours: 0
        })
        setIsNewSubject(false)
        setIsDialogOpen(false)
      } catch (error) {
        console.error('Error adding class:', error)
        setError('Failed to add class. Please try again.')
      }
    }
  }

  const handleDeleteClass = (id: string) => {
    setClassToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteClass = async () => {
    if (classToDelete) {
      try {
        const response = await fetch(`/api/timetable?id=${classToDelete}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete class')
        }
        
        // Remove the class from the local state
        setTimetable(timetable.filter(item => item.id !== classToDelete))
        setClassToDelete(null)
        setIsDeleteDialogOpen(false)
      } catch (error) {
        console.error('Error deleting class:', error)
      }
    }
  }

  const getClassesForDay = (day: string) => {
    return timetable.filter(item => item.day === day).sort((a, b) => {
      return periods.indexOf(a.period) - periods.indexOf(b.period)
    })
  }

  const getClassForPeriod = (day: string, period: string) => {
    return timetable.find(item => item.day === day && item.period === period)
  }

  const getSubjectColor = (subject: string) => {
    // If we don't have a color for this subject yet, assign one
    if (!subjectColors[subject]) {
      const existingColors = Object.values(subjectColors)
      // Find a color that's not already used, or use the first one if all are used
      const availableColor = colorPalette.find(color => !existingColors.includes(color)) || colorPalette[0]
      subjectColors[subject] = availableColor
    }
    return subjectColors[subject]
  }

  const isEmptyTimetable = timetable.length === 0

  return (
    <div className="container py-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground">
            Manage your weekly class schedule
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Class</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new class to your timetable. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-12 items-center gap-4">
                <Label htmlFor="day" className="col-span-3 text-right font-medium">
                  Day
                </Label>
                <Select
                  value={newClass.day}
                  onValueChange={(value) => setNewClass({ ...newClass, day: value })}
                >
                  <SelectTrigger className="col-span-9">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-12 items-center gap-4">
                <Label htmlFor="period" className="col-span-3 text-right font-medium">
                  Period
                </Label>
                <Select
                  value={newClass.period}
                  onValueChange={(value) => setNewClass({ ...newClass, period: value })}
                >
                  <SelectTrigger className="col-span-9">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-12 items-center gap-4">
                <Label htmlFor="subject" className="col-span-3 text-right font-medium">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={newClass.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="col-span-9"
                  placeholder="Enter subject name"
                />
              </div>
              <div className="grid grid-cols-12 items-center gap-4">
                <Label htmlFor="room" className="col-span-3 text-right font-medium">
                  Room
                </Label>
                <Input
                  id="room"
                  value={newClass.room}
                  onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                  className="col-span-9"
                  placeholder="Enter room number/name"
                />
              </div>
              
              {isNewSubject && (
                <>
                  <div className="pt-2 pb-1">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>New Subject</AlertTitle>
                      <AlertDescription>
                        This appears to be a new subject. Please enter the total hours and hours already attended.
                      </AlertDescription>
                    </Alert>
                  </div>
                  
                  <div className="grid grid-cols-12 items-center gap-4">
                    <Label htmlFor="totalHours" className="col-span-3 text-right font-medium">
                      Total Hours
                    </Label>
                    <div className="col-span-9 flex items-center gap-2">
                      <Input
                        id="totalHours"
                        type="number"
                        value={newClass.totalHours}
                        onChange={(e) => setNewClass({ ...newClass, totalHours: parseInt(e.target.value) || 0 })}
                        className="w-full"
                        min="0"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">hours</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center gap-4">
                    <Label htmlFor="attendedHours" className="col-span-3 text-right font-medium">
                      Attended Hours
                    </Label>
                    <div className="col-span-9 flex items-center gap-2">
                      <Input
                        id="attendedHours"
                        type="number"
                        value={newClass.attendedHours}
                        onChange={(e) => setNewClass({ ...newClass, attendedHours: parseInt(e.target.value) || 0 })}
                        className="w-full"
                        min="0"
                        max={newClass.totalHours}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">hours</span>
                    </div>
                  </div>
                </>
              )}
              
              {error && (
                <div className="col-span-12">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button 
                type="submit" 
                onClick={handleAddClass}
                disabled={!newClass.day || !newClass.period || !newClass.subject}
              >
                Add Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isEmptyTimetable && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">Your timetable is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start by adding your classes to create your weekly schedule
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Your First Class
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete this class from your timetable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClassToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClass} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {days.map(day => (
              <Card key={day} className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle>{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  {getClassesForDay(day).length > 0 ? (
                    <div className="space-y-3">
                      {getClassesForDay(day).map(classItem => (
                        <div 
                          key={classItem.id} 
                          className={`p-3 border rounded-md relative group ${getSubjectColor(classItem.subject)}`}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteClass(classItem.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <p className="font-medium">{classItem.subject}</p>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{classItem.period}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{classItem.room}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No classes scheduled</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setNewClass({...newClass, day})
                          setIsDialogOpen(true)
                        }}
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="daily" className="space-y-4">
          <div className="flex mb-4 overflow-x-auto pb-2">
            <TabsList className="justify-start">
              {days.map(day => (
                <TabsTrigger key={day} value={day} className="min-w-24">{day}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {days.map(day => (
            <TabsContent key={day} value={day}>
              <Card>
                <CardHeader>
                  <CardTitle>{day}</CardTitle>
                  <CardDescription>
                    {getClassesForDay(day).length} classes scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getClassesForDay(day).length > 0 ? (
                    <div className="space-y-4">
                      {getClassesForDay(day).map(classItem => (
                        <div 
                          key={classItem.id} 
                          className={`p-4 border rounded-md relative group ${getSubjectColor(classItem.subject)}`}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteClass(classItem.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{classItem.subject}</h3>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{classItem.period}</span>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{classItem.room}</span>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div>Attended: {classItem.attendedHours || 0} hrs</div>
                              <div>Total: {classItem.totalHours || 0} hrs</div>
                              <div className="mt-1 font-medium">
                                {Math.round(((classItem.attendedHours || 0) / (classItem.totalHours || 1)) * 100)}% attendance
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg">No classes scheduled for {day}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setNewClass({...newClass, day})
                          setIsDialogOpen(true)
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Class to {day}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </TabsContent>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 gap-2">
                <div className="p-2 font-medium text-center bg-muted rounded-md">Period</div>
                {days.map(day => (
                  <div key={day} className="p-2 font-medium text-center bg-muted rounded-md">{day}</div>
                ))}
                
                {periods.map(period => (
                  <Fragment key={period}>
                    <div className="p-2 font-medium text-center bg-muted/50 rounded-md">{period}</div>
                    {days.map(day => {
                      const classItem = getClassForPeriod(day, period)
                      return (
                        <div key={`${day}-${period}`} className="relative h-24 border rounded-md p-1">
                          {classItem ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`h-full w-full p-2 rounded-md ${getSubjectColor(classItem.subject)} relative group cursor-pointer`}
                                  >
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteClass(classItem.id)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    <div className="font-medium truncate">{classItem.subject}</div>
                                    <div className="text-xs text-muted-foreground truncate">{classItem.room}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{classItem.subject}</p>
                                    <p className="text-xs">{day}, {period}</p>
                                    <p className="text-xs">{classItem.room}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button 
                              variant="ghost" 
                              className="h-full w-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setNewClass({...newClass, day, period})
                                setIsDialogOpen(true)
                              }}
                            >
                              <PlusCircle className="h-4 w-4 mb-1" />
                              <span className="text-xs">Add</span>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


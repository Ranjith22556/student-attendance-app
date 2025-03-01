"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Award, Trophy, Flame, Star, Users, Target, Calendar, Clock, CheckCircle, Lock } from "lucide-react"

// Define achievement types
interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: JSX.Element;
  requiredValue: number;
  currentValue: number;
  unlocked: boolean;
  date: string | null;
}

export default function AchievementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("achievements")
  const [isNewUser, setIsNewUser] = useState(true)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  
  useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    }
  }, [status])
  
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch timetable data to check if user has any entries
      const timetableResponse = await fetch('/api/timetable')
      if (!timetableResponse.ok) {
        throw new Error('Failed to fetch timetable')
      }
      
      const timetableData = await timetableResponse.json()
      const hasClasses = timetableData.timetable && timetableData.timetable.length > 0
      setIsNewUser(!hasClasses)
      
      // Fetch attendance stats
      const statsResponse = await fetch('/api/attendance/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch attendance statistics')
      }
      
      const statsData = await statsResponse.json()
      setStats(statsData)
      
      // Generate achievements based on stats
      generateAchievements(statsData, hasClasses)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const generateAchievements = (statsData: any, hasClasses: boolean) => {
    // Default achievements for all users
    const achievementsList: Achievement[] = [
      { 
        id: 1, 
        name: "Perfect Week", 
        description: "Attend all classes for a full week", 
        icon: <Calendar className="h-8 w-8 text-primary" />,
        requiredValue: 100,
        currentValue: 0,
        unlocked: false,
        date: null
      },
      { 
        id: 2, 
        name: "Early Bird", 
        description: "Check in early to 5 consecutive classes", 
        icon: <Clock className="h-8 w-8 text-primary" />,
        requiredValue: 5,
        currentValue: 0,
        unlocked: false,
        date: null
      },
      { 
        id: 3, 
        name: "Subject Master", 
        description: "Achieve 100% attendance in any subject", 
        icon: <CheckCircle className="h-8 w-8 text-primary" />,
        requiredValue: 100,
        currentValue: 0,
        unlocked: false,
        date: null
      },
      { 
        id: 4, 
        name: "Semester Champion", 
        description: "Maintain 90%+ attendance for a full semester", 
        icon: <Trophy className="h-8 w-8 text-primary" />,
        requiredValue: 90,
        currentValue: 0,
        unlocked: false,
        date: null
      },
      { 
        id: 5, 
        name: "Dedication Award", 
        description: "Attend 50 classes total", 
        icon: <Award className="h-8 w-8 text-primary" />,
        requiredValue: 50,
        currentValue: 0,
        unlocked: false,
        date: null
      },
      { 
        id: 6, 
        name: "Comeback Kid", 
        description: "Improve attendance by 20% from previous month", 
        icon: <Target className="h-8 w-8 text-primary" />,
        requiredValue: 20,
        currentValue: 0,
        unlocked: false,
        date: null
      },
    ]
    
    // If user has stats, update achievement progress
    if (statsData && hasClasses) {
      // Update Subject Master achievement
      if (statsData.subjects && statsData.subjects.length > 0) {
        const bestSubject = statsData.subjects.reduce((best: any, subject: any) => 
          subject.attendanceRate > (best?.attendanceRate || 0) ? subject : best, null)
        
        if (bestSubject) {
          const subjectMaster = achievementsList.find(a => a.id === 3)
          if (subjectMaster) {
            subjectMaster.currentValue = Math.round(bestSubject.attendanceRate)
            subjectMaster.unlocked = bestSubject.attendanceRate === 100
            if (subjectMaster.unlocked) {
              subjectMaster.date = "Recently"
            }
          }
        }
      }
      
      // Update Semester Champion achievement
      if (statsData.overall) {
        const semesterChampion = achievementsList.find(a => a.id === 4)
        if (semesterChampion) {
          semesterChampion.currentValue = Math.round(statsData.overall.attendanceRate || 0)
          semesterChampion.unlocked = (statsData.overall.attendanceRate || 0) >= 90
          if (semesterChampion.unlocked) {
            semesterChampion.date = "Recently"
          }
        }
      }
      
      // Update Dedication Award achievement
      if (statsData.overall && statsData.overall.attendedClasses) {
        const dedicationAward = achievementsList.find(a => a.id === 5)
        if (dedicationAward) {
          dedicationAward.currentValue = statsData.overall.attendedClasses
          dedicationAward.unlocked = statsData.overall.attendedClasses >= 50
          if (dedicationAward.unlocked) {
            dedicationAward.date = "Recently"
          }
        }
      }
    }
    
    setAchievements(achievementsList)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your achievements</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/")
    return null
  }
  
  // Calculate user stats based on achievements and attendance data
  const userStats = {
    streak: stats?.overall?.attendedClasses ? 1 : 0, // Simplified streak calculation
    rank: 1, // Default rank for now
    points: stats?.overall?.attendedClasses ? stats.overall.attendedClasses * 50 : 0,
    totalClasses: stats?.overall?.totalClasses || 0,
    achievements: achievements.filter(a => a.unlocked).length,
    nextLevel: 500
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Achievements & Rewards</h1>
        <p className="text-muted-foreground">
          Track your progress and earn rewards for consistent attendance
        </p>
      </div>

      {isNewUser ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to Achievements!</CardTitle>
            <CardDescription>
              Start adding classes to your timetable and tracking attendance to earn achievements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Your achievements journey begins when you:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create your personalized class schedule in the Timetable section</li>
              <li>Check in to your classes regularly</li>
              <li>Maintain consistent attendance</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/timetable')}>
              Set Up Your Timetable
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative">
                  <Flame className="h-12 w-12 text-orange-500" />
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {userStats.streak}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {userStats.streak} days in a row!
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative">
                  <Trophy className="h-12 w-12 text-yellow-500" />
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    #{userStats.rank}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Keep attending classes to improve your rank!
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.points}</div>
                <div className="mt-2">
                  <Progress value={(userStats.points / userStats.nextLevel) * 100} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {userStats.nextLevel - userStats.points} points to next level
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.achievements}/{achievements.length}</div>
                <div className="mt-2">
                  <Progress value={(userStats.achievements / achievements.length) * 100} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {achievements.length - userStats.achievements} more to unlock
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="achievements" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="achievements" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className={`overflow-hidden ${!achievement.unlocked && 'opacity-75'}`}>
                    <div className={`h-2 ${achievement.unlocked ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                      <div className="flex-1">
                        <CardTitle className="flex items-center">
                          {achievement.name}
                          {achievement.unlocked && (
                            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                              Unlocked
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </div>
                      <div className={`rounded-full p-2 ${achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {achievement.unlocked ? achievement.icon : <Lock className="h-8 w-8 text-gray-400" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.min(100, Math.round((achievement.currentValue / achievement.requiredValue) * 100))}%</span>
                        </div>
                        <Progress value={Math.min(100, Math.round((achievement.currentValue / achievement.requiredValue) * 100))} className="h-2" />
                        {achievement.date && (
                          <p className="text-xs text-muted-foreground">
                            Unlocked {achievement.date}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="rewards" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Rewards</CardTitle>
                  <CardDescription>
                    Earn points by attending classes and unlock rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="border border-dashed">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                          Attendance Certificate
                        </CardTitle>
                        <CardDescription>500 points</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Receive a digital certificate for excellent attendance</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" disabled={userStats.points < 500}>
                          {userStats.points >= 500 ? "Claim Reward" : "Not Enough Points"}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="border border-dashed">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Star className="h-5 w-5 mr-2 text-purple-500" />
                          Custom Profile Badge
                        </CardTitle>
                        <CardDescription>1000 points</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Unlock a special badge for your profile</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" disabled={userStats.points < 1000}>
                          {userStats.points >= 1000 ? "Claim Reward" : "Not Enough Points"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
} 
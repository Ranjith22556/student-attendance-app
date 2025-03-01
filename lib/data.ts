export type Subject = {
  id: string
  name: string
  totalHours: number
  attendedHours: number
  schedule: {
    day: string
    hour: number
  }[]
}

export type Student = {
  id: string
  name: string
  email: string
  dob: string
  phone: string
  college: string
  year: number
  semester: number
}

// Mock data for demonstration
export const mockSubjects: Subject[] = [
  {
    id: "sub_1",
    name: "Mathematics",
    totalHours: 45,
    attendedHours: 40,
    schedule: [
      { day: "Monday", hour: 1 },
      { day: "Wednesday", hour: 3 },
    ],
  },
  {
    id: "sub_2",
    name: "Computer Science",
    totalHours: 45,
    attendedHours: 35,
    schedule: [
      { day: "Monday", hour: 4 },
      { day: "Thursday", hour: 2 },
    ],
  },
  {
    id: "sub_3",
    name: "Physics",
    totalHours: 30,
    attendedHours: 20,
    schedule: [
      { day: "Tuesday", hour: 2 },
      { day: "Friday", hour: 5 },
    ],
  },
  {
    id: "sub_4",
    name: "English",
    totalHours: 30,
    attendedHours: 28,
    schedule: [
      { day: "Wednesday", hour: 6 },
      { day: "Friday", hour: 1 },
    ],
  },
  {
    id: "sub_5",
    name: "History",
    totalHours: 30,
    attendedHours: 15,
    schedule: [
      { day: "Tuesday", hour: 7 },
      { day: "Thursday", hour: 8 },
    ],
  },
]

export const mockStudent: Student = {
  id: "std_1",
  name: "John Doe",
  email: "john.doe@university.edu",
  dob: "1999-05-15",
  phone: "+1 (555) 123-4567",
  college: "University of Technology",
  year: 3,
  semester: 5,
}

export function getSubjectsForDay(day: string): Subject[] {
  return mockSubjects.filter((subject) => subject.schedule.some((schedule) => schedule.day === day))
}

export function getTodaySubjects(): Subject[] {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = days[new Date().getDay()]
  return getSubjectsForDay(today)
}


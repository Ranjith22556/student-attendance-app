import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDayOfWeek(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayIndex = new Date().getDay()
  return days[dayIndex]
}

export function calculateAttendancePercentage(attended: number, total: number): number {
  if (total === 0) return 0
  return Math.round((attended / total) * 100)
}


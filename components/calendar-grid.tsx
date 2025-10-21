"use client"

import { useMemo, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Holiday } from "@/lib/sanity"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  holidays: Holiday[]
  year: number
  onYearChange: (year: number) => void
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getHolidayStyle(holiday: Holiday): string {
  const baseStyle = "text-white font-semibold shadow-lg hover:shadow-xl cursor-pointer"
  
  // Sistema basado en STATUS, no en TYPE
  switch (holiday.status) {
    case 'approved':
      return `bg-red-500 ${baseStyle}` // Rojo sólido - Feriado aprobado
    case 'working':
      return `bg-orange-500/60 backdrop-blur-sm ${baseStyle}` // Naranja difuminado - Se trabaja
    case 'custom':
      return `bg-purple-500 ${baseStyle}` // Purple sólido - Custom de Revolt
    default:
      return `bg-red-500 ${baseStyle}` // Default: rojo sólido
  }
}

export function CalendarGrid({ holidays, year, onYearChange }: CalendarGridProps) {
  const todayRef = useRef<HTMLButtonElement>(null)
  
  // Get today's date
  const today = new Date()
  const currentYear = today.getFullYear()
  const isCurrentYear = currentYear === year && currentYear >= 2025

  // Scroll to today's date when component mounts
  useEffect(() => {
    if (isCurrentYear && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        })
      }, 500) // Small delay to ensure calendar is rendered
    }
  }, [isCurrentYear])

  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday[]>()
    holidays.forEach((holiday) => {
      // Parse dates without timezone conversion
      const startDateStr = holiday.startDate
      const endDateStr = holiday.endDate
      
      // Extract year, month, day from date strings (YYYY-MM-DD format)
      const startParts = startDateStr.split('-')
      const endParts = endDateStr.split('-')
      
      const startDate = new Date(
        parseInt(startParts[0]), 
        parseInt(startParts[1]) - 1, // Month is 0-indexed
        parseInt(startParts[2])
      )
      const endDate = new Date(
        parseInt(endParts[0]), 
        parseInt(endParts[1]) - 1, // Month is 0-indexed
        parseInt(endParts[2])
      )

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)!.push(holiday)
      }
    })
    
    return map
  }, [holidays])

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex, year)
    const firstDay = getFirstDayOfMonth(monthIndex, year)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayHolidays = holidayMap.get(dateKey) || []
      const isHoliday = dayHolidays.length > 0
      
      // Check if this is today's date
      const isToday = isCurrentYear && 
        monthIndex === today.getMonth() && 
        day === today.getDate()

      days.push(
        <button
          key={day}
          ref={isToday ? todayRef : null}
          className={cn(
            "aspect-square flex items-center justify-center rounded-md text-sm transition-all duration-300",
            "hover:scale-110 hover:z-10 relative group",
            isHoliday
              ? getHolidayStyle(dayHolidays[0])
              : isToday
              ? "bg-white text-slate-900 font-bold shadow-lg hover:shadow-xl ring-2 ring-white/50"
              : "text-slate-300 hover:bg-slate-700/50",
          )}
          title={isHoliday ? `${dayHolidays[0].name} - ${dayHolidays[0].description || 'Official holiday'}` : undefined}
        >
          {day}
          {/* Tooltip */}
          {isHoliday && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              <div className="font-semibold">{dayHolidays[0].name}</div>
              {dayHolidays[0].description && (
                <div className="text-slate-300">{dayHolidays[0].description}</div>
              )}
              <div className="text-slate-400">
                {(() => {
                  // Parse date without timezone conversion (same method used elsewhere)
                  const dateStr = dayHolidays[0].startDate
                  const parts = dateStr.split('-')
                  const date = new Date(
                    parseInt(parts[0]), 
                    parseInt(parts[1]) - 1, // Month is 0-indexed
                    parseInt(parts[2])
                  )
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                })()}
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
            </div>
          )}
        </button>,
      )
    }

    return (
      <Card className="h-full p-4 bg-slate-800/60 backdrop-blur-sm border-slate-700/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 flex flex-col">
        <h3 className="text-lg font-semibold mb-3 text-white">{MONTHS[monthIndex]}</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-xs text-slate-400 text-center font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1">{days}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year - 1)}
          disabled={year <= 2025}
          className="transition-all duration-300 hover:scale-110 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-4xl font-bold text-foreground transition-all duration-500">{year}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year + 1)}
          className="transition-all duration-300 hover:scale-110 hover:border-primary"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="min-h-[400px]">
            {renderMonth(i)}
          </div>
        ))}
      </div>
    </div>
  )
}

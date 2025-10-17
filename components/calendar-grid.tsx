"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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

export function CalendarGrid({ holidays, year, onYearChange }: CalendarGridProps) {
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
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
          onClick={() => isHoliday && setSelectedHoliday(dayHolidays[0])}
          className={cn(
            "aspect-square flex items-center justify-center rounded-md text-sm transition-all duration-300",
            "hover:scale-110 hover:z-10 relative",
            isHoliday
              ? "bg-[#DA1104] text-white font-semibold shadow-lg hover:shadow-xl holiday-pulse cursor-pointer"
              : isToday
              ? "bg-white text-slate-900 font-bold shadow-lg hover:shadow-xl ring-2 ring-white/50"
              : "text-slate-300 hover:bg-slate-700/50",
          )}
        >
          {day}
          {isHoliday && <div className="absolute inset-0 rounded-md bg-[#DA1104] opacity-20 blur-sm" />}
          {isToday && !isHoliday && <div className="absolute inset-0 rounded-md bg-white opacity-10 blur-sm" />}
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
          <div key={i} className="h-[400px]">
            {renderMonth(i)}
          </div>
        ))}
      </div>

      {/* Holiday Details Modal */}
      {selectedHoliday && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedHoliday(null)}
        >
          <Card
            className="max-w-md w-full p-6 bg-card border-primary/30 shadow-2xl shadow-primary/10 animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-2xl font-bold text-foreground">{selectedHoliday.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedHoliday(null)}
                  className="hover:bg-secondary"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Start:</span>{" "}
                  {new Date(selectedHoliday.startDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p>
                  <span className="font-semibold text-foreground">End:</span>{" "}
                  {new Date(selectedHoliday.endDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {selectedHoliday.description && <p className="pt-2 text-foreground">{selectedHoliday.description}</p>}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

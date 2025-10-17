"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { CalendarGrid } from "@/components/calendar-grid"
import { HolidayLegend } from "@/components/holiday-legend"
import { getHolidays, type Holiday } from "@/lib/sanity"
import { Calendar } from "lucide-react"

export default function Home() {
  const [year, setYear] = useState(Math.max(new Date().getFullYear(), 2025))
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true)
      const data = await getHolidays(year)
      setHolidays(data)
      setLoading(false)
    }
    fetchHolidays()
  }, [year])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg">
                <Image 
                  src="/logo.png" 
                  alt="Revolt Logo" 
                  width={48} 
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Revolt</h1>
                <p className="text-sm text-muted-foreground">Holiday Calendar</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <CalendarGrid holidays={holidays} year={year} onYearChange={setYear} />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <HolidayLegend holidays={holidays} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by Sanity CMS • Built with Next.js</p>
        </div>
      </footer>
    </main>
  )
}

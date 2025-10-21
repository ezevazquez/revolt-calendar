import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

interface HolidayData {
  name: string
  date: string
  type: string
  description: string
  originalDate: string
  isOfficial: boolean
}

interface APIHoliday {
  fecha: string
  tipo: string
  nombre: string
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-10-17',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
})

async function fetchHolidaysFromAPI(year: string = '2025'): Promise<HolidayData[]> {
  try {
    console.log(`🌐 Fetching holidays from ArgentinaDatos API for year ${year}...`)
    
    const response = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`)
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data)) {
      throw new Error('API response is not an array')
    }
    
    console.log(`📅 API returned ${data.length} holidays`)
    
    // Transformar los datos de la API a nuestro formato
    const holidays = data.map((holiday: APIHoliday) => {
      // Mapear tipos de la API a nuestros tipos
      let type = 'inamovible' // default
      if (holiday.tipo === 'trasladable') {
        type = 'trasladable'
      } else if (holiday.tipo === 'puente') {
        type = 'no_laborable'
      }
      
      return {
        name: holiday.nombre,
        date: holiday.fecha,
        type: type,
        description: `Feriado oficial (${holiday.tipo})`,
        originalDate: holiday.fecha,
        isOfficial: true
      }
    })
    
    // Verificar que tenemos suficientes feriados
    if (holidays.length < 5) {
      throw new Error(`API returned only ${holidays.length} holidays, expected at least 5`)
    }
    
    // Ordenar por fecha
    holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    console.log(`✅ Successfully processed ${holidays.length} holidays from API`)
    holidays.forEach(holiday => {
      console.log(`📅 ${holiday.date} - ${holiday.name} (${holiday.type})`)
    })
    
    return holidays
    
  } catch (error) {
    console.error('❌ Error fetching from ArgentinaDatos API:', error)
    throw new Error(`Failed to fetch holidays from API: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { temporary, year } = await request.json()
    
    // Extraer año de la URL si no se proporciona directamente
    const targetYear = year || '2025'
    
    console.log(`🌐 Fetching holidays from ArgentinaDatos API for year: ${targetYear}`)
    
    // Obtener feriados desde la API de ArgentinaDatos
    const scrapedHolidays = await fetchHolidaysFromAPI(targetYear)
    
    console.log(`📅 Holidays found: ${scrapedHolidays.length}`)
    
    if (temporary) {
      // Modo temporal: verificar duplicados antes de devolver
      console.log('🔍 Checking for existing holidays in database...')
      
      // Obtener todos los feriados existentes para el año
      const existingHolidays = await client.fetch(
        `*[_type == "holiday" && startDate >= "${targetYear}-01-01" && startDate <= "${targetYear}-12-31"]`
      )
      
      console.log(`📋 Found ${existingHolidays.length} existing holidays in database`)
      
      // Crear un Set de fechas existentes para verificación rápida
      const existingDates = new Set(
        existingHolidays.map(h => `${h.startDate}_${h.name}`)
      )
      
      const formattedHolidays = scrapedHolidays.map(holiday => {
        const holidayKey = `${holiday.date}_${holiday.name}`
        const existsInDB = existingDates.has(holidayKey)
        
        return {
          _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: holiday.name,
          startDate: holiday.date,
          endDate: holiday.date,
          description: holiday.description,
          type: holiday.type,
          status: existsInDB ? 'existing' : 'pending',
          isOfficial: true,
          existsInDB: existsInDB,
        }
      })
      
      const newHolidays = formattedHolidays.filter(h => !h.existsInDB)
      const existingHolidaysCount = formattedHolidays.filter(h => h.existsInDB).length
      
      console.log(`✅ Processed ${formattedHolidays.length} holidays: ${newHolidays.length} new, ${existingHolidaysCount} already exist`)
      
      return NextResponse.json({
        success: true,
        message: `Found ${formattedHolidays.length} holidays: ${newHolidays.length} new, ${existingHolidaysCount} already exist in database`,
        holidays: formattedHolidays,
        stats: {
          total: formattedHolidays.length,
          new: newHolidays.length,
          existing: existingHolidaysCount
        }
      })
    }
    
    // Modo persistente: guardar en Sanity (comportamiento anterior)
    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
    }

    for (const holiday of scrapedHolidays) {
      try {
        // Verificar si ya existe
        const existing = await client.fetch(
          `*[_type == "holiday" && name == "${holiday.name}" && startDate == "${holiday.date}"]`
        )
        
        if (existing.length > 0) {
          results.skipped++
          continue
        }
        
        // Crear el documento en Sanity
        const doc = {
          _type: 'holiday',
          name: holiday.name,
          startDate: holiday.date,
          endDate: holiday.date,
          description: holiday.description,
          type: holiday.type,
          status: 'pending',
          isOfficial: true,
        }
        
        await client.create(doc)
        results.imported++
        
      } catch (error) {
        console.error(`Error importing ${holiday.name}:`, error)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `API import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`,
      results
    })

  } catch (error) {
    console.error('Error in API fetch:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Error during API fetch' },
      { status: 500 }
    )
  }
}

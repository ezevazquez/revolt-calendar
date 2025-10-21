import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-10-17',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const { holidays, status } = await request.json()
    
    if (!holidays || !Array.isArray(holidays)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Holidays array is required' 
      }, { status: 400 })
    }

    if (!status || !['approved', 'working'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Valid status (approved or working) is required' 
      }, { status: 400 })
    }

    console.log(`💾 Saving ${holidays.length} holidays to Sanity with status: ${status}`)
    
    const results = {
      saved: 0,
      skipped: 0,
      errors: 0,
    }

    for (const holiday of holidays) {
      try {
        // Verificar si ya existe
        const existing = await client.fetch(
          `*[_type == "holiday" && name == "${holiday.name}" && startDate == "${holiday.startDate}"]`
        )
        
        if (existing.length > 0) {
          results.skipped++
          continue
        }
        
        // Crear el documento en Sanity
        const doc = {
          _type: 'holiday',
          name: holiday.name,
          startDate: holiday.startDate,
          endDate: holiday.endDate,
          description: holiday.description,
          type: holiday.type,
          status: status,
          isOfficial: holiday.isOfficial || true,
        }
        
        await client.create(doc)
        results.saved++
        
      } catch (error) {
        console.error(`Error saving ${holiday.name}:`, error)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${results.saved} holidays to database`,
      results
    })

  } catch (error: unknown) {
    console.error('Error in save-approved-holidays API:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error during save' },
      { status: 500 }
    )
  }
}

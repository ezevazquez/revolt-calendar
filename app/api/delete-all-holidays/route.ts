import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-10-17',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
})

export async function POST() {
  try {
    // Obtener todos los documentos de tipo holiday
    const holidays = await client.fetch('*[_type == "holiday"]')
    
    if (holidays.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No holidays found to delete.',
        deletedCount: 0
      })
    }

    // Crear transacción para eliminar todos
    const transaction = client.transaction()
    holidays.forEach((holiday: { _id: string }) => transaction.delete(holiday._id))
    await transaction.commit()

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${holidays.length} holidays.`,
      deletedCount: holidays.length
    })

  } catch (error: unknown) {
    console.error('Error in delete-all-holidays API:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error during deleting all holidays' },
      { status: 500 }
    )
  }
}

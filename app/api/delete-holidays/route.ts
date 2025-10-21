import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-10-17',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'No holiday IDs provided' }, { status: 400 })
    }

    console.log(`🗑️ Deleting ${ids.length} holidays...`)

    // Crear transacción para eliminar múltiples feriados
    const transaction = client.transaction()
    
    ids.forEach(id => {
      transaction.delete(id)
    })

    await transaction.commit()

    console.log(`✅ Successfully deleted ${ids.length} holidays`)

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} holidays`,
    })

  } catch (error: unknown) {
    console.error('Error deleting holidays:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error during deletion' },
      { status: 500 }
    )
  }
}

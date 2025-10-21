#!/usr/bin/env node

// Script para eliminar TODOS los feriados de Sanity
// Ejecutar: node delete-all-holidays.js

const { createClient } = require('@sanity/client')
require('dotenv').config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-10-17',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

async function deleteAllHolidays() {
  try {
    console.log('🔍 Buscando todos los feriados...')
    
    // Obtener todos los IDs de feriados
    const holidays = await client.fetch('*[_type == "holiday"]._id')
    
    console.log(`📋 Encontrados ${holidays.length} feriados`)
    
    if (holidays.length === 0) {
      console.log('✅ No hay feriados para eliminar')
      return
    }
    
    console.log('🗑️ Eliminando feriados...')
    
    // Eliminar todos los feriados
    const deletePromises = holidays.map(id => 
      client.delete(id).catch(error => {
        console.error(`❌ Error eliminando ${id}:`, error.message)
        return null
      })
    )
    
    const results = await Promise.all(deletePromises)
    const successful = results.filter(r => r !== null).length
    
    console.log(`✅ Eliminados ${successful} de ${holidays.length} feriados`)
    
    // Verificar que se eliminaron
    const remaining = await client.fetch('*[_type == "holiday"]')
    console.log(`🔍 Feriados restantes: ${remaining.length}`)
    
    if (remaining.length === 0) {
      console.log('🎉 ¡Todos los feriados eliminados exitosamente!')
    } else {
      console.log('⚠️ Aún quedan feriados por eliminar')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

deleteAllHolidays()
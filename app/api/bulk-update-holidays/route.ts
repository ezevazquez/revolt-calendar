import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

// Configure Sanity client for server-side operations
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-10-17',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        message: 'SANITY_API_TOKEN not configured on server.' 
      }, { status: 500 });
    }

    const { ids, status } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ 
        success: false, 
        message: 'IDs and status are required.' 
      }, { status: 400 });
    }

    // Create patches for all holidays
    const patches = ids.map((id: string) => 
      client.patch(id).set({ status })
    );

    // Execute all patches
    await Promise.all(patches.map(patch => patch.commit()));

    return NextResponse.json({ 
      success: true, 
      message: `${ids.length} holidays updated to: ${status}` 
    });

  } catch (error: unknown) {
    console.error('Error en la API de bulk update de feriados:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error updating holidays.' 
    }, { status: 500 });
  }
}

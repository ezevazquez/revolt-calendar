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

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID and status are required.' 
      }, { status: 400 });
    }

    await client.patch(id).set({ status }).commit();

    return NextResponse.json({ 
      success: true, 
      message: `Holiday updated to: ${status}` 
    });

  } catch (error: unknown) {
    console.error('Error en la API de actualización de feriado:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error updating holiday.' 
    }, { status: 500 });
  }
}

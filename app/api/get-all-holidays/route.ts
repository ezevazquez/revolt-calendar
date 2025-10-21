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

export async function GET() {
  try {
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        message: 'SANITY_API_TOKEN not configured on server.' 
      }, { status: 500 });
    }

    const query = `*[_type == "holiday"] | order(startDate asc)`;
    const holidays = await client.fetch(query);

    return NextResponse.json({ 
      success: true, 
      holidays 
    });

  } catch (error: unknown) {
    console.error('Error fetching all holidays:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error fetching holidays.' 
    }, { status: 500 });
  }
}

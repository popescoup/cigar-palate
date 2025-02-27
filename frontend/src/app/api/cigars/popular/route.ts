// src/app/api/cigars/trending/route.ts

/*
	•	Proxies a request to fetch trending cigars from the backend’s /api/cigars/trending endpoint.
	•	Ensures the response is not cached by setting appropriate headers (Cache-Control, Pragma, Expires).
	•	Returns the fetched data as JSON to the frontend, including the no-cache headers in the response.
	•	Logs an error and returns a 500 status with an error message if the fetch operation fails, indicating a potential issue with data retrieval.
*/

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/cigars/trending`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching trending cigars:', error);
    return NextResponse.json({ error: 'Failed to fetch trending cigars' }, { status: 500 });
  }
}
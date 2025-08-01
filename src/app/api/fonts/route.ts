import { FontSearchOptions, GoogleFontsResponse } from '@/lib/google-fonts';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_FONTS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Google Fonts API key not configured',
          items: [], // Return empty array for fallback handling
        },
        { status: 200 }, // Changed to 200 to allow fallback fonts
      );
    }

    const options: FontSearchOptions = await request.json();

    // Build Google Fonts API URL
    const baseUrl = 'https://www.googleapis.com/webfonts/v1/webfonts';
    const searchParams = new URLSearchParams({
      key: apiKey,
    });

    // Add optional parameters
    if (options.sort) {
      searchParams.set('sort', options.sort);
    }

    if (options.category) {
      searchParams.set('category', options.category);
    }

    if (options.subset) {
      searchParams.set('subset', options.subset);
    }

    const url = `${baseUrl}?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Fonts API error:', response.status, errorText);

      return NextResponse.json(
        {
          error: 'Failed to fetch fonts from Google Fonts API',
          details: `Status: ${response.status}`,
        },
        { status: response.status },
      );
    }

    const data: GoogleFontsResponse = await response.json();

    // Return the fonts data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in fonts API route:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// Handle GET requests (fallback)
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST method to fetch fonts with options' },
    { status: 405 },
  );
}

import { FontSearchOptions, GoogleFontsResponse, GoogleFont } from '@/lib/google-fonts';
import { NextRequest, NextResponse } from 'next/server';

const METADATA_URL = 'https://fonts.google.com/metadata/fonts';
const METADATA_CACHE_TTL = 24 * 60 * 60 * 1000;

let metadataCache:
  | {
      timestamp: number;
      axesByFamily: Map<string, GoogleFont['axes']>;
    }
  | null = null;

async function getAxesByFamily(): Promise<Map<string, GoogleFont['axes']>> {
  if (
    metadataCache &&
    Date.now() - metadataCache.timestamp < METADATA_CACHE_TTL
  ) {
    return metadataCache.axesByFamily;
  }

  const response = await fetch(METADATA_URL, {
    headers: { Accept: 'text/plain' },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
  }

  const text = await response.text();
  const cleaned = text.replace(/^\)\]\}'\s*/, '');
  const data = JSON.parse(cleaned);

  const list =
    data.familyMetadataList ||
    data.familyMetadata ||
    data.fonts ||
    data.items ||
    [];

  const axesByFamily = new Map<string, GoogleFont['axes']>();

  list.forEach((font: any) => {
    const family = font.family || font.name;
    const axesSource = font.axes || font.axis || font.variations || [];
    if (!family || !Array.isArray(axesSource) || axesSource.length === 0) return;

    const axes = axesSource
      .map((axis: any) => {
        const tag = axis.tag || axis.axisTag || axis.name || axis.tagName;
        const min = axis.min ?? axis.minValue ?? axis.start ?? axis.minValue;
        const max = axis.max ?? axis.maxValue ?? axis.end ?? axis.maxValue;
        const defaultValue =
          axis.defaultValue ?? axis.default ?? axis.defaultValue ?? axis.value;

        if (typeof tag !== 'string') return null;

        const minValue = Number(min);
        const maxValue = Number(max);
        const defaultParsed = Number(defaultValue ?? min);

        if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) return null;

        return {
          tag,
          min: minValue,
          max: maxValue,
          defaultValue: Number.isFinite(defaultParsed) ? defaultParsed : minValue,
        };
      })
      .filter(Boolean) as GoogleFont['axes'];

    if (axes.length > 0) {
      axesByFamily.set(family, axes);
    }
  });

  metadataCache = { timestamp: Date.now(), axesByFamily };
  return axesByFamily;
}

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

    let axesByFamily: Map<string, GoogleFont['axes']> | null = null;
    try {
      axesByFamily = await getAxesByFamily();
    } catch (error) {
      console.warn('Failed to enrich fonts with axis metadata:', error);
    }

    const items = (data.items || []).map((font) => {
      const axes = axesByFamily?.get(font.family);
      return axes ? { ...font, axes } : font;
    });

    // Return the fonts data
    return NextResponse.json({ ...data, items });
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

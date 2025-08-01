import { NextRequest, NextResponse } from 'next/server';

interface FontVariant {
  weight: string;
  style: string;
  url: string;
}

interface FontData {
  family: string;
  variants: FontVariant[];
}

interface EmbedFontsRequest {
  fonts: Array<{
    family: string;
    weights: string[];
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { fonts }: EmbedFontsRequest = await request.json();

    if (!fonts || !Array.isArray(fonts) || fonts.length === 0) {
      return NextResponse.json({ error: 'No fonts provided' }, { status: 400 });
    }

    const embeddedFonts: string[] = [];

    for (const font of fonts) {
      try {
        const embeddedCSS = await embedSingleFont(font.family, font.weights);
        if (embeddedCSS) {
          embeddedFonts.push(embeddedCSS);
        }
      } catch (error) {
        console.warn(`Failed to embed font ${font.family}:`, error);
        // Continue with other fonts
      }
    }

    const combinedCSS = embeddedFonts.join('\n');

    return NextResponse.json({ 
      css: combinedCSS,
      fontsEmbedded: embeddedFonts.length 
    });

  } catch (error) {
    console.error('Font embedding API error:', error);
    return NextResponse.json(
      { error: 'Failed to embed fonts' },
      { status: 500 }
    );
  }
}

async function embedSingleFont(fontFamily: string, weights: string[] = ['400']): Promise<string> {
  // Create Google Fonts URL
  const weightsParam = weights.join(';');
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weightsParam}&display=swap`;

  try {
    // Fetch the CSS from Google Fonts
    const response = await fetch(googleFontsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Fonts CSS: ${response.status}`);
    }

    const cssText = await response.text();
    
    // Extract font URLs from the CSS
    const fontData = extractFontUrls(cssText, fontFamily);
    
    if (fontData.variants.length === 0) {
      throw new Error(`No font variants found for ${fontFamily}`);
    }

    // Download each font file and convert to base64
    const base64Data = new Map<string, string>();
    
    for (const variant of fontData.variants) {
      try {
        const base64 = await downloadFontAsBase64(variant.url);
        base64Data.set(variant.url, base64);
      } catch (error) {
        console.warn(`Failed to download variant ${variant.weight} for ${fontFamily}:`, error);
      }
    }

    if (base64Data.size === 0) {
      throw new Error(`Failed to download any font variants for ${fontFamily}`);
    }

    // Create embedded CSS with base64 data
    return createEmbeddedCSS(fontData, base64Data);

  } catch (error) {
    console.error(`Failed to embed font ${fontFamily}:`, error);
    throw error;
  }
}

function extractFontUrls(cssText: string, fontFamily: string): FontData {
  const variants: FontVariant[] = [];
  const fontFaceRegex = /@font-face\s*{[^}]*}/g;
  const matches = cssText.match(fontFaceRegex);
  
  if (matches) {
    for (const match of matches) {
      const weightMatch = match.match(/font-weight:\s*([^;]+)/);
      const styleMatch = match.match(/font-style:\s*([^;]+)/);
      const urlMatch = match.match(/url\(([^)]+)\)/);
      
      if (urlMatch) {
        variants.push({
          weight: weightMatch?.[1]?.trim() || '400',
          style: styleMatch?.[1]?.trim() || 'normal',
          url: urlMatch[1].replace(/['"]/g, '')
        });
      }
    }
  }
  
  return {
    family: fontFamily,
    variants
  };
}

async function downloadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

function createEmbeddedCSS(fontData: FontData, base64Data: Map<string, string>): string {
  let css = '';
  
  for (const variant of fontData.variants) {
    const base64 = base64Data.get(variant.url);
    if (base64) {
      const format = variant.url.includes('.woff2') ? 'woff2' : 
                   variant.url.includes('.woff') ? 'woff' : 'truetype';
      
      css += `
@font-face {
  font-family: '${fontData.family}';
  font-style: ${variant.style};
  font-weight: ${variant.weight};
  font-display: swap;
  src: url(data:font/${format};base64,${base64}) format('${format}');
}`;
    }
  }
  
  return css;
}
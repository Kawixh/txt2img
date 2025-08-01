interface FontVariant {
  weight: string;
  style: string;
  url: string;
}

interface FontData {
  family: string;
  variants: FontVariant[];
}

interface EmbeddedFont {
  family: string;
  css: string;
  base64Data: string;
}

class FontEmbedding {
  private fontCache = new Map<string, string>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Embeds a Google Font by using the server-side API
   */
  async embedFont(
    fontFamily: string,
    weights: string[] = ['400'],
  ): Promise<EmbeddedFont> {
    const cacheKey = `${fontFamily}-${weights.join(',')}`;

    // Check cache first
    if (this.fontCache.has(cacheKey)) {
      const cachedCSS = this.fontCache.get(cacheKey)!;
      return {
        family: fontFamily,
        css: cachedCSS,
        base64Data: 'cached',
      };
    }

    try {
      // Use server-side API to embed fonts
      const response = await fetch('/api/embed-fonts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fonts: [
            {
              family: fontFamily,
              weights: weights,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Font embedding API failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.css) {
        throw new Error(`No CSS returned for font ${fontFamily}`);
      }

      const embeddedFont: EmbeddedFont = {
        family: fontFamily,
        css: data.css,
        base64Data: 'embedded',
      };

      // Cache the result
      this.fontCache.set(cacheKey, data.css);

      return embeddedFont;
    } catch (error) {
      console.error(`Failed to embed font ${fontFamily}:`, error);
      throw error;
    }
  }

  /**
   * Embeds multiple fonts and returns combined CSS using server-side API
   */
  async embedMultipleFonts(
    fontFamilies: string[],
    weightsMap?: Map<string, string[]>,
  ): Promise<string> {
    if (fontFamilies.length === 0) {
      return '';
    }

    // Check cache for all fonts first
    const cachedCSS: string[] = [];
    const fontsToEmbed: Array<{ family: string; weights: string[] }> = [];

    for (const fontFamily of fontFamilies) {
      const weights = weightsMap?.get(fontFamily) || ['400'];
      const cacheKey = `${fontFamily}-${weights.join(',')}`;

      if (this.fontCache.has(cacheKey)) {
        cachedCSS.push(this.fontCache.get(cacheKey)!);
      } else {
        fontsToEmbed.push({ family: fontFamily, weights });
      }
    }

    // If we need to embed fonts, use the server API
    if (fontsToEmbed.length > 0) {
      try {
        const response = await fetch('/api/embed-fonts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fonts: fontsToEmbed,
          }),
        });

        if (!response.ok) {
          throw new Error(`Font embedding API failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.css) {
          cachedCSS.push(data.css);

          // Cache individual fonts for future use
          // Note: This is a simplified caching approach
          // In a more sophisticated implementation, we'd parse the CSS to cache individual fonts
          for (const font of fontsToEmbed) {
            const cacheKey = `${font.family}-${font.weights.join(',')}`;
            this.fontCache.set(cacheKey, data.css);
          }
        }
      } catch (error) {
        console.warn(
          'Failed to embed fonts via API, proceeding without:',
          error,
        );
      }
    }

    return cachedCSS.join('\n');
  }

  /**
   * Injects embedded font CSS into document head temporarily
   */
  injectEmbeddedCSS(css: string): () => void {
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    styleElement.setAttribute('data-embedded-fonts', 'true');
    document.head.appendChild(styleElement);

    // Return cleanup function
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }

  /**
   * Clears the font cache
   */
  clearCache(): void {
    this.fontCache.clear();
  }

  /**
   * Gets cache size for monitoring
   */
  getCacheSize(): number {
    return this.fontCache.size;
  }
}

// Export singleton instance
export const fontEmbedding = new FontEmbedding();
export type { EmbeddedFont, FontData, FontVariant };

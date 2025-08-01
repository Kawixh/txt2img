export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  kind: string;
}

export interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
  error?: string;
}

export interface FontCacheItem {
  font: GoogleFont;
  timestamp: number;
  loaded: boolean;
}

export interface FontSearchOptions {
  sort?: 'alpha' | 'date' | 'popularity' | 'style' | 'trending';
  category?: GoogleFont['category'];
  subset?: string;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const POPULAR_FONTS_CACHE_KEY = 'google-fonts-popular';
const FONT_SEARCH_CACHE_KEY = 'google-fonts-search';

class GoogleFontsManager {
  private fontsCache = new Map<string, FontCacheItem>();
  private loadedFonts = new Set<string>();
  private popularFonts: GoogleFont[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadCacheFromStorage();
    }
  }

  private loadCacheFromStorage() {
    try {
      const cached = localStorage.getItem(POPULAR_FONTS_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          this.popularFonts = data.fonts;
          data.fonts.forEach((font: GoogleFont) => {
            this.fontsCache.set(font.family, {
              font,
              timestamp: data.timestamp,
              loaded: false,
            });
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load fonts cache from storage:', error);
    }
  }

  private saveCacheToStorage() {
    try {
      const cacheData = {
        fonts: this.popularFonts,
        timestamp: Date.now(),
      };
      localStorage.setItem(POPULAR_FONTS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save fonts cache to storage:', error);
    }
  }

  async fetchFonts(options: FontSearchOptions = {}): Promise<GoogleFont[]> {
    const cacheKey = `${FONT_SEARCH_CACHE_KEY}-${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCachedFonts(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch('/api/fonts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch fonts: ${response.statusText}`);
      }

      const data: GoogleFontsResponse = await response.json();
      const fonts = data.items || [];

      // If no fonts and there's an error, return empty array for fallback handling
      if (fonts.length === 0 && data.error) {
        console.warn('Google Fonts API not configured, using fallback fonts');
        return [];
      }

      // Cache the results
      this.cacheFonts(cacheKey, fonts);

      // If this is a popular fonts request, update our popular cache
      if (!options.category && options.sort === 'popularity') {
        this.popularFonts = fonts.slice(0, 50); // Keep top 50 popular fonts
        this.saveCacheToStorage();
      }

      return fonts;
    } catch (error) {
      console.error('Error fetching Google Fonts:', error);
      throw error;
    }
  }

  private getCachedFonts(cacheKey: string): GoogleFont[] | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data.fonts;
    } catch (error) {
      console.warn('Failed to get cached fonts:', error);
      return null;
    }
  }

  private cacheFonts(cacheKey: string, fonts: GoogleFont[]) {
    try {
      if (typeof window === 'undefined') return;
      
      const cacheData = {
        fonts,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache fonts:', error);
    }
  }

  async loadFont(fontFamily: string, variants: string[] = ['400']): Promise<void> {
    if (this.loadedFonts.has(fontFamily)) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create font variants string for Google Fonts URL
        const variantsString = variants.join(',');
        const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${variantsString}&display=swap`;

        // Check if font is already loaded
        const existingLink = document.querySelector(`link[href="${fontUrl}"]`) as HTMLLinkElement;
        if (existingLink) {
          // Even if link exists, verify font is actually ready
          this.verifyFontReady(fontFamily).then(() => {
            this.loadedFonts.add(fontFamily);
            resolve();
          }).catch(() => {
            // If verification fails, continue with normal loading
            this.loadedFonts.add(fontFamily);
            resolve();
          });
          return;
        }

        // Create and inject font link
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        
        link.onload = () => {
          // Wait for font to be actually ready after CSS loads
          this.verifyFontReady(fontFamily).then(() => {
            this.loadedFonts.add(fontFamily);
            
            // Update cache to mark font as loaded
            const cacheItem = this.fontsCache.get(fontFamily);
            if (cacheItem) {
              cacheItem.loaded = true;
            }
            
            resolve();
          }).catch((error) => {
            console.warn(`Font verification failed for ${fontFamily}, but continuing:`, error);
            this.loadedFonts.add(fontFamily);
            resolve();
          });
        };
        
        link.onerror = () => {
          reject(new Error(`Failed to load font: ${fontFamily}`));
        };

        document.head.appendChild(link);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async verifyFontReady(fontFamily: string): Promise<void> {
    if (typeof window === 'undefined' || !document.fonts) {
      return Promise.resolve();
    }

    try {
      // Use FontFace API to verify font is loaded and ready
      await document.fonts.load(`16px "${fontFamily}"`);
      
      // Additional check: verify font is actually available
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Test if font renders differently than fallback
      ctx.font = `16px "${fontFamily}", Arial`;
      const testWidth = ctx.measureText('Test').width;
      
      ctx.font = '16px Arial';
      const fallbackWidth = ctx.measureText('Test').width;
      
      // If widths are identical, font might not have loaded
      if (Math.abs(testWidth - fallbackWidth) < 0.1) {
        console.warn(`Font ${fontFamily} may not have loaded properly`);
      }
    } catch (error) {
      console.warn(`Font verification failed for ${fontFamily}:`, error);
      throw error;
    }
  }

  isFontLoaded(fontFamily: string): boolean {
    return this.loadedFonts.has(fontFamily);
  }

  async ensureAllFontsReady(fontFamilies: string[]): Promise<void> {
    if (typeof window === 'undefined' || !document.fonts) {
      return Promise.resolve();
    }

    try {
      // Create promises for all unique fonts
      const uniqueFonts = [...new Set(fontFamilies)];
      const fontPromises = uniqueFonts.map(async (fontFamily) => {
        // Skip system fonts
        if (this.isSystemFont(fontFamily)) {
          return;
        }

        try {
          // Use document.fonts.load to ensure font is ready
          await document.fonts.load(`16px "${fontFamily}"`);
          
          // Small delay to ensure font is fully rendered
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`Failed to ensure font ready: ${fontFamily}`, error);
        }
      });

      await Promise.all(fontPromises);
      
      // Additional safety delay for all fonts to be fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('Error ensuring fonts ready:', error);
    }
  }

  isSystemFont(fontFamily: string): boolean {
    const systemFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
      'Courier New', 'Verdana', 'Impact', 'Comic Sans MS', 
      'Trebuchet MS', 'Palatino', 'serif', 'sans-serif', 'monospace'
    ];
    return systemFonts.some(font => 
      fontFamily.toLowerCase().includes(font.toLowerCase())
    );
  }

  getPopularFonts(): GoogleFont[] {
    return this.popularFonts;
  }

  /**
   * Gets font weights for text elements to optimize embedding
   */
  extractFontWeights(textElements: any[]): Map<string, string[]> {
    const fontWeightsMap = new Map<string, string[]>();
    
    textElements.forEach(element => {
      const fontFamily = element.fontFamily;
      const fontWeight = element.fontWeight?.toString() || '400';
      
      if (!fontWeightsMap.has(fontFamily)) {
        fontWeightsMap.set(fontFamily, []);
      }
      
      const weights = fontWeightsMap.get(fontFamily)!;
      if (!weights.includes(fontWeight)) {
        weights.push(fontWeight);
      }
    });
    
    return fontWeightsMap;
  }

  /**
   * Gets all font families currently used in text elements
   */
  getUsedFontFamilies(textElements: any[]): string[] {
    return [...new Set(textElements.map(element => element.fontFamily))]
      .filter(font => !this.isSystemFont(font));
  }

  searchFonts(fonts: GoogleFont[], query: string): GoogleFont[] {
    if (!query.trim()) return fonts;
    
    const lowercaseQuery = query.toLowerCase();
    return fonts.filter(font =>
      font.family.toLowerCase().includes(lowercaseQuery)
    );
  }

  filterFontsByCategory(fonts: GoogleFont[], category?: GoogleFont['category']): GoogleFont[] {
    if (!category) return fonts;
    return fonts.filter(font => font.category === category);
  }

  clearCache() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(POPULAR_FONTS_CACHE_KEY);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(FONT_SEARCH_CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
    this.fontsCache.clear();
    this.popularFonts = [];
  }
}

export const googleFontsManager = new GoogleFontsManager();
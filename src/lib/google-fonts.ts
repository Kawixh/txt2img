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
          this.loadedFonts.add(fontFamily);
          resolve();
          return;
        }

        // Create and inject font link
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        
        link.onload = () => {
          this.loadedFonts.add(fontFamily);
          
          // Update cache to mark font as loaded
          const cacheItem = this.fontsCache.get(fontFamily);
          if (cacheItem) {
            cacheItem.loaded = true;
          }
          
          resolve();
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

  isFontLoaded(fontFamily: string): boolean {
    return this.loadedFonts.has(fontFamily);
  }

  getPopularFonts(): GoogleFont[] {
    return this.popularFonts;
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
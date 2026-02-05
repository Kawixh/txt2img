import type { TextElement } from '@/types';

export type GoogleFont = {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  kind: string;
  axes?: Array<{
    tag: string;
    min: number;
    max: number;
    defaultValue: number;
  }>;
};

type GoogleFontAxis = NonNullable<GoogleFont['axes']>[number];

export type GoogleFontsResponse = {
  kind: string;
  items: GoogleFont[];
  error?: string;
};

export type FontCacheItem = {
  font: GoogleFont;
  timestamp: number;
  loaded: boolean;
};

export type FontSearchOptions = {
  sort?: 'alpha' | 'date' | 'popularity' | 'style' | 'trending';
  category?: GoogleFont['category'];
  subset?: string;
};

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

  async loadFont(
    fontFamily: string,
    options: string[] | { variants?: string[]; axes?: GoogleFont['axes'] } = [
      '400',
    ],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const resolvedOptions = Array.isArray(options)
          ? { variants: options, axes: undefined }
          : options;

        const variants = this.normalizeVariants(resolvedOptions?.variants);
        const axes: GoogleFontAxis[] = (resolvedOptions?.axes ?? [])
          .filter(
            (axis) =>
              axis &&
              typeof axis.tag === 'string' &&
              Number.isFinite(axis.min) &&
              Number.isFinite(axis.max),
          )
          .map((axis) => ({
            ...axis,
            min: Number(axis.min),
            max: Number(axis.max),
          }));

        const urlsToTry: string[] = [];
        if (axes.length > 0) {
          urlsToTry.push(this.buildVariableFontUrl(fontFamily, axes));

          const fallbackAxes = this.pickFallbackAxes(axes);
          if (fallbackAxes.length > 0) {
            const fallbackUrl = this.buildVariableFontUrl(
              fontFamily,
              fallbackAxes,
            );
            if (fallbackUrl !== urlsToTry[0]) {
              urlsToTry.push(fallbackUrl);
            }
          }

          urlsToTry.push(this.buildStaticFontUrl(fontFamily, variants));
        } else {
          urlsToTry.push(this.buildStaticFontUrl(fontFamily, variants));
        }

        const uniqueUrls = Array.from(new Set(urlsToTry));

        const tryLoad = (index: number) => {
          if (index >= uniqueUrls.length) {
            reject(new Error(`Failed to load font: ${fontFamily}`));
            return;
          }

          const fontUrl = uniqueUrls[index];

          if (this.loadedFonts.has(fontUrl)) {
            resolve();
            return;
          }

          const existingLink = document.querySelector(
            `link[href="${fontUrl}"]`,
          ) as HTMLLinkElement | null;

          const markLoaded = () => {
            this.loadedFonts.add(fontUrl);
            const cacheItem = this.fontsCache.get(fontFamily);
            if (cacheItem) {
              cacheItem.loaded = true;
            }
          };

          const createAndLoadLink = () => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fontUrl;

            link.onload = () => {
              this.verifyFontReady(fontFamily)
                .then(() => {
                  markLoaded();
                  resolve();
                })
                .catch((error) => {
                  console.warn(
                    `Font verification failed for ${fontFamily}, retrying fallback:`,
                    error,
                  );
                  link.remove();
                  tryLoad(index + 1);
                });
            };

            link.onerror = () => {
              link.remove();
              tryLoad(index + 1);
            };

            document.head.appendChild(link);
          };

          if (existingLink) {
            this.verifyFontReady(fontFamily)
              .then(() => {
                markLoaded();
                resolve();
              })
              .catch(() => {
                existingLink.remove();
                createAndLoadLink();
              });
            return;
          }

          createAndLoadLink();
        };

        tryLoad(0);
      } catch (error) {
        reject(error);
      }
    });
  }

  private normalizeVariants(variants?: string[]): string[] {
    if (!variants || variants.length === 0) return ['400'];

    const weights = variants
      .map((variant) => {
        const normalized = variant.trim().toLowerCase();
        if (normalized === 'regular') return '400';
        if (normalized === 'italic') return '400';
        const match = normalized.match(/(\d{3})/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (weights.length === 0) return ['400'];

    const unique = Array.from(new Set(weights))
      .map((weight) => Number(weight))
      .filter((weight) => Number.isFinite(weight))
      .sort((a, b) => a - b)
      .map((weight) => String(weight));

    return unique.length > 0 ? unique : ['400'];
  }

  private pickFallbackAxes(axes: GoogleFontAxis[]): GoogleFontAxis[] {
    if (axes.length === 0) return [];

    const axisMap = new Map<string, GoogleFontAxis>();
    axes.forEach((axis) => {
      if (axis?.tag) {
        axisMap.set(axis.tag, axis);
      }
    });

    const preferredTags = ['ital', 'opsz', 'wght'];
    const selected = preferredTags
      .map((tag) => axisMap.get(tag))
      .filter((axis): axis is GoogleFontAxis => Boolean(axis));

    if (selected.length > 0) {
      return selected;
    }

    return axes.slice(0, 1);
  }

  private buildVariableFontUrl(fontFamily: string, axes: GoogleFontAxis[]) {
    const axisMap = new Map<string, GoogleFontAxis>();
    axes.forEach((axis) => {
      if (axis?.tag) {
        const min = Number(axis.min);
        const max = Number(axis.max);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return;
        axisMap.set(axis.tag, {
          ...axis,
          min: min,
          max: max,
        });
      }
    });

    const axisTags = Array.from(axisMap.keys()).sort((a, b) =>
      a.localeCompare(b, 'en', { sensitivity: 'base' }),
    );

    if (axisTags.length === 0) {
      return this.buildStaticFontUrl(fontFamily, ['400']);
    }

    const italAxis = axisMap.get('ital');
    const formatRange = (axis: GoogleFontAxis) => {
      const min = Math.min(axis.min, axis.max);
      const max = Math.max(axis.min, axis.max);
      return min === max ? `${min}` : `${min}..${max}`;
    };

    const buildAxisRow = (italValue?: number) =>
      axisTags
        .map((tag) => {
          if (tag === 'ital') {
            return `${italValue ?? 0}`;
          }
          const axis = axisMap.get(tag);
          return axis ? formatRange(axis) : '';
        })
        .filter((value) => value.length > 0)
        .join(',');

    const axisValues = italAxis
      ? (() => {
          const italMin = Math.min(italAxis.min, italAxis.max);
          const italMax = Math.max(italAxis.min, italAxis.max);
          const values = italMin === italMax ? [italMin] : [italMin, italMax];
          return values.map((value) => buildAxisRow(value));
        })()
      : [buildAxisRow()];

    const axisPart = `:${axisTags.join(',')}@${axisValues.join(';')}`;

    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      fontFamily,
    )}${axisPart}&display=swap`;
  }

  private buildStaticFontUrl(fontFamily: string, variants: string[]) {
    const normalized = this.normalizeVariants(variants);
    const variantsString = normalized.join(';');
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      fontFamily,
    )}:wght@${variantsString}&display=swap`;
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
    const encodedFamily = encodeURIComponent(fontFamily);
    return Array.from(this.loadedFonts).some((url) =>
      url.includes(`family=${encodedFamily}`),
    );
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
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`Failed to ensure font ready: ${fontFamily}`, error);
        }
      });

      await Promise.all(fontPromises);

      // Additional safety delay for all fonts to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('Error ensuring fonts ready:', error);
    }
  }

  isSystemFont(fontFamily: string): boolean {
    const systemFonts = [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Courier New',
      'Verdana',
      'Impact',
      'Comic Sans MS',
      'Trebuchet MS',
      'Palatino',
      'serif',
      'sans-serif',
      'monospace',
    ];
    return systemFonts.some((font) =>
      fontFamily.toLowerCase().includes(font.toLowerCase()),
    );
  }

  getPopularFonts(): GoogleFont[] {
    return this.popularFonts;
  }

  /**
   * Gets font weights for text elements to optimize embedding
   */
  extractFontWeights(textElements: TextElement[]): Map<string, string[]> {
    const fontWeightsMap = new Map<string, string[]>();

    textElements.forEach((element) => {
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
  getUsedFontFamilies(textElements: TextElement[]): string[] {
    return [
      ...new Set(textElements.map((element) => element.fontFamily)),
    ].filter((font) => !this.isSystemFont(font));
  }

  searchFonts(fonts: GoogleFont[], query: string): GoogleFont[] {
    if (!query.trim()) return fonts;

    const lowercaseQuery = query.toLowerCase();
    return fonts.filter((font) =>
      font.family.toLowerCase().includes(lowercaseQuery),
    );
  }

  filterFontsByCategory(
    fonts: GoogleFont[],
    category?: GoogleFont['category'],
  ): GoogleFont[] {
    if (!category) return fonts;
    return fonts.filter((font) => font.category === category);
  }

  clearCache() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(POPULAR_FONTS_CACHE_KEY);
      Object.keys(localStorage).forEach((key) => {
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

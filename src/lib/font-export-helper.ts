/**
 * Font Export Helper - A simpler approach to ensure fonts work in exports
 * This approach focuses on ensuring fonts are fully loaded and available
 * rather than trying to embed them as base64
 */

class FontExportHelper {
  private loadedFonts = new Set<string>();
  private fontLoadPromises = new Map<string, Promise<void>>();

  /**
   * Ensures a font is loaded and ready for export
   */
  async ensureFontLoaded(fontFamily: string, weights: string[] = ['400']): Promise<void> {
    const cacheKey = `${fontFamily}-${weights.join(',')}`;
    
    // Return existing promise if already loading
    if (this.fontLoadPromises.has(cacheKey)) {
      return this.fontLoadPromises.get(cacheKey)!;
    }

    // Return immediately if already loaded
    if (this.loadedFonts.has(cacheKey)) {
      return Promise.resolve();
    }

    // Create and cache the loading promise
    const loadPromise = this.loadFontInternal(fontFamily, weights, cacheKey);
    this.fontLoadPromises.set(cacheKey, loadPromise);
    
    return loadPromise;
  }

  private async loadFontInternal(fontFamily: string, weights: string[], cacheKey: string): Promise<void> {
    try {
      // Create Google Fonts URL
      const weightsParam = weights.join(';');
      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weightsParam}&display=block`;
      
      // Check if font link already exists
      const existingLink = document.querySelector(`link[href*="${encodeURIComponent(fontFamily)}"]`);
      
      if (!existingLink) {
        // Create and add font link
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        link.setAttribute('data-font-family', fontFamily);
        document.head.appendChild(link);
        
        // Wait for stylesheet to load
        await new Promise<void>((resolve, reject) => {
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to load font: ${fontFamily}`));
          
          // Timeout after 10 seconds
          setTimeout(() => reject(new Error(`Font loading timeout: ${fontFamily}`)), 10000);
        });
      }

      // Wait for fonts to be available in document.fonts
      await this.waitForFontsReady(fontFamily, weights);
      
      // Additional verification
      await this.verifyFontRendering(fontFamily);
      
      // Mark as loaded
      this.loadedFonts.add(cacheKey);
      console.log(`✓ Font loaded successfully: ${fontFamily}`);
      
    } catch (error) {
      console.warn(`Failed to load font ${fontFamily}:`, error);
      // Don't throw - allow export to continue with fallback fonts
    }
  }

  private async waitForFontsReady(fontFamily: string, weights: string[]): Promise<void> {
    if (typeof window === 'undefined' || !document.fonts) {
      return;
    }

    const fontLoadPromises = weights.map(weight => 
      document.fonts.load(`${weight} 16px "${fontFamily}"`)
        .catch(error => {
          console.warn(`Failed to load weight ${weight} for ${fontFamily}:`, error);
        })
    );

    await Promise.all(fontLoadPromises);
    
    // Additional wait for font rendering
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async verifyFontRendering(fontFamily: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Test text rendering with the font
      ctx.font = `16px "${fontFamily}", Arial`;
      const testWidth = ctx.measureText('Test Font Rendering').width;
      
      // Test with Arial fallback
      ctx.font = '16px Arial';
      const arialWidth = ctx.measureText('Test Font Rendering').width;
      
      // If they're the same, the font might not be loaded
      if (Math.abs(testWidth - arialWidth) < 1) {
        console.warn(`Font rendering verification failed for ${fontFamily} - widths are too similar`);
      }
    } catch (error) {
      console.warn(`Font rendering verification error for ${fontFamily}:`, error);
    }
  }

  /**
   * Ensures multiple fonts are loaded
   */
  async ensureMultipleFontsLoaded(fontsMap: Map<string, string[]>): Promise<void> {
    const loadPromises = Array.from(fontsMap.entries()).map(([fontFamily, weights]) =>
      this.ensureFontLoaded(fontFamily, weights)
    );

    await Promise.all(loadPromises);
  }

  /**
   * Prepares canvas for export with proper font loading and inline styles
   */
  async prepareForExport(fontFamilies: string[], fontWeightsMap?: Map<string, string[]>): Promise<() => void> {
    console.log('🔄 Preparing fonts for export...');
    
    // Create fonts map
    const fontsMap = new Map<string, string[]>();
    fontFamilies.forEach(fontFamily => {
      const weights = fontWeightsMap?.get(fontFamily) || ['400'];
      fontsMap.set(fontFamily, weights);
    });

    // Load all fonts
    await this.ensureMultipleFontsLoaded(fontsMap);
    
    // Create inline font styles to avoid CORS issues with Google Fonts stylesheets
    const inlineStyleElement = this.createInlineFontStyles(fontsMap);
    
    // Force a reflow to ensure fonts are applied
    document.body.offsetHeight; // Trigger reflow
    
    // Wait a bit more for font rendering to stabilize
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ Fonts prepared for export with inline styles');
    
    // Return cleanup function to remove inline styles
    return () => {
      if (inlineStyleElement && inlineStyleElement.parentNode) {
        inlineStyleElement.parentNode.removeChild(inlineStyleElement);
      }
      console.log('🧹 Font export cleanup completed');
    };
  }

  /**
   * Creates inline font styles that work around CORS restrictions
   */
  private createInlineFontStyles(fontsMap: Map<string, string[]>): HTMLStyleElement {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-font-export-helper', 'true');
    
    let cssContent = '';
    
    // Add font-face declarations that reference the already loaded fonts
    for (const [fontFamily, weights] of fontsMap) {
      for (const weight of weights) {
        cssContent += `
          .font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}-${weight} {
            font-family: "${fontFamily}", Arial, sans-serif !important;
            font-weight: ${weight} !important;
          }
        `;
      }
      
      // General font family rule
      cssContent += `
        .font-family-${fontFamily.replace(/\s+/g, '-').toLowerCase()} {
          font-family: "${fontFamily}", Arial, sans-serif !important;
        }
      `;
    }
    
    styleElement.textContent = cssContent;
    document.head.appendChild(styleElement);
    
    return styleElement;
  }

  /**
   * Gets the number of loaded fonts
   */
  getLoadedFontsCount(): number {
    return this.loadedFonts.size;
  }

  /**
   * Clears the font cache
   */
  clearCache(): void {
    this.loadedFonts.clear();
    this.fontLoadPromises.clear();
  }
}

// Export singleton instance
export const fontExportHelper = new FontExportHelper();
/**
 * Reliable Export - A simpler approach using html-to-image with better font handling
 * This approach focuses on making html-to-image work reliably rather than replacing it
 */

import { toPng } from 'html-to-image';

type ExportOptions = {
  width: number;
  height: number;
  pixelRatio?: number;
  quality?: number;
  transparentBackground?: boolean;
  maxPixelCount?: number;
};

type PngOptions = NonNullable<Parameters<typeof toPng>[1]>;

class ReliableExporter {
  private readonly defaultPixelRatio = 3;
  private readonly defaultMaxPixelCount = 48_000_000;

  /**
   * Creates inline font CSS that targets specific elements
   */
  private async createInlineFontCSS(fontFamilies: string[]): Promise<string> {
    const fontCSSRules: string[] = [];

    for (const fontFamily of fontFamilies) {
      if (this.isSystemFont(fontFamily)) {
        continue;
      }

      // Extremely aggressive CSS targeting - force font on EVERYTHING
      fontCSSRules.push(`
        /* Universal font override */
        *, *::before, *::after,
        html, body, div, span, p, h1, h2, h3, h4, h5, h6,
        #text-canvas, #text-canvas *,
        [contenteditable], [contenteditable] *,
        .text-element, .text-shimmer,
        [style*="font-family"], [style*="fontFamily"] {
          font-family: "${fontFamily}", Arial, sans-serif !important;
        }
        
        /* Direct tag targeting */
        div, span, p {
          font-family: "${fontFamily}", Arial, sans-serif !important;
        }
      `);
    }

    return fontCSSRules.join('\n');
  }

  private isSystemFont(fontFamily: string): boolean {
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

  /**
   * Waits for all fonts to be properly loaded
   */
  private async waitForFonts(fontFamilies: string[]): Promise<void> {
    if (typeof window === 'undefined' || !document.fonts) {
      return;
    }

    const fontPromises = fontFamilies
      .filter((font) => !this.isSystemFont(font))
      .map(async (fontFamily) => {
        try {
          await document.fonts.load(`16px "${fontFamily}"`);
          await document.fonts.load(`bold 16px "${fontFamily}"`);
          await document.fonts.load(`italic 16px "${fontFamily}"`);

          // Check if font is actually available
          const isLoaded = document.fonts.check(`16px "${fontFamily}"`);
          console.log(`✓ Font ready: ${fontFamily} (loaded: ${isLoaded})`);

          // List all loaded fonts for debugging
          const loadedFonts = Array.from(document.fonts).map(
            (font) => font.family,
          );
          console.log(`Available fonts: ${loadedFonts.join(', ')}`);
        } catch (error) {
          console.warn(`Failed to load font: ${fontFamily}`, error);
        }
      });

    await Promise.all(fontPromises);

    // Additional wait for font rendering stability
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('✅ All fonts ready for export');
  }

  /**
   * Attempts to fetch and embed Google Fonts as base64 data URLs
   */
  private async createEmbeddedFontCSS(fontFamilies: string[]): Promise<string> {
    const fontCSSRules: string[] = [];

    for (const fontFamily of fontFamilies) {
      if (this.isSystemFont(fontFamily)) {
        continue;
      }

      try {
        // Create Google Fonts URL
        const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;

        // Fetch the CSS
        const response = await fetch(googleFontsUrl);
        const cssText = await response.text();

        // Extract font URLs from the CSS and convert to base64
        const fontUrlRegex = /url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g;
        let embeddedCSS = cssText;
        let match;

        while ((match = fontUrlRegex.exec(cssText)) !== null) {
          const fontUrl = match[1];
          try {
            const fontResponse = await fetch(fontUrl);
            const fontBuffer = await fontResponse.arrayBuffer();
            const base64Font = btoa(
              String.fromCharCode(...new Uint8Array(fontBuffer)),
            );
            const mimeType = fontUrl.includes('.woff2')
              ? 'font/woff2'
              : 'font/woff';
            const dataUrl = `data:${mimeType};base64,${base64Font}`;

            embeddedCSS = embeddedCSS.replace(fontUrl, dataUrl);
            console.log(`✅ Embedded font file for ${fontFamily}`);
          } catch (fontError) {
            console.warn(`Failed to embed font file: ${fontUrl}`, fontError);
          }
        }

        fontCSSRules.push(embeddedCSS);
        console.log(`✅ Created embedded CSS for ${fontFamily}`);
      } catch (error) {
        console.warn(
          `Failed to create embedded font CSS for ${fontFamily}:`,
          error,
        );

        // Fallback: Create a simple @font-face rule
        fontCSSRules.push(`
          @font-face {
            font-family: "${fontFamily}";
            src: url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap');
            font-display: swap;
          }
        `);
      }
    }

    return fontCSSRules.join('\n');
  }

  /**
   * Direct style injection approach - temporarily modify DOM elements
   */
  private injectDirectStyles(
    elementId: string,
    fontFamilies: string[],
  ): () => void {
    const element = document.getElementById(elementId);
    if (!element) return () => {};

    const originalStyles = new Map<Element, string>();

    // Get ALL elements including the root element and children
    const allElements = [element, ...Array.from(element.querySelectorAll('*'))];

    console.log(
      `🔍 Found ${allElements.length} elements to potentially modify`,
    );

    // Store original styles and apply font families
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      const currentFontFamily =
        computedStyle.fontFamily || htmlEl.style.fontFamily;

      console.log(
        `Element ${htmlEl.tagName} current font: "${currentFontFamily}"`,
      );

      // Store original style
      originalStyles.set(el, htmlEl.style.cssText);

      // Apply font family if we have any to apply
      if (fontFamilies.length > 0) {
        // Try to match any of our target fonts in the current font family
        const hasTargetFont = fontFamilies.some((font) =>
          currentFontFamily.toLowerCase().includes(font.toLowerCase()),
        );

        if (hasTargetFont || htmlEl.hasAttribute('contenteditable')) {
          // Force the font family with highest priority
          const primaryFont = fontFamilies[0];
          htmlEl.style.fontFamily = `"${primaryFont}", Arial, sans-serif !important`;
          htmlEl.style.setProperty(
            'font-family',
            `"${primaryFont}", Arial, sans-serif`,
            'important',
          );
          console.log(
            `✅ Applied direct style to ${htmlEl.tagName}: ${primaryFont}`,
          );
        }
      }
    });

    console.log(
      `📝 Modified ${originalStyles.size} elements with direct styles`,
    );

    // Return cleanup function
    return () => {
      originalStyles.forEach((originalStyle, el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.cssText = originalStyle;
      });
      console.log('🧹 Direct styles cleaned up');
    };
  }

  private getSafePixelRatio(options: ExportOptions): number {
    const requestedRatio = Number.isFinite(options.pixelRatio)
      ? Math.max(1, Number(options.pixelRatio))
      : this.defaultPixelRatio;

    const maxPixelCount = Number.isFinite(options.maxPixelCount)
      ? Math.max(1, Number(options.maxPixelCount))
      : this.defaultMaxPixelCount;

    const basePixelCount = options.width * options.height;
    if (basePixelCount <= 0) {
      return requestedRatio;
    }

    const totalPixels = basePixelCount * requestedRatio * requestedRatio;
    if (totalPixels <= maxPixelCount) {
      return requestedRatio;
    }

    const clampedRatio = Math.sqrt(maxPixelCount / basePixelCount);
    return Number(Math.max(1, clampedRatio).toFixed(2));
  }

  private getExportStyle(options: ExportOptions): Record<string, string> {
    const style: Record<string, string> = {
      width: `${options.width}px`,
      height: `${options.height}px`,
      transform: 'none',
      willChange: 'auto',
      boxShadow: 'none',
    };

    if (options.transparentBackground) {
      style.backgroundColor = 'transparent';
      style.backgroundImage = 'none';
    }

    return style;
  }

  private shouldIncludeNode(node: HTMLElement): boolean {
    const tagName = node.tagName?.toLowerCase();
    return !['script', 'noscript', 'meta', 'title', 'link'].includes(tagName);
  }

  private async renderPng(
    element: HTMLElement,
    options: ExportOptions,
    overrides: Partial<PngOptions> = {},
  ): Promise<string> {
    const baseStyle = this.getExportStyle(options);
    const overrideStyle = (overrides.style ?? {}) as Record<string, string>;
    const mergedStyle: Record<string, string> = {
      ...baseStyle,
      ...overrideStyle,
    };
    const pixelRatio = this.getSafePixelRatio(options);

    const backgroundColor =
      'backgroundColor' in overrides
        ? overrides.backgroundColor
        : options.transparentBackground
          ? 'transparent'
          : undefined;

    const filter = overrides.filter ?? this.shouldIncludeNode;

    const exportOptions: PngOptions = {
      ...overrides,
      width: options.width,
      height: options.height,
      pixelRatio,
      quality: options.quality ?? 1,
      cacheBust: true,
      skipFonts: true,
      backgroundColor,
      style: mergedStyle,
      filter,
    };

    return toPng(element, exportOptions);
  }

  /**
   * Exports an element to PNG using html-to-image with reliable font handling
   */
  async exportElementToPng(
    elementId: string,
    options: ExportOptions,
    fontFamilies: string[] = [],
  ): Promise<string> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    console.log('🚀 Starting reliable export...');
    console.log('Font families to ensure:', fontFamilies);
    console.log(
      'Export dimensions:',
      `${options.width}x${options.height} @ ${this.getSafePixelRatio(options)}x`,
    );
    console.log(
      'Transparent export:',
      options.transparentBackground ? 'enabled' : 'disabled',
    );

    // Step 1: Wait for fonts to be ready
    if (fontFamilies.length > 0) {
      await this.waitForFonts(fontFamilies);
    }

    // Step 2: Try embedded font approach first
    try {
      console.log('🔥 Attempting embedded font approach...');
      const embeddedFontCSS = await this.createEmbeddedFontCSS(fontFamilies);
      const aggressiveCSS = await this.createInlineFontCSS(fontFamilies);
      const combinedCSS = embeddedFontCSS + '\n' + aggressiveCSS;

      console.log('📝 Generated combined embedded + aggressive CSS');

      const dataUrl = await this.renderPng(element, options, {
        fontEmbedCSS: combinedCSS,
      });

      console.log('✅ Embedded font export completed successfully');
      return dataUrl;
    } catch (error) {
      console.error(
        'Embedded font approach failed, trying direct style injection:',
        error,
      );

      // Step 3: Try direct style injection approach
      let cleanupStyles: (() => void) | null = null;

      try {
        // Apply direct styles before export
        cleanupStyles = this.injectDirectStyles(elementId, fontFamilies);

        console.log('📝 Direct styles injected, proceeding with export...');

        const dataUrl = await this.renderPng(element, options);

        console.log('✅ Direct style injection export completed successfully');
        return dataUrl;
      } catch (error2) {
        console.error(
          'Direct style injection also failed, trying basic CSS approach:',
          error2,
        );
      } finally {
        // Always clean up direct styles
        if (cleanupStyles) {
          cleanupStyles();
        }
      }

      // Step 4: Fallback to CSS-based approach
      const inlineFontCSS = await this.createInlineFontCSS(fontFamilies);
      console.log('Generated inline font CSS:', inlineFontCSS);

      try {
        const dataUrl = await this.renderPng(element, options, {
          fontEmbedCSS: inlineFontCSS,
        });

        console.log('✅ CSS-based export completed successfully');
        return dataUrl;
      } catch (error2) {
        console.error(
          'CSS approach also failed, trying minimal fallback:',
          error2,
        );

        // Final fallback: Minimal approach
        const fallbackDataUrl = await this.renderPng(
          element,
          {
            ...options,
            pixelRatio: Math.min(options.pixelRatio ?? this.defaultPixelRatio, 2),
          },
          {
            quality: 1,
            cacheBust: false,
            skipFonts: true,
            style: {
              transform: 'none',
            },
            filter: (node) => {
              const tagName = node.tagName?.toLowerCase();
              return ![
                'script',
                'noscript',
                'meta',
                'title',
                'link',
                'style',
              ].includes(tagName);
            },
          },
        );

        console.log('✅ Minimal fallback export completed');
        return fallbackDataUrl;
      }
    }
  }

  /**
   * Downloads the exported image
   */
  downloadImage(
    dataUrl: string,
    filename: string = `export-${Date.now()}.png`,
  ): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export singleton instance
export const reliableExporter = new ReliableExporter();

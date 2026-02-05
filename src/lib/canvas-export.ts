/**
 * Canvas-based export that manually renders text with loaded Google Fonts
 * This bypasses html-to-image completely to avoid CORS issues
 */

import { TextElement, CanvasSettings, BackgroundConfig } from '@/types';

class CanvasExporter {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private initializeCanvas(): void {
    if (typeof window === 'undefined') {
      throw new Error('Canvas export is only available in the browser');
    }

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      // Get context with alpha support for transparent backgrounds
      const ctx = this.canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        throw new Error('Could not get 2D canvas context');
      }
      this.ctx = ctx;
    }
  }

  /**
   * Exports text elements to PNG using canvas rendering
   */
  async exportToPng(
    textElements: TextElement[],
    canvasSettings: CanvasSettings,
  ): Promise<string> {
    // Initialize canvas if needed
    this.initializeCanvas();

    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas initialization failed');
    }

    // Set canvas dimensions
    this.canvas.width = canvasSettings.width;
    this.canvas.height = canvasSettings.height;

    // Ensure canvas is transparent by default
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1.0;
    
    // Clear canvas to transparent
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    console.log('Canvas initialized with dimensions:', this.canvas.width, 'x', this.canvas.height, 'and transparent background');

    // Apply background
    await this.renderBackground(canvasSettings.background);

    // Ensure fonts are loaded before rendering
    await this.ensureFontsLoaded(textElements);

    // Render each text element
    for (const element of textElements) {
      await this.renderTextElement(element);
    }

    // Convert to PNG data URL
    return this.canvas.toDataURL('image/png', 1.0);
  }

  /**
   * Renders the background based on settings
   */
  private async renderBackground(background: BackgroundConfig): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    console.log('Rendering background:', background);
    console.log(
      `Canvas dimensions: ${this.canvas.width}x${this.canvas.height}`,
    );

    switch (background.type) {
      case 'solid':
        console.log(`Rendering solid background: ${background.color}`);
        this.ctx.fillStyle = background.color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('Solid background rendered');
        break;

      case 'gradient':
        console.log('Rendering gradient as solid color');
        await this.renderSolidWithGlow(background);
        console.log('Solid background rendered');
        break;

      case 'pattern':
        console.log('Rendering pattern background');
        await this.renderPatternBackground(background);
        console.log('Pattern background rendered');
        break;

      case 'transparent':
        console.log('Rendering transparent background (no fill)');
        // Do absolutely NOTHING for transparent background
        // The canvas should already be transparent from initialization
        console.log('Transparent background: skipping any fills - canvas remains transparent');
        break;

      default:
        console.log(`Unknown background type: ${(background as { type: string }).type}`);
        break;
    }
  }

  /**
   * Renders solid background for gradient fallback
   */
  private async renderSolidWithGlow(
    gradient: BackgroundConfig & { type: 'gradient' },
  ): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    console.log(`Solid background details:`, {
      primaryColor: gradient.from,
    });

    this.ctx.fillStyle = gradient.from;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    console.log('Solid background applied to canvas');
  }

  /**
   * Renders pattern background (simplified for now)
   */
  private async renderPatternBackground(
    pattern: BackgroundConfig & { type: 'pattern' },
  ): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    // For now, render pattern as solid background color
    // TODO: Implement actual pattern rendering if needed
    this.ctx.fillStyle = pattern.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Ensures all fonts used in text elements are loaded
   */
  private async ensureFontsLoaded(textElements: TextElement[]): Promise<void> {
    const fontFamilies = [...new Set(textElements.map((el) => el.fontFamily))];

    for (const fontFamily of fontFamilies) {
      try {
        // Load font with document.fonts API
        await document.fonts.load(`16px "${fontFamily}"`);
        console.log('✓ Font loaded for canvas:', fontFamily);
      } catch (error) {
        console.warn('Failed to load font for canvas:', fontFamily, error);
      }
    }

    // Additional wait for font rendering stability
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  /**
   * Renders a single text element on the canvas
   */
  private async renderTextElement(element: TextElement): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    this.ctx.save();

    // Set font properties FIRST (needed for accurate text measurement in wrapText)
    const fontWeight = element.fontWeight ?? 400;
    const fontStyle =
      element.fontStyle === 'oblique'
        ? `oblique ${element.fontSlant ?? 0}deg`
        : element.fontStyle;
    const fontString = `${fontStyle} ${fontWeight} ${element.fontSize}px "${element.fontFamily}", Arial, sans-serif`;
    this.ctx.font = fontString;

    console.log(`Font set for text measurement: ${fontString}`);

    // Set text color
    this.ctx.fillStyle = element.color;

    // Set text rendering properties to match DOM
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left'; // Always use left, handle alignment manually

    // Handle word wrapping and multi-line text (font is now set correctly)
    const lines = this.wrapText(
      element.content,
      element.width,
      element.wordWrap,
    );
    console.log(`Text wrapped into ${lines.length} lines:`, lines);
    const lineHeight = element.fontSize * (element.lineHeight || 1.2); // Use element's line height or default to 1.2

    // Calculate starting position to match DOM rendering
    // DOM uses hardcoded 4px padding, so we match that instead of element.paddingX/Y
    const domPadding = 4;
    const startX = element.x + domPadding;
    const startY = element.y + domPadding;

    console.log(`Canvas positioning for "${element.content}":`, {
      elementX: element.x,
      elementY: element.y,
      domPadding,
      finalX: startX,
      finalY: startY,
      width: element.width,
      fontSize: element.fontSize,
      textAlign: element.textAlign,
    });

    // Render each line
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      let x = startX;

      // Apply text alignment within the element width (match DOM behavior)
      const availableWidth = element.width - domPadding * 2;
      if (element.textAlign === 'center') {
        const textWidth = this.ctx.measureText(line).width;
        x = startX + (availableWidth - textWidth) / 2;
      } else if (element.textAlign === 'right') {
        const textWidth = this.ctx.measureText(line).width;
        x = startX + (availableWidth - textWidth);
      }

      // Render the text
      this.ctx.fillText(line, x, y);

      // Add text decoration if specified
      if (element.textDecoration === 'underline') {
        this.renderUnderline(line, x, y + element.fontSize, element.fontSize);
      }
    });

    this.ctx.restore();
  }

  /**
   * Wraps text to fit within specified width (accounting for DOM padding)
   */
  private wrapText(
    text: string,
    maxWidth: number,
    wordWrap: boolean,
  ): string[] {
    if (!this.ctx || !wordWrap) {
      console.log(`No wrapping: wordWrap=${wordWrap}, returning split lines`);
      return text.split('\n');
    }

    // Account for DOM padding (4px on each side)
    const availableWidth = maxWidth - 4 * 2;
    console.log(
      `Word wrapping: maxWidth=${maxWidth}, availableWidth=${availableWidth}`,
    );

    const lines: string[] = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === '') {
        lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = this.ctx!.measureText(testLine);

        console.log(
          `Testing line "${testLine}": width=${metrics.width}, availableWidth=${availableWidth}`,
        );

        if (metrics.width > availableWidth && currentLine !== '') {
          console.log(
            `Line too wide, wrapping. Current line: "${currentLine}"`,
          );
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        console.log(`Final line: "${currentLine}"`);
        lines.push(currentLine);
      }
    });

    console.log(`Wrapping complete. Total lines: ${lines.length}`);
    return lines;
  }

  /**
   * Renders underline decoration
   */
  private renderUnderline(
    text: string,
    x: number,
    y: number,
    fontSize: number,
  ): void {
    if (!this.ctx) return;

    const textWidth = this.ctx.measureText(text).width;
    const underlineY = y + 2; // Slight offset below text
    const underlineHeight = Math.max(1, fontSize / 12); // Scale underline thickness

    this.ctx.save();
    this.ctx.fillRect(x, underlineY, textWidth, underlineHeight);
    this.ctx.restore();
  }

  /**
   * Gets canvas dimensions for testing
   */
  getCanvasDimensions(): { width: number; height: number } {
    if (!this.canvas) {
      return { width: 0, height: 0 };
    }
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * Cleans up canvas resources
   */
  cleanup(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Ensures canvas has transparent background for PNG export
   */
  private ensureTransparentCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    
    // Reset global composite operation to ensure proper transparency
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Make sure the canvas itself doesn't have a background
    this.canvas.style.backgroundColor = 'transparent';
    
    // Ensure alpha blending is enabled
    this.ctx.globalAlpha = 1.0;
    
    console.log('Canvas configured for true transparency - no background will be drawn');
  }
}

// Helper function to convert hex color to rgba
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Export singleton instance
export const canvasExporter = new CanvasExporter();

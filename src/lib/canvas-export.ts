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
      const ctx = this.canvas.getContext('2d');
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
    canvasSettings: CanvasSettings
  ): Promise<string> {
    // Initialize canvas if needed
    this.initializeCanvas();
    
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas initialization failed');
    }

    // Set canvas dimensions
    this.canvas.width = canvasSettings.width;
    this.canvas.height = canvasSettings.height;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

    switch (background.type) {
      case 'solid':
        this.ctx.fillStyle = background.color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;
      
      case 'gradient':
        await this.renderGradientBackground(background);
        break;
      
      case 'pattern':
        await this.renderPatternBackground(background);
        break;
      
      case 'transparent':
      default:
        // Canvas is already transparent by default
        break;
    }
  }

  /**
   * Renders gradient background
   */
  private async renderGradientBackground(gradient: BackgroundConfig & { type: 'gradient' }): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    let canvasGradient: CanvasGradient;

    // Map gradient directions to canvas coordinates
    const directionMap: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
      'to-r': { x1: 0, y1: 0, x2: this.canvas.width, y2: 0 },
      'to-l': { x1: this.canvas.width, y1: 0, x2: 0, y2: 0 },
      'to-b': { x1: 0, y1: 0, x2: 0, y2: this.canvas.height },
      'to-t': { x1: 0, y1: this.canvas.height, x2: 0, y2: 0 },
      'to-br': { x1: 0, y1: 0, x2: this.canvas.width, y2: this.canvas.height },
      'to-bl': { x1: this.canvas.width, y1: 0, x2: 0, y2: this.canvas.height },
      'to-tr': { x1: 0, y1: this.canvas.height, x2: this.canvas.width, y2: 0 },
      'to-tl': { x1: this.canvas.width, y1: this.canvas.height, x2: 0, y2: 0 },
    };

    const coords = directionMap[gradient.direction] || directionMap['to-r'];
    canvasGradient = this.ctx.createLinearGradient(coords.x1, coords.y1, coords.x2, coords.y2);

    // Add color stops
    canvasGradient.addColorStop(0, gradient.from);
    if (gradient.via) {
      canvasGradient.addColorStop(0.5, gradient.via);
    }
    canvasGradient.addColorStop(1, gradient.to);

    this.ctx.fillStyle = canvasGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Renders pattern background (simplified for now)
   */
  private async renderPatternBackground(pattern: BackgroundConfig & { type: 'pattern' }): Promise<void> {
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
    const fontFamilies = [...new Set(textElements.map(el => el.fontFamily))];
    
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
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Renders a single text element on the canvas
   */
  private async renderTextElement(element: TextElement): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.save();

    // Set font properties (matching the actual structure)
    const fontWeight = element.fontWeight === 'bold' ? 'bold' : 'normal';
    const fontStyle = element.fontStyle === 'italic' ? 'italic' : 'normal';
    this.ctx.font = `${fontStyle} ${fontWeight} ${element.fontSize}px "${element.fontFamily}", Arial, sans-serif`;
    
    // Set text color
    this.ctx.fillStyle = element.color;

    // Set text rendering properties for better quality
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = element.textAlign || 'left';

    // Handle word wrapping and multi-line text
    const lines = this.wrapText(element.content, element.width, element.wordWrap);
    const lineHeight = element.fontSize * 1.2; // Standard line height

    // Calculate starting position with padding
    let startX = element.x + element.paddingX;
    let startY = element.y + element.paddingY;

    // Render each line
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      let x = startX;

      // Apply text alignment within the element width
      if (element.textAlign === 'center') {
        x = startX + (element.width - element.paddingX * 2) / 2;
      } else if (element.textAlign === 'right') {
        x = startX + (element.width - element.paddingX * 2);
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
   * Wraps text to fit within specified width
   */
  private wrapText(text: string, maxWidth: number, wordWrap: boolean): string[] {
    if (!this.ctx || !wordWrap) {
      return text.split('\n');
    }

    const lines: string[] = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach(paragraph => {
      if (paragraph.trim() === '') {
        lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = this.ctx!.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }
    });

    return lines;
  }

  /**
   * Renders underline decoration
   */
  private renderUnderline(text: string, x: number, y: number, fontSize: number): void {
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
      height: this.canvas.height
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
// Variable font utilities for detecting and working with variable font axes

export interface FontAxis {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
}

export interface VariableFontInfo {
  isVariable: boolean;
  axes: FontAxis[];
}

// Common variable font axes with their human-readable names
const AXIS_NAMES: Record<string, string> = {
  wght: 'Weight',
  wdth: 'Width',
  slnt: 'Slant',
  ital: 'Italic',
  opsz: 'Optical Size',
  grad: 'Grade',
  xhgt: 'X-Height',
  yopq: 'Y Opaque',
  ytlc: 'Y Transparent LC',
  ytuc: 'Y Transparent UC',
  ytas: 'Y Transparent Ascender',
  ytde: 'Y Transparent Descender',
  ytfi: 'Y Transparent Figure',
};

// Default ranges for common axes
const AXIS_RANGES: Record<string, { min: number; max: number; default: number }> = {
  wght: { min: 100, max: 900, default: 400 },
  wdth: { min: 50, max: 200, default: 100 },
  slnt: { min: -15, max: 0, default: 0 },
  ital: { min: 0, max: 1, default: 0 },
  opsz: { min: 6, max: 72, default: 14 },
  grad: { min: -200, max: 150, default: 0 },
};

/**
 * Detects if a font is a variable font by checking its CSS font-variation-settings support
 * This is a heuristic approach since we can't directly access OpenType tables in the browser
 */
export function isVariableFont(fontFamily: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !document) {
      resolve(false);
      return;
    }

    // Create a test element
    const testElement = document.createElement('div');
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.fontFamily = fontFamily;
    testElement.style.fontSize = '16px';
    testElement.textContent = 'Test';
    
    document.body.appendChild(testElement);

    try {
      // Test if font-variation-settings is supported and affects the font
      const originalWidth = testElement.offsetWidth;
      
      // Try to apply a common variable font axis
      testElement.style.fontVariationSettings = '"wght" 100';
      const lightWidth = testElement.offsetWidth;
      
      testElement.style.fontVariationSettings = '"wght" 900';
      const boldWidth = testElement.offsetWidth;
      
      // Reset
      testElement.style.fontVariationSettings = '';
      
      // If widths are different, it's likely a variable font
      const isVariable = lightWidth !== boldWidth || lightWidth !== originalWidth;
      
      document.body.removeChild(testElement);
      resolve(isVariable);
    } catch (error) {
      document.body.removeChild(testElement);
      resolve(false);
    }
  });
}

/**
 * Attempts to detect available axes for a variable font
 * This is a best-effort approach using common axis combinations
 */
export async function detectVariableFontAxes(fontFamily: string): Promise<FontAxis[]> {
  if (typeof window === 'undefined' || !document) {
    return [];
  }

  const axes: FontAxis[] = [];
  const testElement = document.createElement('div');
  testElement.style.position = 'absolute';
  testElement.style.visibility = 'hidden';
  testElement.style.fontFamily = fontFamily;
  testElement.style.fontSize = '16px';
  testElement.textContent = 'Test Variable Font';
  
  document.body.appendChild(testElement);

  try {
    // Test common axes
    for (const [axisTag, range] of Object.entries(AXIS_RANGES)) {
      const originalWidth = testElement.offsetWidth;
      const originalHeight = testElement.offsetHeight;
      
      // Test minimum value
      testElement.style.fontVariationSettings = `"${axisTag}" ${range.min}`;
      const minWidth = testElement.offsetWidth;
      const minHeight = testElement.offsetHeight;
      
      // Test maximum value
      testElement.style.fontVariationSettings = `"${axisTag}" ${range.max}`;
      const maxWidth = testElement.offsetWidth;
      const maxHeight = testElement.offsetHeight;
      
      // Reset
      testElement.style.fontVariationSettings = '';
      
      // If dimensions changed, this axis is supported
      if (
        minWidth !== originalWidth || 
        maxWidth !== originalWidth || 
        minHeight !== originalHeight || 
        maxHeight !== originalHeight ||
        minWidth !== maxWidth ||
        minHeight !== maxHeight
      ) {
        axes.push({
          tag: axisTag,
          name: AXIS_NAMES[axisTag] || axisTag.toUpperCase(),
          min: range.min,
          max: range.max,
          default: range.default,
        });
      }
    }
  } catch (error) {
    console.warn('Error detecting variable font axes:', error);
  } finally {
    document.body.removeChild(testElement);
  }

  return axes;
}

/**
 * Get variable font information including detection and available axes
 */
export async function getVariableFontInfo(fontFamily: string): Promise<VariableFontInfo> {
  const isVariable = await isVariableFont(fontFamily);
  const axes = isVariable ? await detectVariableFontAxes(fontFamily) : [];
  
  return {
    isVariable,
    axes,
  };
}

/**
 * Converts font variation settings object to CSS string
 */
export function fontVariationSettingsToCSS(settings: Record<string, number>): string {
  return Object.entries(settings)
    .map(([axis, value]) => `"${axis}" ${value}`)
    .join(', ');
}

/**
 * Parses CSS font-variation-settings string to object
 */
export function parseFontVariationSettings(cssString: string): Record<string, number> {
  const settings: Record<string, number> = {};
  
  if (!cssString || cssString === 'normal') {
    return settings;
  }
  
  // Match patterns like "wght" 400, "wdth" 100
  const matches = cssString.match(/"([^"]+)"\s+([\d.-]+)/g);
  
  if (matches) {
    matches.forEach(match => {
      const parts = match.match(/"([^"]+)"\s+([\d.-]+)/);
      if (parts) {
        settings[parts[1]] = parseFloat(parts[2]);
      }
    });
  }
  
  return settings;
}
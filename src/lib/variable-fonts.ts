// Variable font utilities for detecting and working with variable font axes
import { googleFontsManager, GoogleFont } from './google-fonts';

export interface FontAxis {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
  description?: string;
}

export interface VariableFontInfo {
  isVariable: boolean;
  axes: FontAxis[];
  cached?: boolean;
}

// Common variable font axes with their human-readable names and descriptions
const AXIS_INFO: Record<string, { name: string; description: string }> = {
  wght: { name: 'Weight', description: 'Controls the thickness of strokes' },
  wdth: { name: 'Width', description: 'Controls the horizontal expansion or compression' },
  slnt: { name: 'Slant', description: 'Controls the slant angle of the font' },
  ital: { name: 'Italic', description: 'Controls italic vs roman letterforms' },
  opsz: { name: 'Optical Size', description: 'Optimizes font for different sizes' },
  grad: { name: 'Grade', description: 'Controls the weight without changing width' },
  xhgt: { name: 'X-Height', description: 'Controls the height of lowercase letters' },
  yopq: { name: 'Y Opaque', description: 'Controls horizontal stroke thickness' },
  ytlc: { name: 'Y Transparent LC', description: 'Controls lowercase ascender thickness' },
  ytuc: { name: 'Y Transparent UC', description: 'Controls uppercase thickness' },
  ytas: { name: 'Y Transparent Ascenders', description: 'Controls ascender thickness' },
  ytde: { name: 'Y Transparent Descenders', description: 'Controls descender thickness' },
  ytfi: { name: 'Y Transparent Figures', description: 'Controls figure thickness' },
  // Additional common axes
  CASL: { name: 'Casual', description: 'Controls casual vs linear letterforms' },
  CRSV: { name: 'Cursive', description: 'Controls cursive letterforms' },
  EXPR: { name: 'Expression', description: 'Controls the level of stylistic expression' },
  FILL: { name: 'Fill', description: 'Controls the fill of outlined fonts' },
  FLAR: { name: 'Flare', description: 'Controls the flare of serif terminals' },
  SOFT: { name: 'Softness', description: 'Controls the softness of corners' },
  WONK: { name: 'Wonky', description: 'Controls the wonkiness or quirkiness' },
};

// Default ranges for common axes
const AXIS_RANGES: Record<string, { min: number; max: number; default: number }> = {
  wght: { min: 100, max: 900, default: 400 },
  wdth: { min: 50, max: 200, default: 100 },
  slnt: { min: -15, max: 0, default: 0 },
  ital: { min: 0, max: 1, default: 0 },
  opsz: { min: 6, max: 72, default: 14 },
  grad: { min: -200, max: 150, default: 0 },
  xhgt: { min: 400, max: 1000, default: 500 },
  yopq: { min: 25, max: 135, default: 79 },
  ytlc: { min: 416, max: 570, default: 514 },
  ytuc: { min: 528, max: 760, default: 712 },
  ytas: { min: 649, max: 854, default: 750 },
  ytde: { min: -305, max: -98, default: -203 },
  ytfi: { min: 600, max: 900, default: 738 },
  CASL: { min: 0, max: 1, default: 0 },
  CRSV: { min: 0, max: 1, default: 0 },
  EXPR: { min: 0, max: 100, default: 0 },
  FILL: { min: 0, max: 1, default: 1 },
  FLAR: { min: 0, max: 100, default: 0 },
  SOFT: { min: 0, max: 100, default: 0 },
  WONK: { min: 0, max: 1, default: 0 },
};

// Cache for variable font info to avoid repeated detection
const variableFontCache = new Map<string, VariableFontInfo>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Checks if a font is likely variable based on Google Fonts API data
 */
function checkGoogleFontsVariableStatus(fontFamily: string): boolean {
  // Common variable fonts on Google Fonts (this could be expanded or fetched from API)
  const knownVariableFonts = [
    'Inter', 'Roboto Flex', 'Crimson Pro', 'Literata', 'Source Serif Pro',
    'Comfortaa', 'Recursive', 'Markazi Text', 'Playfair Display',
    'Fraunces', 'Commissioner', 'Manrope', 'IBM Plex Sans', 'Outfit',
    'Public Sans', 'Space Grotesk', 'DM Sans', 'Epilogue', 'Plus Jakarta Sans',
    'Hanken Grotesk', 'Red Hat Display', 'Figtree', 'Albert Sans'
  ];
  
  return knownVariableFonts.some(vf => 
    fontFamily.toLowerCase().includes(vf.toLowerCase())
  );
}

/**
 * Enhanced detection with multiple methods and better heuristics
 */
export function isVariableFont(fontFamily: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !document) {
      resolve(false);
      return;
    }

    // First check if it's a known variable font
    if (checkGoogleFontsVariableStatus(fontFamily)) {
      resolve(true);
      return;
    }

    // Create multiple test elements with different text to improve detection
    const testTexts = ['Test Variable Font Wgjp', 'ABCDEFGHIJK abcdefghijk 123'];
    const testElement = document.createElement('div');
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.fontFamily = fontFamily;
    testElement.style.fontSize = '24px'; // Larger size for better detection
    testElement.style.whiteSpace = 'nowrap';
    
    document.body.appendChild(testElement);

    try {
      let isVariable = false;
      
      for (const testText of testTexts) {
        testElement.textContent = testText;
        
        // Get baseline measurements
        const originalWidth = testElement.offsetWidth;
        const originalHeight = testElement.offsetHeight;
        
        // Test multiple common axes with more extreme values
        const axesToTest = [
          { axis: 'wght', min: 100, max: 900 },
          { axis: 'wdth', min: 75, max: 125 },
          { axis: 'opsz', min: 8, max: 72 }
        ];
        
        for (const { axis, min, max } of axesToTest) {
          // Test minimum value
          testElement.style.fontVariationSettings = `"${axis}" ${min}`;
          const minWidth = testElement.offsetWidth;
          const minHeight = testElement.offsetHeight;
          
          // Test maximum value
          testElement.style.fontVariationSettings = `"${axis}" ${max}`;
          const maxWidth = testElement.offsetWidth;
          const maxHeight = testElement.offsetHeight;
          
          // Reset
          testElement.style.fontVariationSettings = '';
          
          // Check for significant changes (accounting for browser rounding)
          const widthDiff = Math.abs(minWidth - maxWidth);
          const heightDiff = Math.abs(minHeight - maxHeight);
          const baselineDiff = Math.abs(originalWidth - minWidth) + Math.abs(originalWidth - maxWidth);
          
          if (widthDiff > 1 || heightDiff > 1 || baselineDiff > 1) {
            isVariable = true;
            break;
          }
        }
        
        if (isVariable) break;
      }
      
      document.body.removeChild(testElement);
      resolve(isVariable);
    } catch (error) {
      document.body.removeChild(testElement);
      resolve(false);
    }
  });
}

/**
 * Gets axis information from Google Fonts API data if available
 */
function getAxisInfoFromGoogleFonts(fontFamily: string): FontAxis[] | null {
  // This would ideally fetch from Google Fonts API v2 metadata
  // For now, return known axes for common variable fonts
  const fontAxesMap: Record<string, FontAxis[]> = {
    'Inter': [
      { tag: 'wght', name: 'Weight', min: 100, max: 900, default: 400, description: 'Controls the thickness of strokes' },
      { tag: 'slnt', name: 'Slant', min: -10, max: 0, default: 0, description: 'Controls the slant angle' }
    ],
    'Roboto Flex': [
      { tag: 'wght', name: 'Weight', min: 100, max: 1000, default: 400, description: 'Controls the thickness of strokes' },
      { tag: 'wdth', name: 'Width', min: 25, max: 151, default: 100, description: 'Controls horizontal expansion' },
      { tag: 'opsz', name: 'Optical Size', min: 8, max: 144, default: 14, description: 'Optimizes for different sizes' },
      { tag: 'GRAD', name: 'Grade', min: -200, max: 150, default: 0, description: 'Controls weight without changing width' },
      { tag: 'slnt', name: 'Slant', min: -10, max: 0, default: 0, description: 'Controls the slant angle' },
      { tag: 'XTRA', name: 'X Transparent', min: 323, max: 603, default: 468, description: 'Controls character width' }
    ],
    'Recursive': [
      { tag: 'wght', name: 'Weight', min: 300, max: 1000, default: 400, description: 'Controls the thickness of strokes' },
      { tag: 'slnt', name: 'Slant', min: -15, max: 0, default: 0, description: 'Controls the slant angle' },
      { tag: 'MONO', name: 'Monospace', min: 0, max: 1, default: 0, description: 'Switches between proportional and monospace' },
      { tag: 'CASL', name: 'Casual', min: 0, max: 1, default: 0, description: 'Controls casual vs linear letterforms' },
      { tag: 'CRSV', name: 'Cursive', min: 0, max: 1, default: 0.5, description: 'Controls cursive letterforms' }
    ],
    // Add more known fonts here...
  };
  
  for (const [knownFont, axes] of Object.entries(fontAxesMap)) {
    if (fontFamily.toLowerCase().includes(knownFont.toLowerCase())) {
      return axes;
    }
  }
  
  return null;
}

/**
 * Enhanced axis detection with better heuristics and multiple test strategies
 */
export async function detectVariableFontAxes(fontFamily: string): Promise<FontAxis[]> {
  if (typeof window === 'undefined' || !document) {
    return [];
  }

  // First try to get from known Google Fonts data
  const googleFontsAxes = getAxisInfoFromGoogleFonts(fontFamily);
  if (googleFontsAxes) {
    return googleFontsAxes;
  }

  const axes: FontAxis[] = [];
  const testElement = document.createElement('div');
  testElement.style.position = 'absolute';
  testElement.style.visibility = 'hidden';
  testElement.style.fontFamily = fontFamily;
  testElement.style.fontSize = '24px'; // Larger for better detection
  testElement.style.whiteSpace = 'nowrap';
  
  // Use multiple test strings for better detection
  const testStrings = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'The quick brown fox jumps over the lazy dog',
    'Hamburgefonstiv HAMBURGEFONSTIV 1234567890'
  ];
  
  document.body.appendChild(testElement);

  try {
    // Test each possible axis
    for (const [axisTag, range] of Object.entries(AXIS_RANGES)) {
      let axisSupported = false;
      
      // Test with multiple strings to improve detection accuracy
      for (const testString of testStrings) {
        testElement.textContent = testString;
        
        const originalWidth = testElement.offsetWidth;
        const originalHeight = testElement.offsetHeight;
        
        // Test with a wider range of values for better detection
        const testValues = [range.min, range.default, range.max];
        const measurements: Array<{ width: number; height: number }> = [];
        
        for (const value of testValues) {
          testElement.style.fontVariationSettings = `"${axisTag}" ${value}`;
          measurements.push({
            width: testElement.offsetWidth,
            height: testElement.offsetHeight
          });
        }
        
        // Reset
        testElement.style.fontVariationSettings = '';
        
        // Check for meaningful differences (accounting for browser rounding)
        const widthVariation = Math.max(...measurements.map(m => m.width)) - Math.min(...measurements.map(m => m.width));
        const heightVariation = Math.max(...measurements.map(m => m.height)) - Math.min(...measurements.map(m => m.height));
        
        if (widthVariation > 2 || heightVariation > 2) {
          axisSupported = true;
          break;
        }
      }
      
      if (axisSupported) {
        const axisInfo = AXIS_INFO[axisTag];
        axes.push({
          tag: axisTag,
          name: axisInfo?.name || axisTag.toUpperCase(),
          min: range.min,
          max: range.max,
          default: range.default,
          description: axisInfo?.description,
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
 * Get variable font information with caching for better performance
 */
export async function getVariableFontInfo(fontFamily: string): Promise<VariableFontInfo> {
  // Check cache first
  const cached = variableFontCache.get(fontFamily);
  if (cached && Date.now() - (cached as any).timestamp < CACHE_DURATION) {
    return { ...cached, cached: true };
  }
  
  const isVariable = await isVariableFont(fontFamily);
  const axes = isVariable ? await detectVariableFontAxes(fontFamily) : [];
  
  const info: VariableFontInfo = {
    isVariable,
    axes,
    cached: false,
  };
  
  // Cache the result with timestamp
  (info as any).timestamp = Date.now();
  variableFontCache.set(fontFamily, info);
  
  return info;
}

/**
 * Clear the variable font cache
 */
export function clearVariableFontCache(): void {
  variableFontCache.clear();
}

/**
 * Check if a font family is in the variable font cache
 */
export function isVariableFontCached(fontFamily: string): boolean {
  const cached = variableFontCache.get(fontFamily);
  return cached && Date.now() - (cached as any).timestamp < CACHE_DURATION;
}

/**
 * Get cached variable font info without triggering detection
 */
export function getCachedVariableFontInfo(fontFamily: string): VariableFontInfo | null {
  const cached = variableFontCache.get(fontFamily);
  if (cached && Date.now() - (cached as any).timestamp < CACHE_DURATION) {
    return { ...cached, cached: true };
  }
  return null;
}

export function normalizeAxesFromMetadata(
  axes?: GoogleFont['axes'],
): FontAxis[] {
  if (!axes || axes.length === 0) return [];

  return axes
    .map((axis) => {
      const axisInfo = AXIS_INFO[axis.tag];
      const fallbackRange = AXIS_RANGES[axis.tag];
      const min = Number.isFinite(axis.min) ? axis.min : fallbackRange?.min ?? 0;
      const max = Number.isFinite(axis.max) ? axis.max : fallbackRange?.max ?? min;
      const defaultValue = Number.isFinite(axis.defaultValue)
        ? axis.defaultValue
        : fallbackRange?.default ?? min;

      return {
        tag: axis.tag,
        name: axisInfo?.name || axis.tag.toUpperCase(),
        min,
        max,
        default: defaultValue,
        description: axisInfo?.description,
      };
    })
    .filter((axis) => Number.isFinite(axis.min) && Number.isFinite(axis.max));
}

export async function getVariableFontInfoFromMetadata(
  fontFamily: string,
  axes?: GoogleFont['axes'],
): Promise<VariableFontInfo> {
  const normalizedAxes = normalizeAxesFromMetadata(axes);
  if (normalizedAxes.length > 0) {
    const info: VariableFontInfo = {
      isVariable: true,
      axes: normalizedAxes,
      cached: false,
    };
    (info as any).timestamp = Date.now();
    variableFontCache.set(fontFamily, info);
    return info;
  }

  return getVariableFontInfo(fontFamily);
}

/**
 * Pre-populate cache with known variable fonts for better UX
 */
export function preloadKnownVariableFonts(): void {
  const knownVariableFonts = [
    'Inter', 'Roboto Flex', 'Recursive', 'Crimson Pro', 'Literata',
    'Source Serif Pro', 'Comfortaa', 'Manrope', 'Commissioner',
    'Fraunces', 'Public Sans', 'Space Grotesk', 'DM Sans'
  ];
  
  knownVariableFonts.forEach(fontFamily => {
    const axes = getAxisInfoFromGoogleFonts(fontFamily);
    if (axes) {
      const info: VariableFontInfo = {
        isVariable: true,
        axes,
        cached: false,
      };
      (info as any).timestamp = Date.now();
      variableFontCache.set(fontFamily, info);
    }
  });
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

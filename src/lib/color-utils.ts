import { formatRgb, lab, oklch, parse, rgb } from "culori";

/**
 * Convert an oklch color string to rgba format
 * @param oklchString - Color string in oklch format (e.g., "oklch(0.7 0.15 180)")
 * @returns RGBA color string (e.g., "rgba(0, 153, 204, 1)")
 */
export function convertOklchToRgba(oklchString: string): string {
  try {
    // Parse the oklch string
    const oklchColor = oklch(oklchString);

    if (!oklchColor) {
      console.warn(`Failed to parse oklch color: ${oklchString}`);
      return oklchString; // Return original if parsing fails
    }

    // Convert to RGB
    const rgbColor = rgb(oklchColor);

    if (!rgbColor) {
      console.warn(`Failed to convert oklch to rgb: ${oklchString}`);
      return oklchString;
    }

    // Format as rgba string
    return formatRgb(rgbColor);
  } catch (error) {
    console.warn(`Error converting oklch color ${oklchString}:`, error);
    return oklchString; // Return original if conversion fails
  }
}

/**
 * Convert a lab color string to rgba format
 * @param labString - Color string in lab format (e.g., "lab(29.2345% 39.3825 20.0664)")
 * @returns RGBA color string (e.g., "rgba(95, 39, 205, 1)")
 */
export function convertLabToRgba(labString: string): string {
  try {
    // Parse the lab string
    const labColor = lab(labString);

    if (!labColor) {
      console.warn(`Failed to parse lab color: ${labString}`);
      return labString; // Return original if parsing fails
    }

    // Convert to RGB
    const rgbColor = rgb(labColor);

    if (!rgbColor) {
      console.warn(`Failed to convert lab to rgb: ${labString}`);
      return labString;
    }

    // Format as rgba string
    return formatRgb(rgbColor);
  } catch (error) {
    console.warn(`Error converting lab color ${labString}:`, error);
    return labString; // Return original if conversion fails
  }
}

/**
 * Convert any modern color format to rgba using culori's universal parser
 * @param colorString - Color string in any supported format
 * @returns RGBA color string or original if conversion fails
 */
export function convertColorToRgba(colorString: string): string {
  try {
    // Use culori's universal parser
    const parsedColor = parse(colorString);

    if (!parsedColor) {
      console.warn(`Failed to parse color: ${colorString}`);
      return colorString;
    }

    // Convert to RGB
    const rgbColor = rgb(parsedColor);

    if (!rgbColor) {
      console.warn(`Failed to convert color to rgb: ${colorString}`);
      return colorString;
    }

    // Format as rgba string
    return formatRgb(rgbColor);
  } catch (error) {
    console.warn(`Error converting color ${colorString}:`, error);
    return colorString;
  }
}

/**
 * Fallback color map for problematic colors
 */
const fallbackColors: Record<string, string> = {
  "lab(29.2345% 39.3825 20.0664)": "rgba(95, 39, 205, 1)",
  "lab(50% 0 0)": "rgba(119, 119, 119, 1)",
  "oklch(0.5 0.2 180)": "rgba(0, 128, 128, 1)",
  "oklch(0.7 0.15 180)": "rgba(86, 180, 205, 1)",
  // Add more common conversions as needed
};

/**
 * Convert color with fallback support
 * @param colorString - Color string to convert
 * @returns RGBA color string or fallback
 */
export function convertColorWithFallback(colorString: string): string {
  // Check fallback map first
  if (fallbackColors[colorString]) {
    return fallbackColors[colorString];
  }

  // Try universal conversion
  const converted = convertColorToRgba(colorString);
  if (converted !== colorString) {
    return converted;
  }

  // Ultimate fallback
  console.warn(`Using ultimate fallback for color: ${colorString}`);
  return "rgba(0, 0, 0, 1)";
}

/**
 * Convert all modern color values (oklch, lab, etc.) in a CSS string to rgba
 * @param cssText - CSS text containing modern colors
 * @returns CSS text with modern colors converted to rgba
 */
export function convertOklchInCss(cssText: string): string {
  // Regex to match oklch(), lab(), lch(), and other modern color functions
  const modernColorRegex = /(oklch|lab|lch|color)\(([^)]+)\)/gi;

  return cssText.replace(modernColorRegex, (match) => {
    return convertColorWithFallback(match);
  });
}

/**
 * Process a DOM element and convert all modern colors in its styles to rgba
 * @param element - DOM element to process
 */
export function convertOklchInElement(element: Element): void {
  if (!element) return;

  // Process inline styles
  if (element instanceof HTMLElement && element.style) {
    const properties = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "boxShadow",
      "textShadow",
      "fill", // for SVG
      "stroke", // for SVG
    ] as const;

    properties.forEach((prop) => {
      const value = element.style[prop];
      if (
        value &&
        (value.includes("oklch") ||
          value.includes("lab") ||
          value.includes("lch"))
      ) {
        try {
          const converted = convertColorWithFallback(value);
          element.style[prop] = converted;
        } catch (error) {
          console.warn(`Failed to convert ${prop}: ${value}`, error);
        }
      }
    });

    // Also process cssText directly for any missed properties
    if (element.style.cssText) {
      const originalCssText = element.style.cssText;
      const convertedCssText = convertOklchInCss(originalCssText);

      if (convertedCssText !== originalCssText) {
        element.style.cssText = convertedCssText;
      }
    }
  }

  // Process computed styles as fallback
  try {
    const computed = window.getComputedStyle(element);
    ["color", "backgroundColor", "borderColor"].forEach((prop) => {
      const value = computed.getPropertyValue(prop);
      if (
        value &&
        (value.includes("oklch") ||
          value.includes("lab") ||
          value.includes("lch"))
      ) {
        const converted = convertColorWithFallback(value);
        (element as HTMLElement).style.setProperty(
          prop,
          converted,
          "important",
        );
      }
    });
  } catch (error) {
    // Ignore computed style errors (might not be available in cloned document)
  }

  // Process all child elements recursively
  Array.from(element.children).forEach((child) => {
    convertOklchInElement(child);
  });
}

/**
 * Batch convert multiple color values
 * @param colors - Array of color strings
 * @returns Array of converted RGBA color strings
 */
export function batchConvertColors(colors: string[]): string[] {
  return colors.map((color) => convertColorWithFallback(color));
}

/**
 * Check if a color string uses modern color syntax
 * @param colorString - Color string to check
 * @returns True if the color uses modern syntax (oklch, lab, etc.)
 */
export function isModernColor(colorString: string): boolean {
  return /\b(oklch|lab|lch|color)\s*\(/i.test(colorString);
}

/**
 * Extract all color values from CSS text
 * @param cssText - CSS text to parse
 * @returns Array of color values found
 */
export function extractColors(cssText: string): string[] {
  const colorRegex = /(oklch|lab|lch|color)\(([^)]+)\)/gi;
  const matches = cssText.match(colorRegex);
  return matches || [];
}

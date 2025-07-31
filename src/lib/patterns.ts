export interface PatternDefinition {
  id: string;
  name: string;
  description: string;
  category: 'geometric' | 'organic' | 'texture';
  cssProperties: {
    backgroundColor: string;
    backgroundImage: string;
    backgroundSize: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
    opacity?: number;
  };
  customizableParams: {
    primaryColor: boolean;
    backgroundColor: boolean;
    opacity: boolean;
    size: boolean;
    spacing: boolean;
  };
  generateCSS: (params: {
    primaryColor: string;
    backgroundColor: string;
    opacity: number;
    size: number;
    spacing: number;
  }) => React.CSSProperties;
}

export const PATTERN_DEFINITIONS: PatternDefinition[] = [
  {
    id: 'diagonal-grid',
    name: 'Diagonal Grid',
    description: 'Complex diagonal grid pattern with intersecting lines',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#e5e5f7',
      backgroundImage:
        'linear-gradient(135deg, #444cf7 25%, transparent 25%), linear-gradient(225deg, #444cf7 25%, transparent 25%), linear-gradient(45deg, #444cf7 25%, transparent 25%), linear-gradient(315deg, #444cf7 25%, #e5e5f7 25%)',
      backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
      backgroundSize: '10px 10px',
      backgroundRepeat: 'repeat',
      opacity: 0.8,
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: true,
    },
    generateCSS: ({
      primaryColor,
      backgroundColor,
      opacity,
      size,
      spacing,
    }) => {
      const adjustedSize = `${size}px ${size}px`;
      const adjustedSpacing = `${spacing}px 0, ${spacing}px 0, 0 0, 0 0`;

      // Convert opacity to alpha channel in colors instead of using opacity property
      const primaryColorWithOpacity = `${primaryColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;
      const backgroundColorWithOpacity = `${backgroundColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;

      return {
        backgroundColor: backgroundColorWithOpacity,
        backgroundImage: `linear-gradient(135deg, ${primaryColorWithOpacity} 25%, transparent 25%), linear-gradient(225deg, ${primaryColorWithOpacity} 25%, transparent 25%), linear-gradient(45deg, ${primaryColorWithOpacity} 25%, transparent 25%), linear-gradient(315deg, ${primaryColorWithOpacity} 25%, ${backgroundColorWithOpacity} 25%)`,
        backgroundPosition: adjustedSpacing,
        backgroundSize: adjustedSize,
        backgroundRepeat: 'repeat',
      };
    },
  },
  {
    id: 'dots',
    name: 'Polka Dots',
    description: 'Classic dotted pattern',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      opacity: 1,
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const primaryColorWithOpacity = `${primaryColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;
      const backgroundColorWithOpacity = `${backgroundColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;

      return {
        backgroundColor: backgroundColorWithOpacity,
        backgroundImage: `radial-gradient(circle, ${primaryColorWithOpacity} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Simple grid lines pattern',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage:
        'linear-gradient(#333333 1px, transparent 1px), linear-gradient(90deg, #333333 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      opacity: 1,
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const primaryColorWithOpacity = `${primaryColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;
      const backgroundColorWithOpacity = `${backgroundColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;

      return {
        backgroundColor: backgroundColorWithOpacity,
        backgroundImage: `linear-gradient(${primaryColorWithOpacity} 1px, transparent 1px), linear-gradient(90deg, ${primaryColorWithOpacity} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },
  {
    id: 'stripes',
    name: 'Diagonal Stripes',
    description: 'Diagonal striped pattern',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage:
        'linear-gradient(45deg, #333333 25%, transparent 25%, transparent 75%, #333333 75%)',
      backgroundSize: '20px 20px',
      opacity: 1,
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const primaryColorWithOpacity = `${primaryColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;
      const backgroundColorWithOpacity = `${backgroundColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;

      return {
        backgroundColor: backgroundColorWithOpacity,
        backgroundImage: `linear-gradient(45deg, ${primaryColorWithOpacity} 25%, transparent 25%, transparent 75%, ${primaryColorWithOpacity} 75%)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    description: 'Zigzag chevron pattern',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage:
        'linear-gradient(135deg, #333333 25%, transparent 25%, transparent 50%, #333333 50%, #333333 75%, transparent 75%)',
      backgroundSize: '20px 20px',
      opacity: 1,
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const primaryColorWithOpacity = `${primaryColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;
      const backgroundColorWithOpacity = `${backgroundColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;

      return {
        backgroundColor: backgroundColorWithOpacity,
        backgroundImage: `linear-gradient(135deg, ${primaryColorWithOpacity} 25%, transparent 25%, transparent 50%, ${primaryColorWithOpacity} 50%, ${primaryColorWithOpacity} 75%, transparent 75%)`,
        backgroundSize: `${size}px ${size}px`,
      };
    },
  },
  {
    id: 'hexagons',
    name: 'Hexagons',
    description: 'Hexagonal honeycomb pattern',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage:
        'radial-gradient(circle farthest-side at 0% 50%, transparent 23.5%, #333333 0 24.5%, transparent 0), radial-gradient(circle farthest-side at 50% 35%, transparent 23.5%, #333333 0 24.5%, transparent 0)',
      backgroundSize: '40px 60px',
      backgroundPosition: '0 0, 20px 30px',
      opacity: 1,
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const hexSize = `${size * 2}px ${size * 3}px`;
      const hexPosition = `0 0, ${size}px ${size * 1.5}px`;

      const primaryColorWithOpacity = `${primaryColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;
      const backgroundColorWithOpacity = `${backgroundColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;

      return {
        backgroundColor: backgroundColorWithOpacity,
        backgroundImage: `radial-gradient(circle farthest-side at 0% 50%, transparent 23.5%, ${primaryColorWithOpacity} 0 24.5%, transparent 0), radial-gradient(circle farthest-side at 50% 35%, transparent 23.5%, ${primaryColorWithOpacity} 0 24.5%, transparent 0)`,
        backgroundSize: hexSize,
        backgroundPosition: hexPosition,
      };
    },
  },
  {
    id: 'triangles',
    name: 'Triangles',
    description: 'Triangular tessellation pattern',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage:
        'linear-gradient(60deg, #333333 25%, transparent 25%, transparent 75%, #333333 75%), linear-gradient(-60deg, #333333 25%, transparent 25%, transparent 75%, #333333 75%)',
      backgroundSize: '30px 52px',
      backgroundPosition: '0 0, 15px 26px',
      opacity: 1,
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const triSize = `${size * 1.5}px ${size * 2.6}px`;
      const triPosition = `0 0, ${size * 0.75}px ${size * 1.3}px`;

      const primaryColorWithOpacity = `${primaryColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;
      const backgroundColorWithOpacity = `${backgroundColor}${Math.round(
        opacity * 255,
      )
        .toString(16)
        .padStart(2, '0')}`;

      return {
        backgroundColor: backgroundColorWithOpacity,
        backgroundImage: `linear-gradient(60deg, ${primaryColorWithOpacity} 25%, transparent 25%, transparent 75%, ${primaryColorWithOpacity} 75%), linear-gradient(-60deg, ${primaryColorWithOpacity} 25%, transparent 25%, transparent 75%, ${primaryColorWithOpacity} 75%)`,
        backgroundSize: triSize,
        backgroundPosition: triPosition,
      };
    },
  },
];

export const getPatternById = (id: string): PatternDefinition | undefined => {
  return PATTERN_DEFINITIONS.find((pattern) => pattern.id === id);
};

export const getPatternsByCategory = (
  category: PatternDefinition['category'],
): PatternDefinition[] => {
  return PATTERN_DEFINITIONS.filter((pattern) => pattern.category === category);
};

import type { CSSProperties } from 'react';

export type PatternDefinition = {
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
  }) => CSSProperties;
};

const toDataUri = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getStroke = (size: number) => Math.max(1, Math.round(size / 10));

export const PATTERN_DEFINITIONS: PatternDefinition[] = [
  {
    id: 'diagonal-grid',
    name: 'Diagonal Grid',
    description: 'Interlaced diagonal lines for directional structure',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundSize: '24px 24px',
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: true,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size, spacing }) => {
      const tile = Math.max(8, size + spacing);
      const stroke = getStroke(tile);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}' viewBox='0 0 ${tile} ${tile}'>
        <line x1='0' y1='0' x2='${tile}' y2='${tile}' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' />
        <line x1='${tile}' y1='0' x2='0' y2='${tile}' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' />
      </svg>`;

      return {
        backgroundColor,
        backgroundImage: toDataUri(svg),
        backgroundSize: `${tile}px ${tile}px`,
      };
    },
  },
  {
    id: 'dots',
    name: 'Polka Dots',
    description: 'Soft dotted rhythm for subtle texture',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundSize: '20px 20px',
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const tile = Math.max(6, size);
      const radius = clamp(Math.round(tile / 8), 1, tile / 2);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}' viewBox='0 0 ${tile} ${tile}'>
        <circle cx='${tile / 2}' cy='${tile / 2}' r='${radius}' fill='${primaryColor}' fill-opacity='${opacity}' />
      </svg>`;

      return {
        backgroundColor,
        backgroundImage: toDataUri(svg),
        backgroundSize: `${tile}px ${tile}px`,
      };
    },
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Clean grid lines for alignment',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundSize: '24px 24px',
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const tile = Math.max(8, size);
      const stroke = getStroke(tile);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}' viewBox='0 0 ${tile} ${tile}'>
        <path d='M ${stroke / 2} 0 V ${tile} M 0 ${stroke / 2} H ${tile}' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' fill='none' />
      </svg>`;

      return {
        backgroundColor,
        backgroundImage: toDataUri(svg),
        backgroundSize: `${tile}px ${tile}px`,
      };
    },
  },
  {
    id: 'stripes',
    name: 'Diagonal Stripes',
    description: 'Dynamic slanted stripes',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundSize: '24px 24px',
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const tile = Math.max(10, size);
      const stroke = Math.max(2, Math.round(tile / 5));
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}' viewBox='0 0 ${tile} ${tile}'>
        <line x1='-${tile}' y1='${tile}' x2='${tile}' y2='-${tile}' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' />
        <line x1='0' y1='${tile}' x2='${tile * 2}' y2='-${tile}' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' />
      </svg>`;

      return {
        backgroundColor,
        backgroundImage: toDataUri(svg),
        backgroundSize: `${tile}px ${tile}px`,
      };
    },
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    description: 'Playful zigzag motion',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundSize: '28px 28px',
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const tile = Math.max(12, size);
      const stroke = getStroke(tile);
      const points = `0 ${tile / 2} ${tile / 4} 0 ${tile / 2} ${tile / 2} ${
        (tile * 3) / 4
      } 0 ${tile} ${tile / 2} ${
        (tile * 3) / 4
      } ${tile} ${tile / 2} ${tile / 2} ${tile / 4} ${tile} 0 ${tile / 2}`;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}' viewBox='0 0 ${tile} ${tile}'>
        <polyline points='${points}' fill='none' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' stroke-linejoin='round' stroke-linecap='round' />
      </svg>`;

      return {
        backgroundColor,
        backgroundImage: toDataUri(svg),
        backgroundSize: `${tile}px ${tile}px`,
      };
    },
  },
  {
    id: 'hexagons',
    name: 'Hexagons',
    description: 'Honeycomb geometry',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundSize: '40px 36px',
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const width = Math.max(24, size * 2);
      const height = Math.max(20, Math.round(size * 1.7));
      const stroke = getStroke(size);
      const points = `${width * 0.25},0 ${width * 0.75},0 ${width},${
        height / 2
      } ${width * 0.75},${height} ${width * 0.25},${height} 0,${height / 2}`;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
        <polygon points='${points}' fill='none' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' />
      </svg>`;

      return {
        backgroundColor,
        backgroundImage: toDataUri(svg),
        backgroundSize: `${width}px ${height}px`,
      };
    },
  },
  {
    id: 'triangles',
    name: 'Triangles',
    description: 'Angular tessellation pattern',
    category: 'geometric',
    cssProperties: {
      backgroundColor: '#ffffff',
      backgroundImage: '',
      backgroundSize: '32px 28px',
    },
    customizableParams: {
      primaryColor: true,
      backgroundColor: true,
      opacity: true,
      size: true,
      spacing: false,
    },
    generateCSS: ({ primaryColor, backgroundColor, opacity, size }) => {
      const width = Math.max(16, size * 1.6);
      const height = Math.max(14, Math.round(size * 1.4));
      const stroke = getStroke(size);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
        <polygon points='0,${height} ${width / 2},0 ${width},${height}' fill='none' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' />
        <polygon points='0,0 ${width / 2},${height} ${width},0' fill='none' stroke='${primaryColor}' stroke-width='${stroke}' stroke-opacity='${opacity}' />
      </svg>`;

      return {
        backgroundColor,
        backgroundImage: toDataUri(svg),
        backgroundSize: `${width}px ${height}px`,
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

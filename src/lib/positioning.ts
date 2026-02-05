import { PositionPreset } from '@/types';

export type PositionPresetInfo = {
  id: PositionPreset;
  name: string;
  description: string;
  gridPosition: { row: number; col: number };
  icon: string;
};

export const POSITION_PRESETS: PositionPresetInfo[] = [
  {
    id: 'top-left',
    name: 'Top Left',
    description: 'Position at top-left corner',
    gridPosition: { row: 0, col: 0 },
    icon: '↖️',
  },
  {
    id: 'top-center',
    name: 'Top Center',
    description: 'Position at top-center',
    gridPosition: { row: 0, col: 1 },
    icon: '⬆️',
  },
  {
    id: 'top-right',
    name: 'Top Right',
    description: 'Position at top-right corner',
    gridPosition: { row: 0, col: 2 },
    icon: '↗️',
  },
  {
    id: 'center-left',
    name: 'Center Left',
    description: 'Position at center-left',
    gridPosition: { row: 1, col: 0 },
    icon: '⬅️',
  },
  {
    id: 'center',
    name: 'Center',
    description: 'Position at center',
    gridPosition: { row: 1, col: 1 },
    icon: '🎯',
  },
  {
    id: 'center-right',
    name: 'Center Right',
    description: 'Position at center-right',
    gridPosition: { row: 1, col: 2 },
    icon: '➡️',
  },
  {
    id: 'bottom-left',
    name: 'Bottom Left',
    description: 'Position at bottom-left corner',
    gridPosition: { row: 2, col: 0 },
    icon: '↙️',
  },
  {
    id: 'bottom-center',
    name: 'Bottom Center',
    description: 'Position at bottom-center',
    gridPosition: { row: 2, col: 1 },
    icon: '⬇️',
  },
  {
    id: 'bottom-right',
    name: 'Bottom Right',
    description: 'Position at bottom-right corner',
    gridPosition: { row: 2, col: 2 },
    icon: '↘️',
  },
];

export type CanvasDimensions = {
  width: number;
  height: number;
};

export type PositionCalculationParams = {
  preset: PositionPreset;
  canvasDimensions: CanvasDimensions;
  elementWidth: number;
  elementHeight: number;
  paddingX: number;
  paddingY: number;
};

export function calculatePresetPosition(
  preset: PositionPreset,
  canvasDimensions: CanvasDimensions,
  elementWidth: number = 100,
  elementHeight: number = 30,
): { x: number; y: number } {
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;

  switch (preset) {
    case 'top-left':
      return { x: 0, y: 0 };

    case 'top-center':
      return { x: (canvasWidth - elementWidth) / 2, y: 0 };

    case 'top-right':
      return { x: canvasWidth - elementWidth, y: 0 };

    case 'center-left':
      return { x: 0, y: (canvasHeight - elementHeight) / 2 };

    case 'center':
      return {
        x: (canvasWidth - elementWidth) / 2,
        y: (canvasHeight - elementHeight) / 2,
      };

    case 'center-right':
      return {
        x: canvasWidth - elementWidth,
        y: (canvasHeight - elementHeight) / 2,
      };

    case 'bottom-left':
      return { x: 0, y: canvasHeight - elementHeight };

    case 'bottom-center':
      return {
        x: (canvasWidth - elementWidth) / 2,
        y: canvasHeight - elementHeight,
      };

    case 'bottom-right':
      return { x: canvasWidth - elementWidth, y: canvasHeight - elementHeight };

    case 'manual':
    default:
      return { x: 50, y: 50 }; // Default manual position
  }
}

export function applyPaddingOffset(
  basePosition: { x: number; y: number },
  paddingX: number = 0,
  paddingY: number = 0,
): { x: number; y: number } {
  return {
    x: basePosition.x + paddingX,
    y: basePosition.y + paddingY,
  };
}

export function calculateFinalPosition(params: PositionCalculationParams): {
  x: number;
  y: number;
} {
  if (params.preset === 'manual') {
    // For manual positioning, just apply padding to current position
    return { x: params.paddingX, y: params.paddingY };
  }

  const basePosition = calculatePresetPosition(
    params.preset,
    params.canvasDimensions,
    params.elementWidth,
    params.elementHeight,
  );

  return applyPaddingOffset(basePosition, params.paddingX, params.paddingY);
}

export function getPresetById(
  id: PositionPreset,
): PositionPresetInfo | undefined {
  return POSITION_PRESETS.find((preset) => preset.id === id);
}

export function getPresetGrid(): PositionPresetInfo[][] {
  const grid: PositionPresetInfo[][] = [[], [], []];

  POSITION_PRESETS.forEach((preset) => {
    const { row, col } = preset.gridPosition;
    grid[row][col] = preset;
  });

  return grid;
}

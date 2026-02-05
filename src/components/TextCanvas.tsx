'use client';

import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { getPatternById } from '@/lib/patterns';
import { BackgroundConfig } from '@/types';
import React, { useRef } from 'react';
import { TextElement } from './TextElement';

const shallowArrayEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const checkerboardSvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
    <rect width='24' height='24' fill='white'/>
    <rect width='12' height='12' fill='#f0f0f0'/>
    <rect x='12' y='12' width='12' height='12' fill='#f0f0f0'/>
  </svg>`,
);

export function TextCanvas() {
  const { selectElement } = useAppActions();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasSettings = useAppStore((state) => state.canvasSettings);
  const textElementIds = useAppStore(
    (state) => state.textElements.map((element) => element.id),
    shallowArrayEqual,
  );
  const hasElements = textElementIds.length > 0;

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
    }
  };

  const getBackgroundStyle = (
    background: BackgroundConfig,
  ): React.CSSProperties => {
    switch (background.type) {
      case 'solid':
        return { backgroundColor: background.color };

      case 'transparent':
        return {
          backgroundColor: '#ffffff',
          backgroundImage: `url("data:image/svg+xml,${checkerboardSvg}")`,
          backgroundSize: '24px 24px',
        };

      case 'gradient':
        return {
          backgroundColor: background.from,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.04)`
        };

      case 'pattern':
        return getPatternStyle(background);

      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  const getPatternStyle = (
    pattern: Extract<BackgroundConfig, { type: 'pattern' }>,
  ): React.CSSProperties => {
    const { patternId, primaryColor, backgroundColor, opacity, size, spacing } =
      pattern;

    const patternDef = getPatternById(patternId);

    if (!patternDef) {
      return { backgroundColor };
    }

    return patternDef.generateCSS({
      primaryColor,
      backgroundColor,
      opacity,
      size,
      spacing,
    });
  };

  const canvasStyle: React.CSSProperties = {
    width: `${canvasSettings.width}px`,
    height: `${canvasSettings.height}px`,
    borderRadius: `${canvasSettings.borderRadius}px`,
    position: 'relative',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    margin: '0 auto',
    boxShadow: 'var(--canvas-shadow)',
    ...getBackgroundStyle(canvasSettings.background),
  };

  return (
    <div className="flex justify-center py-4">
      <div
        ref={canvasRef}
        id="text-canvas"
        style={canvasStyle}
        onClick={handleCanvasClick}
        className="relative overflow-hidden"
      >
        {textElementIds.map((id) => (
          <TextElement key={id} elementId={id} />
        ))}
        {!hasElements && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="max-w-xs text-center">
              <p className="text-lg font-medium text-foreground">
                Start by adding a text layer
              </p>
              <p className="text-sm text-muted-foreground">
                Your canvas is ready for typography experiments.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

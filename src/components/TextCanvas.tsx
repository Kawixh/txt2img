'use client';

import { useApp } from '@/contexts/AppContext';
import { getPatternById } from '@/lib/patterns';
import { BackgroundConfig } from '@/types';
import React, { useRef } from 'react';
import { TextElement } from './TextElement';

export function TextCanvas() {
  const { state, selectElement } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);

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
          backgroundColor: 'transparent',
          backgroundImage: `
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        };

      case 'gradient':
        const direction = background.direction.replace('to-', 'to ');
        const gradientStops = background.via
          ? `${background.from}, ${background.via}, ${background.to}`
          : `${background.from}, ${background.to}`;
        return {
          background: `linear-gradient(${direction}, ${gradientStops})`,
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

    // Import pattern definition
    const patternDef = getPatternById(patternId);

    if (!patternDef) {
      return { backgroundColor };
    }

    // Generate CSS using the pattern's generateCSS function
    return patternDef.generateCSS({
      primaryColor,
      backgroundColor,
      opacity,
      size,
      spacing,
    });
  };

  const canvasStyle: React.CSSProperties = {
    width: `${state.canvasSettings.width}px`,
    height: `${state.canvasSettings.height}px`,
    borderRadius: `${state.canvasSettings.borderRadius}px`,
    position: 'relative',
    border: '2px solid #e5e7eb',
    overflow: 'hidden',
    margin: '0 auto',
    ...getBackgroundStyle(state.canvasSettings.background),
  };

  return (
    <div className="flex justify-center p-4 container-safe">
      <div
        ref={canvasRef}
        id="text-canvas"
        style={canvasStyle}
        onClick={handleCanvasClick}
        className="transition-smooth hover:shadow-2xl hover:shadow-purple-500/10 relative overflow-hidden group"
      >
        {state.textElements.map((element) => (
          <TextElement
            key={element.id}
            element={element}
            isSelected={state.selectedElementId === element.id}
          />
        ))}
        {state.textElements.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-bounce-subtle">
              <div className="text-6xl mb-4 animate-float">✨</div>
              <p className="text-lg text-muted-foreground font-medium word-wrap">
                Click "Add Text" to start creating
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2 word-wrap">
                Your canvas awaits some magic!
              </p>
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-smooth pointer-events-none" />
      </div>
    </div>
  );
}

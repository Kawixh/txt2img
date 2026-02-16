'use client';

import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { calculateFinalPosition } from '@/lib/positioning';
import { Trash2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

type TextElementProps = {
  elementId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasScale: number;
};

function TextElementComponent({
  elementId,
  canvasRef,
  canvasScale,
}: TextElementProps) {
  const { updateTextElement, removeTextElement, selectElement } = useAppActions();
  const element = useAppStore(
    (state) =>
      state.textElements.find((item) => item.id === elementId) || null,
  );
  const isSelected = useAppStore(
    (state) => state.selectedElementId === elementId,
  );
  const isExporting = useAppStore((state) => state.exportStatus === 'loading');
  const canvasSize = useAppStore(
    (state) => ({
      width: state.canvasSettings.width,
      height: state.canvasSettings.height,
    }),
    (a, b) => a.width === b.width && a.height === b.height,
  );
  const isLoadingFont = useAppStore((state) => {
    if (!element) return false;
    return (
      state.fonts.isLoadingFont &&
      state.fonts.currentlyLoadingFont === element.fontFamily
    );
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current || canvasScale === 0) {
        return { x: clientX, y: clientY };
      }
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / canvasScale,
        y: (clientY - rect.top) / canvasScale,
      };
    },
    [canvasRef, canvasScale],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!element) return;
    e.preventDefault();
    const point = getCanvasPoint(e.clientX, e.clientY);
    setIsDragging(true);
    setDragStart({
      x: point.x - element.x,
      y: point.y - element.y,
    });
    selectElement(element.id);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !element) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      const newX = point.x - dragStart.x;
      const newY = point.y - dragStart.y;

      updateTextElement(element.id, { x: newX, y: newY });
    },
    [dragStart.x, dragStart.y, element, getCanvasPoint, isDragging, updateTextElement],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp, isDragging]);

  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
    if (!element) return;
    const newContent = event.currentTarget.textContent || '';
    updateTextElement(element.id, { content: newContent });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeTextElement(elementId);
  };

  const calculateElementPosition = useCallback(() => {
    if (!element || element.positionPreset === 'manual' || !elementRef.current) {
      return null;
    }

    const elementRect = elementRef.current.getBoundingClientRect();
    const scaledWidth = elementRect.width || element.width;
    const scaledHeight = elementRect.height || element.fontSize * 1.4;
    const actualWidth =
      canvasScale > 0 ? scaledWidth / canvasScale : scaledWidth;
    const actualHeight =
      canvasScale > 0 ? scaledHeight / canvasScale : scaledHeight;

    const finalPosition = calculateFinalPosition({
      preset: element.positionPreset,
      canvasDimensions: canvasSize,
      elementWidth: actualWidth,
      elementHeight: actualHeight,
      paddingX: element.paddingX,
      paddingY: element.paddingY,
    });

    return {
      x: Math.max(0, Math.min(finalPosition.x, canvasSize.width - actualWidth)),
      y: Math.max(0, Math.min(finalPosition.y, canvasSize.height - actualHeight)),
      actualWidth,
      actualHeight,
    };
  }, [
    canvasSize,
    canvasScale,
    element,
  ]);

  useEffect(() => {
    if (!element) return;

    const newPosition = calculateElementPosition();
    if (newPosition) {
      if (
        Math.abs(element.x - newPosition.x) > 1 ||
        Math.abs(element.y - newPosition.y) > 1
      ) {
        updateTextElement(element.id, {
          x: newPosition.x,
          y: newPosition.y,
        });
      }
    }
  }, [
    calculateElementPosition,
    element,
    updateTextElement,
  ]);

  const fontStyle = useMemo(() => {
    if (!element) return {} as React.CSSProperties;

    const decorations = [];
    if (element.textDecoration?.underline) decorations.push('underline');
    if (element.textDecoration?.overline) decorations.push('overline');
    if (element.textDecoration?.strikethrough) decorations.push('line-through');
    const textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none';

    let fontVariationSettings = '';
    if (
      element.fontVariationSettings &&
      Object.keys(element.fontVariationSettings).length > 0
    ) {
      fontVariationSettings = Object.entries(element.fontVariationSettings)
        .map(([axis, value]) => `"${axis}" ${value}`)
        .join(', ');
    }
    const hasOpticalAxis =
      element.fontVariationSettings &&
      Object.prototype.hasOwnProperty.call(element.fontVariationSettings, 'opsz');

    const fontStyleValue: React.CSSProperties['fontStyle'] =
      element.fontStyle === 'oblique'
        ? `oblique ${element.fontSlant ?? 0}deg`
        : element.fontStyle;

    const baseStyle: React.CSSProperties = {
      fontSize: `${element.fontSize}px`,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      fontStyle: fontStyleValue,
      fontStretch: element.fontStretch ? `${element.fontStretch}%` : undefined,
      fontOpticalSizing: hasOpticalAxis ? 'none' : undefined,
      textDecoration,
      textTransform: element.textTransform || 'none',
      lineHeight: element.lineHeight || 1.2,
      letterSpacing: `${element.letterSpacing || 0}px`,
      wordSpacing: `${element.wordSpacing || 0}px`,
      color: element.color,
      textAlign: element.textAlign as 'left' | 'center' | 'right' | 'justify',
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      whiteSpace: element.wordWrap ? 'pre-wrap' : 'nowrap',
      wordWrap: element.wordWrap ? 'break-word' : 'normal',
      overflowWrap: element.wordWrap ? 'break-word' : 'normal',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: isDragging ? 'none' : 'text',
      outline: 'none',
      border: isSelected
        ? isExporting
          ? '1px dashed transparent'
          : '1px dashed var(--primary)'
        : '1px dashed transparent',
      padding: '6px 8px',
      borderRadius: '8px',
      minWidth: '20px',
      minHeight: '20px',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      ...(fontVariationSettings ? { fontVariationSettings } : {}),
    };

    return baseStyle;
  }, [
    element,
    isDragging,
    isExporting,
    isSelected,
  ]);

  if (!element) return null;

  return (
    <div className="relative" data-text-element>
      <div
        ref={elementRef}
        style={fontStyle}
        className={isLoadingFont ? 'text-loading' : ''}
        data-text={element.content}
        onMouseDown={handleMouseDown}
        onClick={() => selectElement(element.id)}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onBlur={handleContentChange}
      >
        {element.content}
      </div>
      {isSelected && !isExporting && (
        <button
          onClick={handleDelete}
          data-export-ignore="true"
          className="absolute right-0 top-0 max-w-min -translate-y-2 translate-x-2 rounded-full border border-border/70 bg-card p-1 text-foreground shadow-sm transition hover:border-destructive hover:text-destructive"
          style={{
            left: `${element.x + 100}px`,
            top: `${element.y - 12}px`,
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

export const TextElement = React.memo(TextElementComponent);

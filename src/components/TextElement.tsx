'use client';

import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { calculateFinalPosition } from '@/lib/positioning';
import { Trash2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface TextElementProps {
  elementId: string;
}

function TextElementComponent({ elementId }: TextElementProps) {
  const { updateTextElement, removeTextElement, selectElement } = useAppActions();
  const element = useAppStore(
    (state) =>
      state.textElements.find((item) => item.id === elementId) || null,
  );
  const isSelected = useAppStore(
    (state) => state.selectedElementId === elementId,
  );
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
  const [localContent, setLocalContent] = useState('');
  const elementRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (element) {
      setLocalContent(element.content);
    }
  }, [element?.content]);

  const debouncedUpdateContent = useCallback(
    (content: string) => {
      if (!element) return;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        updateTextElement(element.id, { content });
      }, 300);
    },
    [element, updateTextElement],
  );

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!element) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    });
    selectElement(element.id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !element) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    updateTextElement(element.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, element]);

  const handleContentChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    if (!element) return;
    const newContent = e.currentTarget.textContent || '';
    setLocalContent(newContent);
    debouncedUpdateContent(newContent);
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
    const actualWidth = elementRect.width || element.width;
    const actualHeight = elementRect.height || element.fontSize * 1.4;

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
    element?.x,
    element?.y,
    element?.id,
    element?.content,
    element?.wordWrap,
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
        ? '1px dashed var(--primary)'
        : '1px dashed transparent',
      padding: '6px 8px',
      borderRadius: '8px',
      minWidth: '20px',
      minHeight: '20px',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    };

    if (fontVariationSettings) {
      (baseStyle as Record<string, any>).fontVariationSettings =
        fontVariationSettings;
    }

    return baseStyle;
  }, [
    element,
    isDragging,
    isSelected,
  ]);

  if (!element) return null;

  return (
    <div className="relative">
      <div
        ref={elementRef}
        style={fontStyle}
        className={isLoadingFont ? 'text-loading' : ''}
        data-text={localContent}
        onMouseDown={handleMouseDown}
        onClick={() => selectElement(element.id)}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onBlur={handleContentChange}
      >
        {localContent}
      </div>
      {isSelected && (
        <button
          onClick={handleDelete}
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

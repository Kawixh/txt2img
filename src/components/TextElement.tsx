'use client';

import { useApp } from '@/contexts/AppContext';
import { TextElement as TextElementType } from '@/types';
import { calculateFinalPosition } from '@/lib/positioning';
import { Trash2, Loader2 } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';

interface TextElementProps {
  element: TextElementType;
  isSelected: boolean;
}

export function TextElement({ element, isSelected }: TextElementProps) {
  const { updateTextElement, removeTextElement, selectElement, state } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Check if this element's font is currently being loaded
  const isLoadingFont = state.fonts.isLoadingFont && 
    state.fonts.currentlyLoadingFont === element.fontFamily;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    });
    selectElement(element.id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    updateTextElement(element.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleContentChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    updateTextElement(element.id, {
      content: e.currentTarget.textContent || '',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeTextElement(element.id);
  };

  // Calculate position based on preset and padding

  useEffect(() => {
    if (element.positionPreset !== 'manual' && elementRef.current) {
      const canvasDimensions = {
        width: state.canvasSettings.width,
        height: state.canvasSettings.height,
      };

      // Get actual element dimensions including padding and content
      const elementRect = elementRef.current.getBoundingClientRect();
      const actualWidth = elementRect.width || element.width;
      const actualHeight = elementRect.height || element.fontSize * 1.4; // Fallback with better estimate

      const finalPosition = calculateFinalPosition({
        preset: element.positionPreset,
        canvasDimensions,
        elementWidth: actualWidth,
        elementHeight: actualHeight,
        paddingX: element.paddingX,
        paddingY: element.paddingY,
      });

      // Only update if position actually changed to avoid infinite loops
      if (
        Math.abs(element.x - finalPosition.x) > 1 ||
        Math.abs(element.y - finalPosition.y) > 1
      ) {
        updateTextElement(element.id, {
          x: Math.max(
            0,
            Math.min(finalPosition.x, canvasDimensions.width - actualWidth),
          ),
          y: Math.max(
            0,
            Math.min(finalPosition.y, canvasDimensions.height - actualHeight),
          ),
        });
      }
    }
  }, [
    element.positionPreset,
    element.paddingX,
    element.paddingY,
    element.width,
    element.fontSize,
    element.content,
    element.wordWrap,
  ]);

  const getFontStyle = () => ({
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
    textAlign: element.textAlign as 'left' | 'center' | 'right',
    position: 'absolute' as const,
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    whiteSpace: element.wordWrap ? 'pre-wrap' : 'nowrap',
    wordWrap: element.wordWrap ? 'break-word' : 'normal',
    overflowWrap: element.wordWrap ? 'break-word' : 'normal',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none' as const,
    outline: 'none',
    border: isSelected ? '2px dashed #3b82f6' : '2px dashed transparent',
    padding: '4px',
    borderRadius: '4px',
    minWidth: '20px',
    minHeight: '20px',
    opacity: isLoadingFont ? 0.7 : 1,
    transition: 'opacity 0.2s ease-in-out',
  });

  return (
    <div className="relative">
      <div
        ref={elementRef}
        style={getFontStyle()}
        onMouseDown={handleMouseDown}
        onClick={() => selectElement(element.id)}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onBlur={handleContentChange}
      >
        {element.content}
      </div>
      {isLoadingFont && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            left: `${element.x}px`,
            top: `${element.y}px`,
            width: `${element.width}px`,
            minHeight: '20px',
          }}
        >
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1">
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          </div>
        </div>
      )}
      {isSelected && (
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 max-w-min translate-x-2 -translate-y-2 transform rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
          style={{
            left: `${element.x + 100}px`,
            top: `${element.y - 10}px`,
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

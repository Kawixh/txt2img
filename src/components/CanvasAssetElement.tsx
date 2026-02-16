'use client';

import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { CanvasImageElement, ShapeElement } from '@/types';
import { ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CanvasAssetElementProps = {
  elementId: string;
  elementType: 'shape' | 'image';
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasScale: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const MIN_LAYER_SIZE = 24;
const MIN_VISIBLE_PIXELS = 28;

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

const RESIZE_HANDLE_CLASS: Record<ResizeHandle, string> = {
  nw: '-left-1.5 -top-1.5 cursor-nwse-resize',
  ne: '-right-1.5 -top-1.5 cursor-nesw-resize',
  sw: '-left-1.5 -bottom-1.5 cursor-nesw-resize',
  se: '-right-1.5 -bottom-1.5 cursor-nwse-resize',
};

const getLayerBounds = (
  canvasWidth: number,
  canvasHeight: number,
  layerWidth: number,
  layerHeight: number,
) => {
  const minX = -layerWidth + MIN_VISIBLE_PIXELS;
  const maxX = canvasWidth - MIN_VISIBLE_PIXELS;
  const minY = -layerHeight + MIN_VISIBLE_PIXELS;
  const maxY = canvasHeight - MIN_VISIBLE_PIXELS;

  return {
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minY: Math.min(minY, maxY),
    maxY: Math.max(minY, maxY),
  };
};

function CanvasAssetElementComponent({
  elementId,
  elementType,
  canvasRef,
  canvasScale,
}: CanvasAssetElementProps) {
  const {
    selectElement,
    updateShapeElement,
    removeShapeElement,
    updateImageElement,
    removeImageElement,
  } = useAppActions();
  const element = useAppStore((state) => {
    if (elementType === 'shape') {
      return state.shapeElements.find((item) => item.id === elementId) ?? null;
    }
    return state.imageElements.find((item) => item.id === elementId) ?? null;
  });
  const isSelected = useAppStore((state) => state.selectedElementId === elementId);
  const isExporting = useAppStore((state) => state.exportStatus === 'loading');
  const canvasSize = useAppStore(
    (state) => ({
      width: state.canvasSettings.width,
      height: state.canvasSettings.height,
    }),
    (a, b) => a.width === b.width && a.height === b.height,
  );

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeHandle, setActiveResizeHandle] =
    useState<ResizeHandle | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStateRef = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startRect: { x: number; y: number; width: number; height: number };
  } | null>(null);

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

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!element || event.button !== 0 || isResizing) return;
    if ((event.target as HTMLElement).closest('[data-resize-handle]')) return;
    event.preventDefault();
    event.stopPropagation();

    selectElement(element.id);
    const point = getCanvasPoint(event.clientX, event.clientY);
    dragOffsetRef.current = {
      x: point.x - element.x,
      y: point.y - element.y,
    };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!element || !isDragging) return;

      const point = getCanvasPoint(event.clientX, event.clientY);
      const bounds = getLayerBounds(
        canvasSize.width,
        canvasSize.height,
        element.width,
        element.height,
      );
      const nextX = clamp(
        point.x - dragOffsetRef.current.x,
        bounds.minX,
        bounds.maxX,
      );
      const nextY = clamp(
        point.y - dragOffsetRef.current.y,
        bounds.minY,
        bounds.maxY,
      );

      if (elementType === 'shape') {
        updateShapeElement(element.id, { x: nextX, y: nextY });
      } else {
        updateImageElement(element.id, { x: nextX, y: nextY });
      }
    },
    [
      canvasSize.height,
      canvasSize.width,
      element,
      elementType,
      getCanvasPoint,
      isDragging,
      updateImageElement,
      updateShapeElement,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isDragging]);

  const handleResizeMouseDown = (
    handle: ResizeHandle,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!element || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    selectElement(element.id);

    const point = getCanvasPoint(event.clientX, event.clientY);
    resizeStateRef.current = {
      handle,
      startX: point.x,
      startY: point.y,
      startRect: {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      },
    };

    setActiveResizeHandle(handle);
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (event: MouseEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const point = getCanvasPoint(event.clientX, event.clientY);
      const deltaX = point.x - resizeState.startX;
      const deltaY = point.y - resizeState.startY;
      const { x, y, width, height } = resizeState.startRect;
      const startBounds = getLayerBounds(
        canvasSize.width,
        canvasSize.height,
        width,
        height,
      );
      const maxWidth = 4000;
      const maxHeight = 4000;

      let nextX = x;
      let nextY = y;
      let nextWidth = width;
      let nextHeight = height;

      switch (resizeState.handle) {
        case 'se':
          nextWidth = clamp(width + deltaX, MIN_LAYER_SIZE, maxWidth);
          nextHeight = clamp(height + deltaY, MIN_LAYER_SIZE, maxHeight);
          break;
        case 'sw': {
          const updatedX = clamp(
            x + deltaX,
            startBounds.minX,
            x + width - MIN_LAYER_SIZE,
          );
          nextX = updatedX;
          nextWidth = width + (x - updatedX);
          nextHeight = clamp(height + deltaY, MIN_LAYER_SIZE, maxHeight);
          break;
        }
        case 'ne': {
          const updatedY = clamp(
            y + deltaY,
            startBounds.minY,
            y + height - MIN_LAYER_SIZE,
          );
          nextY = updatedY;
          nextHeight = height + (y - updatedY);
          nextWidth = clamp(width + deltaX, MIN_LAYER_SIZE, maxWidth);
          break;
        }
        case 'nw': {
          const updatedX = clamp(
            x + deltaX,
            startBounds.minX,
            x + width - MIN_LAYER_SIZE,
          );
          const updatedY = clamp(
            y + deltaY,
            startBounds.minY,
            y + height - MIN_LAYER_SIZE,
          );
          nextX = updatedX;
          nextY = updatedY;
          nextWidth = width + (x - updatedX);
          nextHeight = height + (y - updatedY);
          break;
        }
      }

      const nextBounds = getLayerBounds(
        canvasSize.width,
        canvasSize.height,
        nextWidth,
        nextHeight,
      );
      const normalized = {
        x: Math.round(clamp(nextX, nextBounds.minX, nextBounds.maxX)),
        y: Math.round(clamp(nextY, nextBounds.minY, nextBounds.maxY)),
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      };

      if (elementType === 'shape') {
        updateShapeElement(elementId, normalized);
      } else {
        updateImageElement(elementId, normalized);
      }
    };

    const handleResizeMouseUp = () => {
      setIsResizing(false);
      setActiveResizeHandle(null);
      resizeStateRef.current = null;
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [
    canvasSize.height,
    canvasSize.width,
    elementId,
    elementType,
    getCanvasPoint,
    isResizing,
    updateImageElement,
    updateShapeElement,
  ]);

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!element) return;
    if (elementType === 'shape') {
      removeShapeElement(element.id);
    } else {
      removeImageElement(element.id);
    }
  };

  const shapeClassName = useMemo(() => {
    if (!element || elementType !== 'shape') return '';
    const shape = element as ShapeElement;

    return cn(
      'size-full shadow-sm',
      shape.shape === 'rectangle' && 'rounded-xl',
      shape.shape === 'circle' && 'rounded-full',
      shape.shape === 'triangle' &&
        '[clip-path:polygon(50%_0%,0%_100%,100%_100%)]',
      shape.shape === 'diamond' &&
        '[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]',
      shape.shape === 'hexagon' &&
        '[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]',
      shape.shape === 'star' &&
        '[clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]',
    );
  }, [element, elementType]);

  if (!element) return null;

  return (
    <div
      className={cn(
        'absolute touch-none',
        isResizing
          ? activeResizeHandle === 'ne' || activeResizeHandle === 'sw'
            ? 'cursor-nesw-resize'
            : 'cursor-nwse-resize'
          : isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab',
        isSelected && !isExporting
          ? 'ring-primary/85 ring-2 ring-offset-2'
          : 'ring-1 ring-transparent',
      )}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: 'center',
        opacity: element.opacity,
      }}
      data-canvas-object
      data-layer-type={elementType}
      onMouseDown={handleMouseDown}
      onClick={() => selectElement(element.id)}
    >
      {elementType === 'shape' ? (
        <div
          className={shapeClassName}
          style={{ backgroundColor: (element as ShapeElement).fill }}
        />
      ) : (
        <div className="relative size-full overflow-hidden rounded-md border border-border/60 bg-background/60">
          <Image
            src={(element as CanvasImageElement).src}
            alt={(element as CanvasImageElement).name || 'Canvas image'}
            fill
            unoptimized
            sizes={`${element.width}px`}
            className="pointer-events-none select-none object-contain"
          />
        </div>
      )}

      {elementType === 'image' && !isExporting && !isSelected && (
        <div className="pointer-events-none absolute right-1 top-1 rounded-md bg-card/80 p-1 shadow-sm">
          <ImageIcon className="text-muted-foreground h-3.5 w-3.5" />
        </div>
      )}

      {isSelected && !isExporting && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => (
            <button
              key={handle}
              type="button"
              data-export-ignore="true"
              data-resize-handle={handle}
              onMouseDown={(event) => handleResizeMouseDown(handle, event)}
              className={cn(
                'border-primary/90 bg-background absolute z-20 h-3.5 w-3.5 rounded-sm border shadow-sm',
                RESIZE_HANDLE_CLASS[handle],
              )}
              title="Drag to resize image"
              aria-label={`Resize image from ${handle} corner`}
            />
          ))}
        </>
      )}

      {isSelected && !isExporting && (
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={handleDelete}
          data-export-ignore="true"
          className="absolute -right-2 -top-2 rounded-full border border-border/70 bg-card p-1 text-foreground shadow-sm transition hover:border-destructive hover:text-destructive"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

export const CanvasAssetElement = React.memo(CanvasAssetElementComponent);

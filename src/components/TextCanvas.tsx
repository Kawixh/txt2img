'use client';

import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { getPatternById } from '@/lib/patterns';
import { cn } from '@/lib/utils';
import { BackgroundConfig } from '@/types';
import { LocateFixed, Maximize2, Minus, Plus } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TextElement } from './TextElement';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const shallowArrayEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const checkerboardSvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
    <rect width='24' height='24' fill='white'/>
    <rect width='12' height='12' fill='#f0f0f0'/>
    <rect x='12' y='12' width='12' height='12' fill='#f0f0f0'/>
  </svg>`,
);

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 4;
const PAN_THRESHOLD = 2;

export function TextCanvas() {
  const { selectElement } = useAppActions();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef({
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
    moved: false,
  });

  const canvasSettings = useAppStore((state) => state.canvasSettings);
  const textElementIds = useAppStore(
    (state) => state.textElements.map((element) => element.id),
    shallowArrayEqual,
  );
  const hasElements = textElementIds.length > 0;

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [zoomMode, setZoomMode] = useState<'fit' | 'manual'>('fit');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (panStateRef.current.moved) {
      panStateRef.current.moved = false;
      return;
    }

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
          boxShadow: `0 0 0 1px rgba(0,0,0,0.04)`,
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

  const fitScale = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return 1;

    const scale = Math.min(
      viewportSize.width / canvasSettings.width,
      viewportSize.height / canvasSettings.height,
    );

    return Math.min(scale, 1);
  }, [canvasSettings.height, canvasSettings.width, viewportSize.height, viewportSize.width]);

  const scale = zoomMode === 'fit' ? fitScale : zoom;

  const clampPan = useCallback(
    (nextPan: { x: number; y: number }, nextScale: number) => {
      if (!viewportSize.width || !viewportSize.height) return nextPan;

      const scaledWidth = canvasSettings.width * nextScale;
      const scaledHeight = canvasSettings.height * nextScale;

      const centerX = (viewportSize.width - scaledWidth) / 2;
      const centerY = (viewportSize.height - scaledHeight) / 2;

      const minX = scaledWidth >= viewportSize.width ? viewportSize.width - scaledWidth : centerX;
      const maxX = scaledWidth >= viewportSize.width ? 0 : centerX;
      const minY = scaledHeight >= viewportSize.height ? viewportSize.height - scaledHeight : centerY;
      const maxY = scaledHeight >= viewportSize.height ? 0 : centerY;

      return {
        x: Math.min(maxX, Math.max(minX, nextPan.x)),
        y: Math.min(maxY, Math.max(minY, nextPan.y)),
      };
    },
    [canvasSettings.height, canvasSettings.width, viewportSize.height, viewportSize.width],
  );

  const getCenteredPan = useCallback(
    (nextScale: number) => {
      const scaledWidth = canvasSettings.width * nextScale;
      const scaledHeight = canvasSettings.height * nextScale;

      return {
        x: (viewportSize.width - scaledWidth) / 2,
        y: (viewportSize.height - scaledHeight) / 2,
      };
    },
    [canvasSettings.height, canvasSettings.width, viewportSize.height, viewportSize.width],
  );

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;

    if (zoomMode === 'fit') {
      setPan(clampPan(getCenteredPan(fitScale), fitScale));
      return;
    }

    setPan((prev) => clampPan(prev, scale));
  }, [
    clampPan,
    fitScale,
    getCenteredPan,
    scale,
    viewportSize.height,
    viewportSize.width,
    zoomMode,
  ]);

  const applyZoom = useCallback(
    (nextScale: number, anchor?: { x: number; y: number }) => {
      const clampedScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextScale));
      setZoomMode('manual');
      setZoom(clampedScale);

      setPan((prev) => {
        if (!viewportSize.width || !viewportSize.height || scale === 0) {
          return prev;
        }

        const anchorPoint = anchor ?? {
          x: viewportSize.width / 2,
          y: viewportSize.height / 2,
        };

        const canvasX = (anchorPoint.x - prev.x) / scale;
        const canvasY = (anchorPoint.y - prev.y) / scale;

        const nextPan = {
          x: anchorPoint.x - canvasX * clampedScale,
          y: anchorPoint.y - canvasY * clampedScale,
        };

        return clampPan(nextPan, clampedScale);
      });
    },
    [clampPan, scale, viewportSize.height, viewportSize.width],
  );

  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      if (zoomMode !== 'manual') return;
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (target.closest('[data-text-element]')) return;

      e.preventDefault();
      panStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
        moved: false,
      };
      setIsPanning(true);
    },
    [pan.x, pan.y, zoomMode],
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMove = (e: MouseEvent) => {
      const deltaX = e.clientX - panStateRef.current.startX;
      const deltaY = e.clientY - panStateRef.current.startY;

      if (Math.abs(deltaX) + Math.abs(deltaY) > PAN_THRESHOLD) {
        panStateRef.current.moved = true;
      }

      setPan(
        clampPan(
          {
            x: panStateRef.current.panX + deltaX,
            y: panStateRef.current.panY + deltaY,
          },
          scale,
        ),
      );
    };

    const handleUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [clampPan, isPanning, scale]);

  const zoomValue = zoomMode === 'fit' ? fitScale : zoom;

  const minimap = useMemo(() => {
    const maxSize = 120;
    const miniScale = Math.min(
      maxSize / canvasSettings.width,
      maxSize / canvasSettings.height,
    );

    const miniWidth = canvasSettings.width * miniScale;
    const miniHeight = canvasSettings.height * miniScale;

    return {
      scale: miniScale,
      width: miniWidth,
      height: miniHeight,
    };
  }, [canvasSettings.height, canvasSettings.width]);

  const viewRect = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height || scale === 0) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    const visibleWidth = Math.min(
      canvasSettings.width,
      viewportSize.width / scale,
    );
    const visibleHeight = Math.min(
      canvasSettings.height,
      viewportSize.height / scale,
    );

    const maxLeft = canvasSettings.width - visibleWidth;
    const maxTop = canvasSettings.height - visibleHeight;

    const left = Math.max(0, Math.min(maxLeft, -pan.x / scale));
    const top = Math.max(0, Math.min(maxTop, -pan.y / scale));

    return {
      left,
      top,
      width: visibleWidth,
      height: visibleHeight,
    };
  }, [
    canvasSettings.height,
    canvasSettings.width,
    pan.x,
    pan.y,
    scale,
    viewportSize.height,
    viewportSize.width,
  ]);

  const isFullView = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return true;
    if (zoomMode === 'fit') return true;

    return (
      viewRect.width >= canvasSettings.width - 1 &&
      viewRect.height >= canvasSettings.height - 1
    );
  }, [
    canvasSettings.height,
    canvasSettings.width,
    viewportSize.height,
    viewportSize.width,
    viewRect.height,
    viewRect.width,
    zoomMode,
  ]);

  const shouldShowNavigator = zoomMode === 'manual' && !isFullView;

  const handleMinimapPointer = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (zoomMode !== 'manual') return;
      if (!viewportSize.width || !viewportSize.height || scale === 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / minimap.scale;
      const y = (e.clientY - rect.top) / minimap.scale;

      const targetPan = {
        x: viewportSize.width / 2 - x * scale,
        y: viewportSize.height / 2 - y * scale,
      };

      setPan(clampPan(targetPan, scale));
    },
    [clampPan, minimap.scale, scale, viewportSize.height, viewportSize.width, zoomMode],
  );

  const backgroundStyle = useMemo(
    () => getBackgroundStyle(canvasSettings.background),
    [canvasSettings.background],
  );

  const canvasStyle: React.CSSProperties = {
    width: `${canvasSettings.width}px`,
    height: `${canvasSettings.height}px`,
    borderRadius: `${canvasSettings.borderRadius}px`,
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
    boxShadow: 'var(--canvas-shadow)',
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
    transformOrigin: '0 0',
    willChange: 'transform',
    ...backgroundStyle,
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-border/50 bg-card/70 px-4 py-2 shadow-[var(--panel-shadow-soft)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {zoomMode === 'fit' ? 'Auto-fit' : 'Zoom'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => applyZoom(scale - 0.1)}
              className="size-7 rounded-full"
              aria-label="Zoom out"
            >
              <Minus size={13} />
            </Button>
            <div className="w-28">
              <Slider
                value={[zoomValue]}
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.05}
                onValueChange={([value]) => applyZoom(value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => applyZoom(scale + 0.1)}
              className="size-7 rounded-full"
              aria-label="Zoom in"
            >
              <Plus size={13} />
            </Button>
          </div>
          <div className="rounded-full border border-border/50 bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground">
            {Math.round(scale * 100)}%
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={zoomMode === 'fit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setZoomMode('fit')}
          >
            <Maximize2 size={14} />
            Fit
          </Button>
          <Button
            variant={zoomMode === 'manual' && Math.abs(scale - 1) < 0.02 ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyZoom(1)}
          >
            100%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPan(clampPan(getCenteredPan(scale), scale))}
          >
            <LocateFixed size={14} />
            Center
          </Button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 rounded-[28px] bg-[radial-gradient(circle_at_top,oklch(0.99_0.01_85/0.9),oklch(0.96_0.02_85/0.9))] p-4 shadow-[var(--panel-shadow)]">
        <div
          ref={viewportRef}
          className={cn(
            'relative h-full w-full overflow-hidden rounded-[24px] bg-background/70',
            'bg-[radial-gradient(circle_at_1px_1px,oklch(0.35_0.02_260/0.08)_1px,transparent_0)] bg-[size:24px_24px]',
            zoomMode === 'manual'
              ? isPanning
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-default',
          )}
          onMouseDown={handlePanStart}
        >
          <div
            ref={canvasRef}
            id="text-canvas"
            style={canvasStyle}
            onClick={handleCanvasClick}
            className="relative"
          >
            {textElementIds.map((id) => (
              <TextElement
                key={id}
                elementId={id}
                canvasRef={canvasRef}
                canvasScale={scale}
              />
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

        <div
          className={cn(
            'pointer-events-none absolute bottom-4 right-4 origin-bottom-right transition-all duration-200',
            shouldShowNavigator ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          )}
          aria-hidden={!shouldShowNavigator}
        >
          <div className="pointer-events-auto rounded-2xl bg-card/85 p-3 shadow-[var(--panel-shadow)] ring-1 ring-border/40 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Navigator
              </p>
              <span className="text-[10px] font-medium text-muted-foreground">
                {Math.round(scale * 100)}%
              </span>
            </div>
            <div
              className="relative mt-2 overflow-hidden rounded-xl ring-1 ring-border/40"
              style={{ width: minimap.width, height: minimap.height }}
              onMouseDown={handleMinimapPointer}
            >
              <div
                className="absolute inset-0"
                style={{
                  ...backgroundStyle,
                  borderRadius: `${canvasSettings.borderRadius * minimap.scale}px`,
                }}
              />
              <div
                className="absolute border border-primary/80 bg-primary/10"
                style={{
                  left: viewRect.left * minimap.scale,
                  top: viewRect.top * minimap.scale,
                  width: viewRect.width * minimap.scale,
                  height: viewRect.height * minimap.scale,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Click to pan view
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

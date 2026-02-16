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

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName.toLowerCase();
  return (
    element.isContentEditable ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    Boolean(element.closest('[contenteditable="true"]'))
  );
};

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
  const [manualPan, setManualPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

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

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      if (panStateRef.current.moved) {
        panStateRef.current.moved = false;
        return;
      }

      if (event.target === canvasRef.current) {
        selectElement(null);
      }
    },
    [selectElement],
  );

  const getPatternStyle = useCallback(
    (
      pattern: Extract<BackgroundConfig, { type: 'pattern' }>,
    ): React.CSSProperties => {
      const {
        patternId,
        primaryColor,
        backgroundColor,
        opacity,
        size,
        spacing,
      } = pattern;
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
    },
    [],
  );

  const getBackgroundStyle = useCallback(
    (background: BackgroundConfig): React.CSSProperties => {
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
    },
    [getPatternStyle],
  );

  const fitScale = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return 1;

    const scale = Math.min(
      viewportSize.width / canvasSettings.width,
      viewportSize.height / canvasSettings.height,
    );

    return Math.min(scale, 1);
  }, [
    canvasSettings.height,
    canvasSettings.width,
    viewportSize.height,
    viewportSize.width,
  ]);

  const scale = zoomMode === 'fit' ? fitScale : zoom;

  const clampPan = useCallback(
    (nextPan: { x: number; y: number }, nextScale: number) => {
      if (!viewportSize.width || !viewportSize.height) return nextPan;

      const scaledWidth = canvasSettings.width * nextScale;
      const scaledHeight = canvasSettings.height * nextScale;

      const centerX = (viewportSize.width - scaledWidth) / 2;
      const centerY = (viewportSize.height - scaledHeight) / 2;

      const minX =
        scaledWidth >= viewportSize.width
          ? viewportSize.width - scaledWidth
          : centerX;
      const maxX = scaledWidth >= viewportSize.width ? 0 : centerX;
      const minY =
        scaledHeight >= viewportSize.height
          ? viewportSize.height - scaledHeight
          : centerY;
      const maxY = scaledHeight >= viewportSize.height ? 0 : centerY;

      return {
        x: Math.min(maxX, Math.max(minX, nextPan.x)),
        y: Math.min(maxY, Math.max(minY, nextPan.y)),
      };
    },
    [
      canvasSettings.height,
      canvasSettings.width,
      viewportSize.height,
      viewportSize.width,
    ],
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
    [
      canvasSettings.height,
      canvasSettings.width,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const resolvedPan = useMemo(() => {
    if (zoomMode === 'fit') {
      return clampPan(getCenteredPan(fitScale), fitScale);
    }

    return clampPan(manualPan, scale);
  }, [clampPan, fitScale, getCenteredPan, manualPan, scale, zoomMode]);

  const applyZoom = useCallback(
    (nextScale: number, anchor?: { x: number; y: number }) => {
      const clampedScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextScale));
      setZoomMode('manual');
      setZoom(clampedScale);

      setManualPan((prev) => {
        if (!viewportSize.width || !viewportSize.height || scale === 0) {
          return prev;
        }

        const currentPan =
          zoomMode === 'fit'
            ? clampPan(getCenteredPan(scale), scale)
            : clampPan(prev, scale);

        const anchorPoint = anchor ?? {
          x: viewportSize.width / 2,
          y: viewportSize.height / 2,
        };

        const canvasX = (anchorPoint.x - currentPan.x) / scale;
        const canvasY = (anchorPoint.y - currentPan.y) / scale;

        const nextPan = {
          x: anchorPoint.x - canvasX * clampedScale,
          y: anchorPoint.y - canvasY * clampedScale,
        };

        return clampPan(nextPan, clampedScale);
      });
    },
    [
      clampPan,
      getCenteredPan,
      scale,
      viewportSize.height,
      viewportSize.width,
      zoomMode,
    ],
  );

  const handlePanStart = useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 0 && event.button !== 1) return;

      const target = event.target as HTMLElement;
      const onTextElement = Boolean(target.closest('[data-text-element]'));
      const startWithHandTool = event.button === 1 || isSpacePressed;

      if (onTextElement && !startWithHandTool) return;

      event.preventDefault();

      if (zoomMode === 'fit') {
        setZoomMode('manual');
        setZoom(fitScale);
      }

      panStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        panX: resolvedPan.x,
        panY: resolvedPan.y,
        moved: false,
      };

      setIsPanning(true);
    },
    [fitScale, isSpacePressed, resolvedPan.x, resolvedPan.y, zoomMode],
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMove = (event: MouseEvent) => {
      const deltaX = event.clientX - panStateRef.current.startX;
      const deltaY = event.clientY - panStateRef.current.startY;

      if (Math.abs(deltaX) + Math.abs(deltaY) > PAN_THRESHOLD) {
        panStateRef.current.moved = true;
      }

      setManualPan(
        clampPan(
          {
            x: panStateRef.current.panX + deltaX,
            y: panStateRef.current.panY + deltaY,
          },
          scale,
        ),
      );
    };

    const handleUp = () => setIsPanning(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [clampPan, isPanning, scale]);

  useEffect(() => {
    const preventBrowserZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener('wheel', preventBrowserZoom, { passive: false });
    window.addEventListener('gesturestart', preventGestureZoom);
    window.addEventListener('gesturechange', preventGestureZoom);

    return () => {
      window.removeEventListener('wheel', preventBrowserZoom);
      window.removeEventListener('gesturestart', preventGestureZoom);
      window.removeEventListener('gesturechange', preventGestureZoom);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setIsSpacePressed(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!viewportRef.current) return;

      const shouldZoom = event.ctrlKey || event.metaKey;
      if (shouldZoom) {
        event.preventDefault();
        const rect = viewportRef.current.getBoundingClientRect();
        const anchor = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        const delta = event.deltaY < 0 ? 1.08 : 0.92;
        applyZoom(scale * delta, anchor);
        return;
      }

      if (zoomMode !== 'manual') return;
      event.preventDefault();

      setManualPan((prev) =>
        clampPan(
          {
            x: prev.x - event.deltaX,
            y: prev.y - event.deltaY,
          },
          scale,
        ),
      );
    },
    [applyZoom, clampPan, scale, zoomMode],
  );

  const zoomValue = zoomMode === 'fit' ? fitScale : zoom;
  const roundedZoomPercent = Math.round(scale * 100);

  const minimap = useMemo(() => {
    const maxSize = 120;
    const miniScale = Math.min(
      maxSize / canvasSettings.width,
      maxSize / canvasSettings.height,
    );

    return {
      scale: miniScale,
      width: canvasSettings.width * miniScale,
      height: canvasSettings.height * miniScale,
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

    return {
      left: Math.max(0, Math.min(maxLeft, -resolvedPan.x / scale)),
      top: Math.max(0, Math.min(maxTop, -resolvedPan.y / scale)),
      width: visibleWidth,
      height: visibleHeight,
    };
  }, [
    canvasSettings.height,
    canvasSettings.width,
    resolvedPan.x,
    resolvedPan.y,
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

  const panToMinimapPoint = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      if (!viewportSize.width || !viewportSize.height || scale === 0) return;

      const x = (clientX - rect.left) / minimap.scale;
      const y = (clientY - rect.top) / minimap.scale;
      const targetPan = {
        x: viewportSize.width / 2 - x * scale,
        y: viewportSize.height / 2 - y * scale,
      };

      setManualPan(clampPan(targetPan, scale));
    },
    [clampPan, minimap.scale, scale, viewportSize.height, viewportSize.width],
  );

  const handleMinimapPointerDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (zoomMode !== 'manual') return;
      event.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      panToMinimapPoint(event.clientX, event.clientY, rect);

      const handleMove = (moveEvent: MouseEvent) => {
        panToMinimapPoint(moveEvent.clientX, moveEvent.clientY, rect);
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [panToMinimapPoint, zoomMode],
  );

  const backgroundStyle = useMemo(
    () => getBackgroundStyle(canvasSettings.background),
    [canvasSettings.background, getBackgroundStyle],
  );

  const canvasStyle = useMemo<React.CSSProperties>(
    () => ({
      width: `${canvasSettings.width}px`,
      height: `${canvasSettings.height}px`,
      borderRadius: `${canvasSettings.borderRadius}px`,
      position: 'absolute',
      left: 0,
      top: 0,
      overflow: 'hidden',
      boxShadow: '0 24px 60px oklch(0 0 0 / 0.22)',
      transform: `translate(${resolvedPan.x}px, ${resolvedPan.y}px) scale(${scale})`,
      transformOrigin: '0 0',
      willChange: 'transform',
      ...backgroundStyle,
    }),
    [
      backgroundStyle,
      canvasSettings.borderRadius,
      canvasSettings.height,
      canvasSettings.width,
      resolvedPan.x,
      resolvedPan.y,
      scale,
    ],
  );

  return (
    <div className="relative h-full min-h-0">
      <div className="absolute inset-0">
        <div
          ref={viewportRef}
          className={cn(
            'relative h-full w-full overflow-hidden',
            'bg-[radial-gradient(circle_at_15%_20%,oklch(0.9_0.01_85/0.85),oklch(0.86_0.01_85/0.96))]',
            'shadow-(--panel-shadow-soft)',
            isPanning ? 'cursor-grabbing' : 'cursor-grab',
          )}
          onMouseDown={handlePanStart}
          onWheel={handleWheel}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,oklch(0.28_0.02_250/0.14)_1px,transparent_0)] bg-size-[26px_26px]" />

          <div
            ref={canvasRef}
            id="text-canvas"
            style={canvasStyle}
            onClick={handleCanvasClick}
            className="relative ml-40"
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
                <div className="bg-background/78 rounded-xl px-5 py-4 text-center shadow-sm backdrop-blur">
                  <p className="text-foreground text-sm font-semibold">
                    Add a text layer to start
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Zoom with pinch or Ctrl + wheel. Hold Space and drag to pan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-6 bottom-6 z-20 flex flex-col items-end gap-2">
        {shouldShowNavigator && (
          <div className="bg-card/86 pointer-events-auto rounded-xl p-2 shadow-[var(--panel-shadow-soft)] backdrop-blur">
            <div
              className="relative overflow-hidden rounded-lg"
              style={{ width: minimap.width, height: minimap.height }}
              onMouseDown={handleMinimapPointerDown}
            >
              <div
                className="absolute inset-0"
                style={{
                  ...backgroundStyle,
                  borderRadius: `${canvasSettings.borderRadius * minimap.scale}px`,
                }}
              />
              <div
                className="border-primary/85 bg-primary/15 absolute border"
                style={{
                  left: viewRect.left * minimap.scale,
                  top: viewRect.top * minimap.scale,
                  width: viewRect.width * minimap.scale,
                  height: viewRect.height * minimap.scale,
                }}
              />
            </div>
          </div>
        )}

        <div className="bg-card/88 pointer-events-auto w-[302px] max-w-[calc(100vw-2.5rem)] rounded-xl p-2.5 shadow-[var(--panel-shadow)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => applyZoom(scale - 0.1)}
              className="size-8 rounded-full"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus size={14} />
            </Button>
            <div className="flex-1">
              <Slider
                value={[zoomValue]}
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.05}
                onValueChange={([value]) => applyZoom(value)}
                aria-label="Zoom level"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => applyZoom(scale + 0.1)}
              className="size-8 rounded-full"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus size={14} />
            </Button>
            <span className="text-foreground min-w-11 text-right text-xs font-semibold">
              {roundedZoomPercent}%
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <Button
              variant={zoomMode === 'fit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoomMode('fit')}
              className="h-8"
              title="Fit canvas to viewport"
            >
              <Maximize2 size={13} />
              Fit
            </Button>
            <Button
              variant={
                zoomMode === 'manual' && Math.abs(scale - 1) < 0.02
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() => applyZoom(1)}
              className="h-8"
              title="Reset zoom to 100%"
            >
              100%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setManualPan(clampPan(getCenteredPan(scale), scale))
              }
              className="h-8"
              title="Center canvas"
            >
              <LocateFixed size={13} />
              Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

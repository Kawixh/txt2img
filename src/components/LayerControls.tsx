'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  ArrowUp,
  Circle,
  Diamond,
  Hexagon,
  ImageIcon,
  Layers2,
  Square,
  Star,
  Trash2,
  Triangle,
} from 'lucide-react';
import { memo, useMemo } from 'react';

type TextLayerSnapshot = {
  id: string;
  content: string;
  fontFamily: string;
  fontSize: number;
};

type GraphicLayerSnapshot = {
  id: string;
  type: 'shape' | 'image';
  label: string;
  meta: string;
  shape?: 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'hexagon' | 'star';
};

const shallowTextLayerArrayEqual = (a: TextLayerSnapshot[], b: TextLayerSnapshot[]) =>
  a.length === b.length &&
  a.every((layer, index) => {
    const next = b[index];
    return (
      layer.id === next.id &&
      layer.content === next.content &&
      layer.fontFamily === next.fontFamily &&
      layer.fontSize === next.fontSize
    );
  });

const shallowGraphicLayerArrayEqual = (
  a: GraphicLayerSnapshot[],
  b: GraphicLayerSnapshot[],
) =>
  a.length === b.length &&
  a.every((layer, index) => {
    const next = b[index];
    return (
      layer.id === next.id &&
      layer.type === next.type &&
      layer.label === next.label &&
      layer.meta === next.meta &&
      layer.shape === next.shape
    );
  });

function LayerControlsComponent() {
  const {
    reorderTextElement,
    reorderGraphicLayer,
    removeTextElement,
    removeShapeElement,
    removeImageElement,
    selectElement,
    updateTextElement,
  } = useAppActions();

  const textLayers = useAppStore(
    (state) =>
      state.textElements.map((element) => ({
        id: element.id,
        content: element.content,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
      })),
    shallowTextLayerArrayEqual,
  );
  const graphicLayers = useAppStore(
    (state) => {
      const shapeById = new Map(
        state.shapeElements.map((element) => [element.id, element]),
      );
      const imageById = new Map(
        state.imageElements.map((element) => [element.id, element]),
      );
      const validIdSet = new Set([...shapeById.keys(), ...imageById.keys()]);
      const orderedIds = state.graphicLayerOrder.filter((id) => validIdSet.has(id));
      const orderedIdSet = new Set(orderedIds);
      const missingIds = [
        ...state.shapeElements.map((element) => element.id),
        ...state.imageElements.map((element) => element.id),
      ].filter((id) => !orderedIdSet.has(id));

      return [...orderedIds, ...missingIds]
        .map((id) => {
          const shape = shapeById.get(id);
          if (shape) {
            return {
              id: shape.id,
              type: 'shape' as const,
              shape: shape.shape,
              label: `${shape.shape[0].toUpperCase()}${shape.shape.slice(1)} shape`,
              meta: `${Math.round(shape.width)}x${Math.round(shape.height)}`,
            };
          }

          const image = imageById.get(id);
          if (!image) return null;

          return {
            id: image.id,
            type: 'image' as const,
            label: image.name || 'Image layer',
            meta: image.mimeType.replace('image/', '').toUpperCase(),
          };
        })
        .filter(Boolean) as GraphicLayerSnapshot[];
    },
    shallowGraphicLayerArrayEqual,
  );
  const selectedElementId = useAppStore((state) => state.selectedElementId);

  const orderedTextLayers = useMemo(() => [...textLayers].reverse(), [textLayers]);
  const orderedGraphicLayers = useMemo(
    () => [...graphicLayers].reverse(),
    [graphicLayers],
  );
  const graphicLayerIndexById = useMemo(
    () => new Map(graphicLayers.map((layer, index) => [layer.id, index])),
    [graphicLayers],
  );
  const layerIndexById = useMemo(
    () => new Map(textLayers.map((layer, index) => [layer.id, index])),
    [textLayers],
  );
  const selectedTextLayer = useMemo(
    () => textLayers.find((layer) => layer.id === selectedElementId) ?? null,
    [textLayers, selectedElementId],
  );
  const totalLayers = textLayers.length + graphicLayers.length;

  if (totalLayers === 0) {
    return (
      <div className="text-muted-foreground rounded-2xl border border-dashed border-border/70 bg-muted/35 p-6 text-center text-sm">
        Add text, shapes, or images to start your layer stack.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {textLayers.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            Text Layers
          </p>
          <div className="space-y-2">
            {orderedTextLayers.map((layer) => {
              const originalIndex = layerIndexById.get(layer.id) ?? 0;
              const canMoveForward = originalIndex < textLayers.length - 1;
              const canMoveBackward = originalIndex > 0;
              const isSelected = selectedElementId === layer.id;

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-xl border px-2 py-2 transition-colors',
                    isSelected
                      ? 'border-primary/35 bg-primary/10'
                      : 'border-border/60 bg-background/55 hover:bg-muted/45',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectElement(layer.id)}
                    className="min-w-0 flex-1 text-left"
                    title="Select this layer"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {layer.content.trim() || 'Untitled layer'}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {layer.fontFamily}, {Math.round(layer.fontSize)}px
                    </p>
                  </button>

                  <div className="flex items-center gap-1 opacity-85 transition group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => reorderTextElement(layer.id, originalIndex + 1)}
                      disabled={!canMoveForward}
                      title="Move layer forward"
                      aria-label="Move layer forward"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => reorderTextElement(layer.id, originalIndex - 1)}
                      disabled={!canMoveBackward}
                      title="Move layer backward"
                      aria-label="Move layer backward"
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 hover:text-destructive"
                      onClick={() => removeTextElement(layer.id)}
                      title="Delete layer"
                      aria-label="Delete layer"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {graphicLayers.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            Graphic Layers
          </p>
          <div className="space-y-2">
            {orderedGraphicLayers.map((layer) => {
              const originalIndex = graphicLayerIndexById.get(layer.id) ?? 0;
              const canMoveForward = originalIndex < graphicLayers.length - 1;
              const canMoveBackward = originalIndex > 0;
              const isSelected = selectedElementId === layer.id;
              const Icon =
                layer.type === 'image'
                  ? ImageIcon
                  : layer.shape === 'diamond'
                    ? Diamond
                    : layer.shape === 'hexagon'
                      ? Hexagon
                      : layer.shape === 'star'
                        ? Star
                        : layer.shape === 'circle'
                          ? Circle
                          : layer.shape === 'triangle'
                            ? Triangle
                            : Square;

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-xl border px-2 py-2 transition-colors',
                    isSelected
                      ? 'border-primary/35 bg-primary/10'
                      : 'border-border/60 bg-background/55 hover:bg-muted/45',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectElement(layer.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    title="Select this layer"
                  >
                    <span className="text-muted-foreground rounded-md border border-border/60 bg-background p-1">
                      <Icon size={12} />
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {layer.label}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {layer.meta}
                      </p>
                    </span>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => reorderGraphicLayer(layer.id, originalIndex + 1)}
                    disabled={!canMoveForward}
                    title="Move layer forward"
                    aria-label="Move layer forward"
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => reorderGraphicLayer(layer.id, originalIndex - 1)}
                    disabled={!canMoveBackward}
                    title="Move layer backward"
                    aria-label="Move layer backward"
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 hover:text-destructive"
                    onClick={() =>
                      layer.type === 'image'
                        ? removeImageElement(layer.id)
                        : removeShapeElement(layer.id)
                    }
                    title="Delete layer"
                    aria-label="Delete layer"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTextLayer && (
        <div className="space-y-2">
          <Label htmlFor="selected-layer-text" className="flex items-center gap-2">
            <Layers2 className="h-3.5 w-3.5" />
            Edit Selected Text
          </Label>
          <textarea
            id="selected-layer-text"
            value={selectedTextLayer.content}
            onChange={(event) =>
              updateTextElement(selectedTextLayer.id, {
                content: event.target.value,
              })
            }
            rows={3}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 flex w-full resize-y rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2"
            placeholder="Edit selected text content..."
          />
        </div>
      )}
    </div>
  );
}

export const LayerControls = memo(LayerControlsComponent);

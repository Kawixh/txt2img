'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Layers2, Trash2 } from 'lucide-react';
import { memo, useMemo } from 'react';

type LayerSnapshot = {
  id: string;
  content: string;
  fontFamily: string;
  fontSize: number;
};

const shallowLayerArrayEqual = (a: LayerSnapshot[], b: LayerSnapshot[]) =>
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

function LayerControlsComponent() {
  const { reorderTextElement, removeTextElement, selectElement, updateTextElement } =
    useAppActions();

  const layers = useAppStore(
    (state) =>
      state.textElements.map((element) => ({
        id: element.id,
        content: element.content,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
      })),
    shallowLayerArrayEqual,
  );
  const selectedElementId = useAppStore((state) => state.selectedElementId);

  const orderedForPanel = useMemo(() => [...layers].reverse(), [layers]);
  const layerIndexById = useMemo(
    () => new Map(layers.map((layer, index) => [layer.id, index])),
    [layers],
  );
  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedElementId) ?? null,
    [layers, selectedElementId],
  );

  if (layers.length === 0) {
    return (
      <div className="text-muted-foreground rounded-2xl border border-dashed border-border/70 bg-muted/35 p-6 text-center text-sm">
        Add text to start building your layer stack.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
          Layer Stack
        </p>
        <div className="space-y-2">
          {orderedForPanel.map((layer) => {
            const originalIndex = layerIndexById.get(layer.id) ?? 0;
            const canMoveForward = originalIndex < layers.length - 1;
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
                    {layer.fontFamily} · {Math.round(layer.fontSize)}px
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

      {selectedLayer && (
        <div className="space-y-2">
          <Label htmlFor="selected-layer-text" className="flex items-center gap-2">
            <Layers2 className="h-3.5 w-3.5" />
            Edit Selected Text
          </Label>
          <textarea
            id="selected-layer-text"
            value={selectedLayer.content}
            onChange={(event) =>
              updateTextElement(selectedLayer.id, {
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

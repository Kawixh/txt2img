'use client';

import React from 'react';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { PositionPreset, TextElement as TextElementType } from '@/types';
import { getPresetGrid } from '@/lib/positioning';

export function PositionControls() {
  const { updateTextElement } = useAppActions();
  const canvasSettings = useAppStore((state) => state.canvasSettings);
  const selectedElement = useAppStore((state) => {
    if (!state.selectedElementId) return null;
    return (
      state.textElements.find((element) => element.id === state.selectedElementId) ||
      null
    );
  });

  if (!selectedElement) {
    return (
      <div className="text-muted-foreground rounded-2xl border border-dashed border-border/80 bg-muted/40 py-8 text-center text-sm">
        Select a text element to edit its position and size.
      </div>
    );
  }

  const updateSelectedElement = (updates: Partial<TextElementType>) => {
    updateTextElement(selectedElement.id, updates);
  };

  const presetGrid = getPresetGrid();

  const handlePresetChange = (preset: PositionPreset) => {
    updateSelectedElement({
      positionPreset: preset,
      paddingX: preset === 'manual' ? selectedElement.paddingX : 0,
      paddingY: preset === 'manual' ? selectedElement.paddingY : 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Width: {selectedElement.width}px</Label>
          <Input
            type="number"
            value={selectedElement.width}
            onChange={(e) =>
              updateSelectedElement({
                width: parseInt(e.target.value) || 100,
              })
            }
            className="h-8 w-20 text-xs"
            min={50}
            max={800}
          />
        </div>
        <Slider
          value={[selectedElement.width]}
          onValueChange={([value]) => updateSelectedElement({ width: value })}
          min={50}
          max={800}
          step={10}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Word Wrap</Label>
        <Button
          variant={selectedElement.wordWrap ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            updateSelectedElement({ wordWrap: !selectedElement.wordWrap })
          }
          className="flex w-full items-center gap-2"
        >
          {selectedElement.wordWrap ? (
            <ToggleRight size={16} />
          ) : (
            <ToggleLeft size={16} />
          )}
          {selectedElement.wordWrap ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Position Preset</Label>
        <div className="space-y-2">
          <Button
            variant={
              selectedElement.positionPreset === 'manual'
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() => handlePresetChange('manual')}
            className="w-full"
          >
            Manual Positioning
          </Button>

          <div className="grid grid-cols-3 gap-1 rounded-xl border border-border/70 bg-muted/40 p-2">
            {presetGrid.map((row) =>
              row.map((preset) => (
                <Button
                  key={preset.id}
                  variant={
                    selectedElement.positionPreset === preset.id
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => handlePresetChange(preset.id)}
                  className="aspect-square p-1 text-lg"
                  title={preset.description}
                >
                  {preset.icon}
                </Button>
              )),
            )}
          </div>
        </div>
      </div>

      {selectedElement.positionPreset !== 'manual' && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Fine-tune Position</Label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Horizontal Offset: {selectedElement.paddingX}px
              </Label>
              <Input
                type="number"
                value={selectedElement.paddingX}
                onChange={(e) =>
                  updateSelectedElement({
                    paddingX: parseInt(e.target.value) || 0,
                  })
                }
                className="h-6 w-16 text-xs"
                min={-200}
                max={200}
              />
            </div>
            <Slider
              value={[selectedElement.paddingX]}
              onValueChange={([value]) =>
                updateSelectedElement({ paddingX: value })
              }
              min={-200}
              max={200}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Vertical Offset: {selectedElement.paddingY}px
              </Label>
              <Input
                type="number"
                value={selectedElement.paddingY}
                onChange={(e) =>
                  updateSelectedElement({
                    paddingY: parseInt(e.target.value) || 0,
                  })
                }
                className="h-6 w-16 text-xs"
                min={-200}
                max={200}
              />
            </div>
            <Slider
              value={[selectedElement.paddingY]}
              onValueChange={([value]) =>
                updateSelectedElement({ paddingY: value })
              }
              min={-200}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      )}

      {selectedElement.positionPreset === 'manual' && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Manual Position</Label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                X Position: {selectedElement.x}px
              </Label>
              <Input
                type="number"
                value={selectedElement.x}
                onChange={(e) =>
                  updateSelectedElement({ x: parseInt(e.target.value) || 0 })
                }
                className="h-6 w-16 text-xs"
                min={0}
                max={canvasSettings.width}
              />
            </div>
            <Slider
              value={[selectedElement.x]}
              onValueChange={([value]) => updateSelectedElement({ x: value })}
              min={0}
              max={canvasSettings.width}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Y Position: {selectedElement.y}px
              </Label>
              <Input
                type="number"
                value={selectedElement.y}
                onChange={(e) =>
                  updateSelectedElement({ y: parseInt(e.target.value) || 0 })
                }
                className="h-6 w-16 text-xs"
                min={0}
                max={canvasSettings.height}
              />
            </div>
            <Slider
              value={[selectedElement.y]}
              onValueChange={([value]) => updateSelectedElement({ y: value })}
              min={0}
              max={canvasSettings.height}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

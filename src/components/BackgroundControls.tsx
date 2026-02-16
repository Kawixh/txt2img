'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { PATTERN_DEFINITIONS, getPatternById } from '@/lib/patterns';
import { BackgroundType } from '@/types';
import { useMemo } from 'react';

const CANVAS_TEMPLATES = [
  { id: 'post-square', label: 'Square Post', width: 1080, height: 1080 },
  { id: 'story', label: 'Story', width: 1080, height: 1920 },
  { id: 'landscape', label: 'Landscape', width: 1600, height: 900 },
  { id: 'portrait', label: 'Portrait', width: 1200, height: 1500 },
  { id: 'banner', label: 'Banner', width: 1920, height: 1080 },
  { id: 'phone', label: 'Phone', width: 1170, height: 2532 },
] as const;

export function BackgroundControls() {
  const { updateBackground, updateCanvasSettings } = useAppActions();
  const canvasSettings = useAppStore((state) => state.canvasSettings);
  const { background, borderRadius } = canvasSettings;
  const activeTemplate = useMemo(
    () =>
      CANVAS_TEMPLATES.find(
        (template) =>
          template.width === canvasSettings.width &&
          template.height === canvasSettings.height,
      ) ?? null,
    [canvasSettings.height, canvasSettings.width],
  );

  const handleBackgroundTypeChange = (type: BackgroundType) => {
    switch (type) {
      case 'solid':
        updateBackground({ type: 'solid', color: '#ffffff' });
        break;
      case 'transparent':
        updateBackground({ type: 'transparent' });
        break;
      case 'pattern':
        updateBackground({
          type: 'pattern',
          patternId: 'dots',
          primaryColor: '#0f172a',
          backgroundColor: '#ffffff',
          opacity: 0.2,
          size: 18,
          spacing: 8,
        });
        break;
      case 'gradient':
        updateBackground({ type: 'solid', color: '#ffffff' });
        break;
    }
  };

  const renderBackgroundOptions = () => {
    switch (background.type) {
      case 'solid':
      case 'gradient':
        return (
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="bg-color"
                type="color"
                value={'color' in background ? background.color : '#ffffff'}
                onChange={(e) =>
                  updateBackground({ type: 'solid', color: e.target.value })
                }
                className="h-10 w-12 rounded border p-1"
              />
              <Input
                value={'color' in background ? background.color : '#ffffff'}
                onChange={(e) =>
                  updateBackground({ type: 'solid', color: e.target.value })
                }
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
        );

      case 'pattern': {
        const selectedPattern = getPatternById(background.patternId);
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pattern Type</Label>
              <Select
                value={background.patternId}
                onValueChange={(value: string) =>
                  updateBackground({
                    ...background,
                    patternId: value,
                    opacity: 0.2,
                    size: 18,
                    spacing: 8,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATTERN_DEFINITIONS.map((pattern) => (
                    <SelectItem key={pattern.id} value={pattern.id}>
                      <div className="flex flex-col">
                        <span>{pattern.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {pattern.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern-bg-color">Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pattern-bg-color"
                  type="color"
                  value={background.backgroundColor}
                  onChange={(e) =>
                    updateBackground({
                      ...background,
                      backgroundColor: e.target.value,
                    })
                  }
                  className="h-10 w-12 rounded border p-1"
                />
                <Input
                  value={background.backgroundColor}
                  onChange={(e) =>
                    updateBackground({
                      ...background,
                      backgroundColor: e.target.value,
                    })
                  }
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern-color">Pattern Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pattern-color"
                  type="color"
                  value={background.primaryColor}
                  onChange={(e) =>
                    updateBackground({
                      ...background,
                      primaryColor: e.target.value,
                    })
                  }
                  className="h-10 w-12 rounded border p-1"
                />
                <Input
                  value={background.primaryColor}
                  onChange={(e) =>
                    updateBackground({
                      ...background,
                      primaryColor: e.target.value,
                    })
                  }
                  placeholder="#0f172a"
                  className="flex-1"
                />
              </div>
            </div>

            {selectedPattern?.customizableParams.opacity && (
              <div className="space-y-2">
                <Label>Opacity: {Math.round(background.opacity * 100)}%</Label>
                <Slider
                  value={[background.opacity]}
                  onValueChange={([value]) =>
                    updateBackground({ ...background, opacity: value })
                  }
                  min={0.05}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>
            )}

            {selectedPattern?.customizableParams.size && (
              <div className="space-y-2">
                <Label>Size: {background.size}px</Label>
                <Slider
                  value={[background.size]}
                  onValueChange={([value]) =>
                    updateBackground({ ...background, size: value })
                  }
                  min={6}
                  max={120}
                  step={2}
                  className="w-full"
                />
              </div>
            )}

            {selectedPattern?.customizableParams.spacing && (
              <div className="space-y-2">
                <Label>Spacing: {background.spacing}px</Label>
                <Slider
                  value={[background.spacing]}
                  onValueChange={([value]) =>
                    updateBackground({ ...background, spacing: value })
                  }
                  min={0}
                  max={50}
                  step={2}
                  className="w-full"
                />
              </div>
            )}
          </div>
        );
      }

      case 'transparent':
        return (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 p-4 text-sm text-muted-foreground">
            Transparency shows a subtle checkerboard behind the canvas.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Background Type</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={background.type === 'solid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleBackgroundTypeChange('solid')}
            title="Use a single background color"
          >
            Solid
          </Button>
          <Button
            variant={background.type === 'transparent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleBackgroundTypeChange('transparent')}
            title="Transparent background for overlays"
          >
            Transparent
          </Button>
          <Button
            variant={background.type === 'pattern' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleBackgroundTypeChange('pattern')}
            title="Apply a repeating visual pattern"
          >
            Pattern
          </Button>
        </div>
      </div>

      {renderBackgroundOptions()}

      <div className="space-y-2">
        <Label>Border Radius: {borderRadius}px</Label>
        <Slider
          value={[borderRadius]}
          onValueChange={([value]) => updateCanvasSettings({ borderRadius: value })}
          min={0}
          max={60}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <Label>Canvas Size</Label>
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Pick a template or set custom dimensions.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CANVAS_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={activeTemplate?.id === template.id ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  updateCanvasSettings({
                    width: template.width,
                    height: template.height,
                  })
                }
                className="justify-start"
                title={`${template.label}: ${template.width} × ${template.height}`}
              >
                <span className="truncate">
                  {template.label} · {template.width}×{template.height}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="canvas-width" className="text-xs">
              Width
            </Label>
            <Input
              id="canvas-width"
              type="number"
              value={canvasSettings.width}
              onChange={(e) =>
                updateCanvasSettings({
                  width: parseInt(e.target.value) || 800,
                })
              }
              min={100}
              max={5000}
              title="Custom canvas width in pixels"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="canvas-height" className="text-xs">
              Height
            </Label>
            <Input
              id="canvas-height"
              type="number"
              value={canvasSettings.height}
              onChange={(e) =>
                updateCanvasSettings({
                  height: parseInt(e.target.value) || 600,
                })
              }
              min={100}
              max={5000}
              title="Custom canvas height in pixels"
            />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Current size: {canvasSettings.width} × {canvasSettings.height}
          {activeTemplate ? ` (${activeTemplate.label})` : ' (Custom)'}
        </p>
      </div>
    </div>
  );
}

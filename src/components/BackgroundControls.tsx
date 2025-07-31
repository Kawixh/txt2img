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
import { useApp } from '@/contexts/AppContext';
import { PATTERN_DEFINITIONS, getPatternById } from '@/lib/patterns';
import { BackgroundType } from '@/types';
import { Palette } from 'lucide-react';

const GRADIENT_DIRECTIONS = [
  { value: 'to-r', label: 'Right' },
  { value: 'to-br', label: 'Bottom Right' },
  { value: 'to-b', label: 'Bottom' },
  { value: 'to-bl', label: 'Bottom Left' },
  { value: 'to-l', label: 'Left' },
  { value: 'to-tl', label: 'Top Left' },
  { value: 'to-t', label: 'Top' },
  { value: 'to-tr', label: 'Top Right' },
] as const;

export function BackgroundControls() {
  const { state, updateBackground, updateCanvasSettings } = useApp();
  const { background, borderRadius } = state.canvasSettings;

  const handleBackgroundTypeChange = (type: BackgroundType) => {
    switch (type) {
      case 'solid':
        updateBackground({ type: 'solid', color: '#ffffff' });
        break;
      case 'transparent':
        updateBackground({ type: 'transparent' });
        break;
      case 'gradient':
        updateBackground({
          type: 'gradient',
          direction: 'to-r',
          from: '#3b82f6',
          to: '#8b5cf6',
        });
        break;
      case 'pattern':
        updateBackground({
          type: 'pattern',
          patternId: 'dots',
          primaryColor: '#333333',
          backgroundColor: '#ffffff',
          opacity: 1,
          size: 20,
          spacing: 10,
        });
        break;
    }
  };

  const renderBackgroundOptions = () => {
    switch (background.type) {
      case 'solid':
        return (
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="bg-color"
                type="color"
                value={background.color}
                onChange={(e) =>
                  updateBackground({ ...background, color: e.target.value })
                }
                className="h-10 w-12 rounded border p-1"
              />
              <Input
                value={background.color}
                onChange={(e) =>
                  updateBackground({ ...background, color: e.target.value })
                }
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
        );

      case 'gradient':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gradient Direction</Label>
              <Select
                value={background.direction}
                onValueChange={(value: string) =>
                  updateBackground({
                    ...background,
                    direction: value as
                      | 'to-r'
                      | 'to-br'
                      | 'to-b'
                      | 'to-bl'
                      | 'to-l'
                      | 'to-tl'
                      | 'to-t'
                      | 'to-tr',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADIENT_DIRECTIONS.map((dir) => (
                    <SelectItem key={dir.value} value={dir.value}>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradient-from">From Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gradient-from"
                  type="color"
                  value={background.from}
                  onChange={(e) =>
                    updateBackground({ ...background, from: e.target.value })
                  }
                  className="h-10 w-12 rounded border p-1"
                />
                <Input
                  value={background.from}
                  onChange={(e) =>
                    updateBackground({ ...background, from: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradient-to">To Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gradient-to"
                  type="color"
                  value={background.to}
                  onChange={(e) =>
                    updateBackground({ ...background, to: e.target.value })
                  }
                  className="h-10 w-12 rounded border p-1"
                />
                <Input
                  value={background.to}
                  onChange={(e) =>
                    updateBackground({ ...background, to: e.target.value })
                  }
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradient-via">Via Color (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gradient-via"
                  type="color"
                  value={background.via || '#ffffff'}
                  onChange={(e) =>
                    updateBackground({ ...background, via: e.target.value })
                  }
                  className="h-10 w-12 rounded border p-1"
                />
                <Input
                  value={background.via || ''}
                  onChange={(e) =>
                    updateBackground({
                      ...background,
                      via: e.target.value || undefined,
                    })
                  }
                  placeholder="Optional middle color"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        );

      case 'pattern':
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
                    // Reset to defaults when pattern changes
                    opacity: 1,
                    size: 20,
                    spacing: 10,
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
                        <span className="text-xs text-gray-500">
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
                  placeholder="#333333"
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
                  min={0.1}
                  max={1}
                  step={0.1}
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
                  min={5}
                  max={100}
                  step={5}
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

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
        {/* Background Type */}
        <div className="space-y-2">
          <Label>Background Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={background.type === 'solid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBackgroundTypeChange('solid')}
            >
              Solid
            </Button>
            <Button
              variant={
                background.type === 'transparent' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => handleBackgroundTypeChange('transparent')}
            >
              Transparent
            </Button>
            <Button
              variant={background.type === 'gradient' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBackgroundTypeChange('gradient')}
            >
              Gradient
            </Button>
            <Button
              variant={background.type === 'pattern' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBackgroundTypeChange('pattern')}
            >
              Pattern
            </Button>
          </div>
        </div>

        {/* Background Options */}
        {renderBackgroundOptions()}

        {/* Border Radius */}
        <div className="space-y-2">
          <Label>Border Radius: {borderRadius}px</Label>
          <Slider
            value={[borderRadius]}
            onValueChange={([value]) =>
              updateCanvasSettings({ borderRadius: value })
            }
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Canvas Size */}
        <div className="space-y-4">
          <Label>Canvas Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="canvas-width" className="text-xs">
                Width
              </Label>
              <Input
                id="canvas-width"
                type="number"
                value={state.canvasSettings.width}
                onChange={(e) =>
                  updateCanvasSettings({
                    width: parseInt(e.target.value) || 800,
                  })
                }
                min={100}
                max={2000}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="canvas-height" className="text-xs">
                Height
              </Label>
              <Input
                id="canvas-height"
                type="number"
                value={state.canvasSettings.height}
                onChange={(e) =>
                  updateCanvasSettings({
                    height: parseInt(e.target.value) || 600,
                  })
                }
                min={100}
                max={2000}
              />
            </div>
          </div>
        </div>
    </div>
  );
}

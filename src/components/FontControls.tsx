'use client';

import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
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
import { GoogleFont } from '@/lib/google-fonts';
import { TextElement as TextElementType } from '@/types';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Loader2,
  Minus,
  RotateCcw,
  Settings,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FontAxis,
  getCachedVariableFontInfo,
  getVariableFontInfoFromMetadata,
  normalizeAxesFromMetadata,
  preloadKnownVariableFonts,
} from '@/lib/variable-fonts';

const FALLBACK_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Palatino',
];

const FONT_CATEGORIES: Array<{
  value: GoogleFont['category'] | 'all' | 'variable';
  label: string;
}> = [
  { value: 'all', label: 'All Categories' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'variable', label: 'Variable Fonts' },
];

export function FontControls() {
  const {
    updateTextElement,
    fetchFonts,
    loadFont,
    setSearchQuery,
    setSelectedCategory,
    getFilteredFonts,
  } = useAppActions();

  const fontsState = useAppStore((state) => state.fonts);
  const selectedElement = useAppStore((state) => {
    if (!state.selectedElementId) return null;
    return (
      state.textElements.find((element) => element.id === state.selectedElementId) ||
      null
    );
  });

  const selectedFontMeta = useMemo(() => {
    if (!selectedElement) return null;
    return (
      fontsState.fonts.find((font) => font.family === selectedElement.fontFamily) ||
      null
    );
  }, [fontsState.fonts, selectedElement]);

  const [variableFontAxes, setVariableFontAxes] = useState<FontAxis[]>([]);
  const [isDetectingAxes, setIsDetectingAxes] = useState(false);

  useEffect(() => {
    if (fontsState.fonts.length === 0 && !fontsState.isLoading) {
      fetchFonts({ sort: 'popularity' });
    }
    preloadKnownVariableFonts();
  }, [fetchFonts, fontsState.fonts.length, fontsState.isLoading]);

  useEffect(() => {
    if (!selectedElement) return;

    const metadataAxes = normalizeAxesFromMetadata(selectedFontMeta?.axes);
    if (metadataAxes.length > 0) {
      setVariableFontAxes(metadataAxes);
      setIsDetectingAxes(false);
      return;
    }

    let isActive = true;

    const detectAxes = async () => {
      setIsDetectingAxes(true);
      try {
        const fontInfo = await getVariableFontInfoFromMetadata(
          selectedElement.fontFamily,
          selectedFontMeta?.axes,
        );
        if (isActive) {
          setVariableFontAxes(fontInfo.axes);
        }
      } catch (error) {
        console.warn('Failed to detect variable font axes:', error);
        if (isActive) {
          setVariableFontAxes([]);
        }
      } finally {
        if (isActive) {
          setIsDetectingAxes(false);
        }
      }
    };

    if (fontsState.loadedFonts.has(selectedElement.fontFamily)) {
      detectAxes();
    } else {
      const timer = setTimeout(detectAxes, 800);
      return () => clearTimeout(timer);
    }

    return () => {
      isActive = false;
    };
  }, [
    fontsState.loadedFonts,
    selectedElement,
    selectedFontMeta?.axes,
  ]);

  const fontOptions: ComboboxOption[] = useMemo(() => {
    const googleFonts = getFilteredFonts();

    const fallbackOptions = FALLBACK_FONTS.map((font) => ({
      value: font,
      label: font,
      category: 'system' as const,
    }));

    if (googleFonts.length === 0) {
      return fallbackOptions;
    }

    const googleFontOptions = googleFonts.map((font) => {
      const cachedInfo = getCachedVariableFontInfo(font.family);
      const axesCount = font.axes?.length || cachedInfo?.axes.length || 0;

      return {
        value: font.family,
        label: font.family,
        category: font.category,
        preview: font.family,
        isVariable: axesCount > 0,
        axesCount,
      };
    });

    const allOptions = [...googleFontOptions, ...fallbackOptions];
    const uniqueOptions = allOptions.filter(
      (option, index, self) =>
        index === self.findIndex((o) => o.value === option.value),
    );

    return uniqueOptions;
  }, [
    fontsState.fonts,
    fontsState.searchQuery,
    fontsState.selectedCategory,
    getFilteredFonts,
  ]);

  const handleFontChange = async (fontFamily: string) => {
    if (!selectedElement) return;

    updateTextElement(selectedElement.id, {
      fontFamily,
      fontVariationSettings: {},
    });

    const isGoogleFont = fontsState.fonts.some((f) => f.family === fontFamily);
    const fontMeta = fontsState.fonts.find((f) => f.family === fontFamily);
    if (isGoogleFont && !fontsState.loadedFonts.has(fontFamily)) {
      try {
        await loadFont(fontFamily, { axes: fontMeta?.axes });
      } catch (error) {
        console.error('Failed to load font:', error);
      }
    }
  };

  const handleCategoryChange = (
    category: GoogleFont['category'] | 'all' | 'variable',
  ) => {
    setSelectedCategory(category === 'all' ? '' : category);
  };

  const handleFontSearch = (query: string) => {
    setSearchQuery(query);
  };

  const applyAxisValue = useCallback(
    (axis: FontAxis, value: number) => {
      if (!selectedElement) return;

      const nextVariation = { ...(selectedElement.fontVariationSettings || {}) };
      const updates: Partial<TextElementType> = {};

      switch (axis.tag) {
        case 'wght':
          updates.fontWeight = value;
          delete nextVariation.wght;
          break;
        case 'wdth':
          updates.fontStretch = value;
          delete nextVariation.wdth;
          break;
        case 'slnt':
          updates.fontStyle = 'oblique';
          updates.fontSlant = value;
          delete nextVariation.slnt;
          break;
        case 'ital':
          updates.fontStyle =
            value >= (axis.min + axis.max) / 2 ? 'italic' : 'normal';
          updates.fontSlant = 0;
          delete nextVariation.ital;
          break;
        default:
          nextVariation[axis.tag] = value;
      }

      updates.fontVariationSettings = nextVariation;
      updateTextElement(selectedElement.id, updates);
    },
    [selectedElement, updateTextElement],
  );

  if (!selectedElement) {
    return (
      <div className="text-muted-foreground rounded-2xl border border-dashed border-border/80 bg-muted/40 py-8 text-center text-sm">
        Select a text element to edit its properties.
      </div>
    );
  }

  const updateSelectedElement = (updates: Partial<TextElementType>) => {
    updateTextElement(selectedElement.id, updates);
  };

  const isBold = selectedElement.fontWeight >= 600;
  const isItalic = selectedElement.fontStyle === 'italic';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Font Category</Label>
        <Select
          value={fontsState.selectedCategory || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Font Family
          {fontsState.isLoadingFont && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground text-xs">
                Loading {fontsState.currentlyLoadingFont}...
              </span>
            </>
          )}
        </Label>
        <Combobox
          options={fontOptions}
          value={selectedElement.fontFamily}
          onValueChange={handleFontChange}
          onSearch={handleFontSearch}
          placeholder="Search fonts..."
          searchPlaceholder="Type to search fonts..."
          emptyMessage={
            fontsState.isLoading ? 'Loading fonts...' : 'No fonts found.'
          }
          loading={fontsState.isLoading}
          disabled={fontsState.isLoadingFont}
          renderOption={(option) => (
            <div className="flex w-full items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {(option as any).isVariable && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Settings className="h-3 w-3" />
                      Variable
                      {(option as any).axesCount > 0 && (
                        <span className="text-xs opacity-75">
                          ({(option as any).axesCount})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-xs capitalize">
                  {option.category}
                </div>
              </div>
            </div>
          )}
        />
        {fontsState.isLoadingFont && (
          <p className="text-sm text-primary">
            Loading font {fontsState.currentlyLoadingFont}. Please wait...
          </p>
        )}
        {fontsState.error && (
          <p className="text-sm text-amber-700">
            {fontsState.error.includes('API key')
              ? 'Using system fonts. Configure Google Fonts API key for more options.'
              : fontsState.error}
          </p>
        )}
        {fontsState.fonts.length === 0 &&
          !fontsState.isLoading &&
          !fontsState.error && (
            <p className="text-sm text-muted-foreground">
              Using system fonts. Add Google Fonts API key for more options.
            </p>
          )}
      </div>

      <div className="space-y-2">
        <Label>Font Size: {selectedElement.fontSize}px</Label>
        <Slider
          value={[selectedElement.fontSize]}
          onValueChange={([value]) => updateSelectedElement({ fontSize: value })}
          min={8}
          max={200}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Style</Label>
        <div className="flex gap-2">
          <Button
            variant={isBold ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              updateSelectedElement({ fontWeight: isBold ? 400 : 700 })
            }
          >
            <Bold size={16} />
          </Button>
          <Button
            variant={isItalic ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              updateSelectedElement({
                fontStyle: isItalic ? 'normal' : 'italic',
                fontSlant: 0,
              })
            }
          >
            <Italic size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textDecoration?.underline ? 'default' : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                textDecoration: {
                  underline: !selectedElement.textDecoration?.underline,
                  overline: selectedElement.textDecoration?.overline || false,
                  strikethrough: selectedElement.textDecoration?.strikethrough ||
                    false,
                },
              })
            }
          >
            <Underline size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textDecoration?.strikethrough
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                textDecoration: {
                  underline: selectedElement.textDecoration?.underline || false,
                  overline: selectedElement.textDecoration?.overline || false,
                  strikethrough:
                    !selectedElement.textDecoration?.strikethrough,
                },
              })
            }
          >
            <Strikethrough size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textDecoration?.overline ? 'default' : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                textDecoration: {
                  underline: selectedElement.textDecoration?.underline || false,
                  overline: !selectedElement.textDecoration?.overline,
                  strikethrough: selectedElement.textDecoration?.strikethrough ||
                    false,
                },
              })
            }
          >
            <Minus size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Text Alignment</Label>
        <div className="flex gap-2">
          <Button
            variant={selectedElement.textAlign === 'left' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateSelectedElement({ textAlign: 'left' })}
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textAlign === 'center' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() => updateSelectedElement({ textAlign: 'center' })}
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textAlign === 'right' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() => updateSelectedElement({ textAlign: 'right' })}
          >
            <AlignRight size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textAlign === 'justify' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() => updateSelectedElement({ textAlign: 'justify' })}
          >
            <AlignJustify size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Typography Spacing</Label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="line-height">Line Height</Label>
            <span className="text-sm text-muted-foreground">
              {selectedElement.lineHeight?.toFixed(1) || '1.2'}
            </span>
          </div>
          <Slider
            id="line-height"
            min={1.0}
            max={3.0}
            step={0.1}
            value={[selectedElement.lineHeight || 1.2]}
            onValueChange={([value]) =>
              updateSelectedElement({ lineHeight: value })
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="letter-spacing">Letter Spacing</Label>
            <span className="text-sm text-muted-foreground">
              {selectedElement.letterSpacing?.toFixed(1) || '0.0'}px
            </span>
          </div>
          <Slider
            id="letter-spacing"
            min={-2}
            max={10}
            step={0.1}
            value={[selectedElement.letterSpacing || 0]}
            onValueChange={([value]) =>
              updateSelectedElement({ letterSpacing: value })
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="word-spacing">Word Spacing</Label>
            <span className="text-sm text-muted-foreground">
              {selectedElement.wordSpacing?.toFixed(1) || '0.0'}px
            </span>
          </div>
          <Slider
            id="word-spacing"
            min={-5}
            max={20}
            step={0.1}
            value={[selectedElement.wordSpacing || 0]}
            onValueChange={([value]) =>
              updateSelectedElement({ wordSpacing: value })
            }
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-transform">Text Transform</Label>
        <Select
          value={selectedElement.textTransform || 'none'}
          onValueChange={(value) =>
            updateSelectedElement({
              textTransform: value as
                | 'none'
                | 'uppercase'
                | 'lowercase'
                | 'capitalize'
                | 'small-caps',
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select text transform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize</SelectItem>
            <SelectItem value="small-caps">Small Caps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-color">Text Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="text-color"
            type="color"
            value={selectedElement.color}
            onChange={(e) => updateSelectedElement({ color: e.target.value })}
            className="h-10 w-12 rounded border p-1"
          />
          <Input
            value={selectedElement.color}
            onChange={(e) => updateSelectedElement({ color: e.target.value })}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>

      {variableFontAxes.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Label className="font-medium">Variable Font Axes</Label>
              {isDetectingAxes && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const nextVariation = {
                  ...(selectedElement.fontVariationSettings || {}),
                };

                const updates: Partial<TextElementType> = {
                  fontVariationSettings: nextVariation,
                };

                variableFontAxes.forEach((axis) => {
                  switch (axis.tag) {
                    case 'wght':
                      updates.fontWeight = axis.default;
                      delete nextVariation.wght;
                      break;
                    case 'wdth':
                      updates.fontStretch = axis.default;
                      delete nextVariation.wdth;
                      break;
                    case 'slnt':
                      updates.fontStyle = axis.default !== 0 ? 'oblique' : 'normal';
                      updates.fontSlant = axis.default;
                      delete nextVariation.slnt;
                      break;
                    case 'ital':
                      updates.fontStyle =
                        axis.default >= (axis.min + axis.max) / 2
                          ? 'italic'
                          : 'normal';
                      updates.fontSlant = 0;
                      delete nextVariation.ital;
                      break;
                    default:
                      nextVariation[axis.tag] = axis.default;
                  }
                });

                updateSelectedElement(updates);
              }}
              className="h-7 px-2 text-xs"
              title="Reset all axes to default values"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>

          <div className="grid gap-4">
            {variableFontAxes.map((axis) => {
              const currentValue = (() => {
                switch (axis.tag) {
                  case 'wght':
                    return selectedElement.fontWeight ?? axis.default;
                  case 'wdth':
                    return selectedElement.fontStretch ?? axis.default;
                  case 'slnt':
                    return selectedElement.fontSlant ?? axis.default;
                  case 'ital':
                    return selectedElement.fontStyle === 'italic'
                      ? axis.max
                      : axis.min;
                  default:
                    return (
                      selectedElement.fontVariationSettings?.[axis.tag] ??
                      axis.default
                    );
                }
              })();

              const isModified = currentValue !== axis.default;

              return (
                <div key={axis.tag} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`axis-${axis.tag}`}
                        className={`text-sm font-medium ${
                          isModified ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {axis.name}
                      </Label>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {axis.tag}
                      </span>
                      {isModified && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyAxisValue(axis, axis.default)}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                          title={`Reset ${axis.name} to default (${axis.default})`}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={axis.min}
                        max={axis.max}
                        step={axis.tag === 'ital' ? 1 : axis.max - axis.min > 100 ? 1 : 0.1}
                        value={currentValue}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!Number.isNaN(value) && value >= axis.min && value <= axis.max) {
                            applyAxisValue(axis, value);
                          }
                        }}
                        className="h-7 w-20 text-center text-xs"
                      />
                    </div>
                  </div>

                  {axis.description && (
                    <p className="text-xs text-muted-foreground">
                      {axis.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="min-w-[2rem] text-xs text-muted-foreground">
                      {axis.min}
                    </span>
                    <Slider
                      id={`axis-${axis.tag}`}
                      min={axis.min}
                      max={axis.max}
                      step={axis.tag === 'ital' ? 1 : axis.max - axis.min > 100 ? 1 : 0.1}
                      value={[currentValue]}
                      onValueChange={([value]) => applyAxisValue(axis, value)}
                      className={`flex-1 ${
                        isModified
                          ? '[&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary'
                          : ''
                      }`}
                    />
                    <span className="min-w-[2rem] text-xs text-muted-foreground">
                      {axis.max}
                    </span>
                  </div>

                  {(axis.tag === 'wght' || axis.tag === 'wdth') && (
                    <div className="flex flex-wrap gap-1">
                      {axis.tag === 'wght' &&
                        [
                          { label: 'Thin', value: 100 },
                          { label: 'Light', value: 300 },
                          { label: 'Regular', value: 400 },
                          { label: 'Medium', value: 500 },
                          { label: 'Bold', value: 700 },
                          { label: 'Black', value: 900 },
                        ]
                          .filter(
                            (preset) =>
                              preset.value >= axis.min && preset.value <= axis.max,
                          )
                          .map((preset) => (
                            <Button
                              key={preset.value}
                              variant={
                                currentValue === preset.value
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => applyAxisValue(axis, preset.value)}
                              className="h-6 px-2 text-xs"
                            >
                              {preset.label}
                            </Button>
                          ))}

                      {axis.tag === 'wdth' &&
                        [
                          { label: 'Condensed', value: 75 },
                          { label: 'Normal', value: 100 },
                          { label: 'Extended', value: 125 },
                        ]
                          .filter(
                            (preset) =>
                              preset.value >= axis.min && preset.value <= axis.max,
                          )
                          .map((preset) => (
                            <Button
                              key={preset.value}
                              variant={
                                currentValue === preset.value
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => applyAxisValue(axis, preset.value)}
                              className="h-6 px-2 text-xs"
                            >
                              {preset.label}
                            </Button>
                          ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(selectedElement.fontVariationSettings || {}).length > 0 && (
            <div className="mt-3 border-t pt-3">
              <Label className="mb-1 block text-xs text-muted-foreground">
                CSS font-variation-settings
              </Label>
              <code className="block break-all rounded bg-muted px-2 py-1 text-xs">
                {Object.entries(selectedElement.fontVariationSettings || {})
                  .map(([axis, value]) => `"${axis}" ${value}`)
                  .join(', ')}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

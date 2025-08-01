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
import { useApp } from '@/contexts/AppContext';
import { GoogleFont } from '@/types';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Loader2,
  Minus,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FontAxis, getVariableFontInfo } from '@/lib/variable-fonts';

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
    state,
    updateTextElement,
    fetchFonts,
    loadFont,
    setSearchQuery,
    setSelectedCategory,
    getFilteredFonts,
  } = useApp();

  const selectedElement = state.textElements.find(
    (element) => element.id === state.selectedElementId,
  );

  // Variable font state
  const [variableFontAxes, setVariableFontAxes] = useState<FontAxis[]>([]);
  const [isDetectingAxes, setIsDetectingAxes] = useState(false);

  // Initialize Google Fonts on component mount
  useEffect(() => {
    if (state.fonts.fonts.length === 0 && !state.fonts.isLoading) {
      fetchFonts({ sort: 'popularity' });
    }
  }, [fetchFonts, state.fonts.fonts.length, state.fonts.isLoading]);

  // Detect variable font axes when font family changes
  useEffect(() => {
    if (!selectedElement) return;

    const detectAxes = async () => {
      setIsDetectingAxes(true);
      try {
        const fontInfo = await getVariableFontInfo(selectedElement.fontFamily);
        setVariableFontAxes(fontInfo.axes);
      } catch (error) {
        console.warn('Failed to detect variable font axes:', error);
        setVariableFontAxes([]);
      } finally {
        setIsDetectingAxes(false);
      }
    };

    // Only detect axes for loaded fonts or after a delay for Google Fonts
    if (state.fonts.loadedFonts.has(selectedElement.fontFamily)) {
      detectAxes();
    } else {
      // Wait a bit for Google Fonts to load
      const timer = setTimeout(detectAxes, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedElement?.fontFamily, state.fonts.loadedFonts]);

  // Prepare font options for the combobox
  const fontOptions: ComboboxOption[] = useMemo(() => {
    const googleFonts = getFilteredFonts();

    // Always include fallback fonts, with Google Fonts first if available
    const fallbackOptions = FALLBACK_FONTS.map((font) => ({
      value: font,
      label: font,
      category: 'system' as const,
    }));

    if (googleFonts.length === 0) {
      return fallbackOptions;
    }

    const googleFontOptions = googleFonts.map((font) => ({
      value: font.family,
      label: font.family,
      category: font.category,
      preview: font.family,
    }));

    // Combine Google Fonts with fallback fonts, removing duplicates
    const allOptions = [...googleFontOptions, ...fallbackOptions];
    const uniqueOptions = allOptions.filter(
      (option, index, self) =>
        index === self.findIndex((o) => o.value === option.value),
    );

    return uniqueOptions;
  }, [getFilteredFonts]);

  const handleFontChange = async (fontFamily: string) => {
    if (!selectedElement) return;

    // Update the text element immediately
    updateTextElement(selectedElement.id, { fontFamily });

    // Load the font if it's a Google Font
    const isGoogleFont = state.fonts.fonts.some((f) => f.family === fontFamily);
    if (isGoogleFont && !state.fonts.loadedFonts.has(fontFamily)) {
      try {
        await loadFont(fontFamily);
      } catch (error) {
        console.error('Failed to load font:', error);
      }
    }
  };

  const handleCategoryChange = (category: GoogleFont['category'] | 'all' | 'variable') => {
    setSelectedCategory(category === 'all' ? '' : category);
  };

  const handleFontSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (!selectedElement) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Select a text element to edit its properties
      </div>
    );
  }

  const updateSelectedElement = (updates: Partial<typeof selectedElement>) => {
    updateTextElement(selectedElement.id, updates);
  };

  return (
    <div className="space-y-6">
      {/* Font Category Filter */}
      <div className="space-y-2">
        <Label>Font Category</Label>
        <Select
          value={state.fonts.selectedCategory || 'all'}
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

      {/* Font Family */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Font Family
          {state.fonts.isLoadingFont && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground text-xs">
                Loading {state.fonts.currentlyLoadingFont}...
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
            state.fonts.isLoading ? 'Loading fonts...' : 'No fonts found.'
          }
          loading={state.fonts.isLoading}
          disabled={state.fonts.isLoadingFont}
          renderOption={(option) => (
            <div className="flex-1">
              <div className="font-medium">{option.label}</div>
              <div className="text-muted-foreground text-xs capitalize">
                {option.category}
              </div>
            </div>
          )}
        />
        {state.fonts.isLoadingFont && (
          <p className="text-sm text-blue-600">
            Loading font {state.fonts.currentlyLoadingFont}. Please wait...
          </p>
        )}
        {state.fonts.error && (
          <p className="text-sm text-amber-600">
            {state.fonts.error.includes('API key')
              ? 'Using system fonts. Configure Google Fonts API key for more options.'
              : state.fonts.error}
          </p>
        )}
        {state.fonts.fonts.length === 0 &&
          !state.fonts.isLoading &&
          !state.fonts.error && (
            <p className="text-sm text-gray-500">
              Using system fonts. Add Google Fonts API key for more options.
            </p>
          )}
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Font Size: {selectedElement.fontSize}px</Label>
        <Slider
          value={[selectedElement.fontSize]}
          onValueChange={([value]) =>
            updateSelectedElement({ fontSize: value })
          }
          min={8}
          max={200}
          step={1}
          className="w-full"
        />
      </div>

      {/* Font Style Controls */}
      <div className="space-y-2">
        <Label>Style</Label>
        <div className="flex gap-2">
          <Button
            variant={
              selectedElement.fontWeight === 'bold' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                fontWeight:
                  selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
              })
            }
          >
            <Bold size={16} />
          </Button>
          <Button
            variant={
              selectedElement.fontStyle === 'italic' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                fontStyle:
                  selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
              })
            }
          >
            <Italic size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textDecoration?.underline
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                textDecoration: {
                  underline: !selectedElement.textDecoration?.underline,
                  overline: selectedElement.textDecoration?.overline || false,
                  strikethrough: selectedElement.textDecoration?.strikethrough || false,
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
                  strikethrough: !selectedElement.textDecoration?.strikethrough,
                },
              })
            }
          >
            <Strikethrough size={16} />
          </Button>
          <Button
            variant={
              selectedElement.textDecoration?.overline
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                textDecoration: {
                  underline: selectedElement.textDecoration?.underline || false,
                  overline: !selectedElement.textDecoration?.overline,
                  strikethrough: selectedElement.textDecoration?.strikethrough || false,
                },
              })
            }
          >
            <Minus size={16} />
          </Button>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-2">
        <Label>Text Alignment</Label>
        <div className="flex gap-2">
          <Button
            variant={
              selectedElement.textAlign === 'left' ? 'default' : 'outline'
            }
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

      {/* Typography Spacing */}
      <div className="space-y-2">
        <Label>Typography Spacing</Label>
        
        {/* Line Height */}
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
            onValueChange={([value]) => updateSelectedElement({ lineHeight: value })}
            className="w-full"
          />
        </div>

        {/* Letter Spacing */}
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
            onValueChange={([value]) => updateSelectedElement({ letterSpacing: value })}
            className="w-full"
          />
        </div>

        {/* Word Spacing */}
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
            onValueChange={([value]) => updateSelectedElement({ wordSpacing: value })}
            className="w-full"
          />
        </div>
      </div>

      {/* Text Transform */}
      <div className="space-y-2">
        <Label htmlFor="text-transform">Text Transform</Label>
        <Select
          value={selectedElement.textTransform || 'none'}
          onValueChange={(value) => updateSelectedElement({ textTransform: value as 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'small-caps' })}
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

      {/* Text Color */}
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

      {/* Variable Font Controls */}
      {variableFontAxes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Variable Font Axes</Label>
            {isDetectingAxes && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
          <div className="space-y-3">
            {variableFontAxes.map((axis) => {
              const currentValue = selectedElement.fontVariationSettings?.[axis.tag] ?? axis.default;
              return (
                <div key={axis.tag} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`axis-${axis.tag}`} className="text-sm">
                      {axis.name} ({axis.tag})
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {currentValue}
                    </span>
                  </div>
                  <Slider
                    id={`axis-${axis.tag}`}
                    min={axis.min}
                    max={axis.max}
                    step={axis.tag === 'ital' ? 1 : (axis.max - axis.min) > 100 ? 1 : 0.1}
                    value={[currentValue]}
                    onValueChange={([value]) => {
                      const currentSettings = selectedElement.fontVariationSettings || {};
                      const newSettings = { ...currentSettings, [axis.tag]: value };
                      updateSelectedElement({ fontVariationSettings: newSettings });
                    }}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

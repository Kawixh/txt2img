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
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Loader2,
  Underline,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';

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
  value: GoogleFont['category'] | 'all';
  label: string;
}> = [
  { value: 'all', label: 'All Categories' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
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

  // Initialize Google Fonts on component mount
  useEffect(() => {
    if (state.fonts.fonts.length === 0 && !state.fonts.isLoading) {
      fetchFonts({ sort: 'popularity' });
    }
  }, [fetchFonts, state.fonts.fonts.length, state.fonts.isLoading]);

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

  const handleCategoryChange = (category: GoogleFont['category'] | 'all') => {
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
              selectedElement.textDecoration === 'underline'
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() =>
              updateSelectedElement({
                textDecoration:
                  selectedElement.textDecoration === 'underline'
                    ? 'none'
                    : 'underline',
              })
            }
          >
            <Underline size={16} />
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
        </div>
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
    </div>
  );
}

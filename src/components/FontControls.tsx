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
import { GoogleFont } from '@/lib/google-fonts';
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
import { FontAxis, getVariableFontInfo, preloadKnownVariableFonts, getCachedVariableFontInfo } from '@/lib/variable-fonts';

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

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
  const [pendingAxisUpdates, setPendingAxisUpdates] = useState<Record<string, number>>({});

  // Helper function to check if a font is variable based on various heuristics
  const checkIsVariableFont = (font: GoogleFont): boolean => {
    // Check for high number of weight variants (likely variable font with many static instances)
    const weightVariants = font.variants.filter(v => /^\d{3}(italic)?$/.test(v));
    if (weightVariants.length > 8) {
      return true;
    }
    
    // Check for specific Google Fonts known to be variable
    const knownVariableFontFamilies = [
      'Inter', 'Roboto Flex', 'Source Sans Pro', 'Open Sans',
      'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Noto Sans',
      'Fira Sans', 'Work Sans', 'Libre Franklin', 'IBM Plex Sans',
      'Crimson Pro', 'Literata', 'Fraunces', 'Recursive', 'Commissioner',
      'Manrope', 'Public Sans', 'Space Grotesk', 'DM Sans', 'Epilogue',
      'Plus Jakarta Sans', 'Hanken Grotesk', 'Red Hat Display', 'Figtree',
      'Albert Sans', 'Comfortaa', 'Markazi Text', 'Playfair Display',
      'Outfit'
    ];
    
    return knownVariableFontFamilies.some(knownFont => 
      font.family.toLowerCase().includes(knownFont.toLowerCase())
    );
  };

  // Initialize Google Fonts on component mount
  useEffect(() => {
    if (state.fonts.fonts.length === 0 && !state.fonts.isLoading) {
      fetchFonts({ sort: 'popularity' });
    }
    // Preload known variable fonts for better UX
    preloadKnownVariableFonts();
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

    const googleFontOptions = googleFonts.map((font) => {
      // Check if this is a known variable font
      const cachedInfo = getCachedVariableFontInfo(font.family);
      const isVariableFont = cachedInfo?.isVariable || checkIsVariableFont(font);
      
      return {
        value: font.family,
        label: font.family,
        category: font.category,
        preview: font.family,
        isVariable: isVariableFont,
        axesCount: cachedInfo?.axes.length || 0,
      };
    });

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

  // Debounced axis update function to prevent excessive re-renders
  const debouncedAxisUpdate = useCallback(
    debounce((updates: Record<string, number>) => {
      if (!selectedElement) return;
      const currentSettings = selectedElement.fontVariationSettings || {};
      const newSettings = { ...currentSettings, ...updates };
      updateTextElement(selectedElement.id, { fontVariationSettings: newSettings });
    }, 150),
    [selectedElement, updateTextElement]
  );

  // Apply pending updates when they change
  useEffect(() => {
    if (Object.keys(pendingAxisUpdates).length > 0) {
      debouncedAxisUpdate(pendingAxisUpdates);
    }
  }, [pendingAxisUpdates, debouncedAxisUpdate]);

  // Handle axis value changes with debouncing
  const handleAxisChange = useCallback((axisTag: string, value: number) => {
    setPendingAxisUpdates(prev => ({ ...prev, [axisTag]: value }));
  }, []);

  // Clear pending updates when they're applied
  useEffect(() => {
    const timer = setTimeout(() => {
      setPendingAxisUpdates({});
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedElement?.fontVariationSettings]);

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
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {(option as any).isVariable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md border border-primary/20">
                      <Settings className="h-3 w-3" />
                      Variable
                      {(option as any).axesCount > 0 && (
                        <span className="text-xs opacity-75">({(option as any).axesCount})</span>
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
        <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
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
                // Reset all axes to default values
                const defaultSettings: Record<string, number> = {};
                variableFontAxes.forEach(axis => {
                  defaultSettings[axis.tag] = axis.default;
                });
                // Apply all changes at once
                setPendingAxisUpdates(defaultSettings);
              }}
              className="h-7 px-2 text-xs"
              title="Reset all axes to default values"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="grid gap-4">
            {variableFontAxes.map((axis) => {
              const currentValue = selectedElement.fontVariationSettings?.[axis.tag] ?? axis.default;
              const isModified = currentValue !== axis.default;
              
              return (
                <div key={axis.tag} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`axis-${axis.tag}`} className={`text-sm font-medium ${
                        isModified ? 'text-primary' : 'text-foreground'
                      }`}>
                        {axis.name}
                      </Label>
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                        {axis.tag}
                      </span>
                      {isModified && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleAxisChange(axis.tag, axis.default);
                          }}
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
                        step={axis.tag === 'ital' ? 1 : (axis.max - axis.min) > 100 ? 1 : 0.1}
                        value={currentValue}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value >= axis.min && value <= axis.max) {
                            handleAxisChange(axis.tag, value);
                          }
                        }}
                        className="w-16 h-7 text-xs text-center"
                      />
                    </div>
                  </div>
                  
                  {axis.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {axis.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground min-w-[2rem] text-right">
                      {axis.min}
                    </span>
                    <Slider
                      id={`axis-${axis.tag}`}
                      min={axis.min}
                      max={axis.max}
                      step={axis.tag === 'ital' ? 1 : (axis.max - axis.min) > 100 ? 1 : 0.1}
                      value={[currentValue]}
                      onValueChange={([value]) => {
                        handleAxisChange(axis.tag, value);
                      }}
                      className={`flex-1 ${
                        isModified ? '[&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary' : ''
                      }`}
                    />
                    <span className="text-xs text-muted-foreground min-w-[2rem] text-left">
                      {axis.max}
                    </span>
                  </div>
                  
                  {/* Preset buttons for common axes */}
                  {(axis.tag === 'wght' || axis.tag === 'wdth') && (
                    <div className="flex gap-1 flex-wrap">
                      {axis.tag === 'wght' && [
                        { label: 'Thin', value: 100 },
                        { label: 'Light', value: 300 },
                        { label: 'Regular', value: 400 },
                        { label: 'Medium', value: 500 },
                        { label: 'Bold', value: 700 },
                        { label: 'Black', value: 900 }
                      ].filter(preset => preset.value >= axis.min && preset.value <= axis.max).map(preset => (
                        <Button
                          key={preset.value}
                          variant={currentValue === preset.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            handleAxisChange(axis.tag, preset.value);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          {preset.label}
                        </Button>
                      ))}
                      
                      {axis.tag === 'wdth' && [
                        { label: 'Condensed', value: 75 },
                        { label: 'Normal', value: 100 },
                        { label: 'Extended', value: 125 }
                      ].filter(preset => preset.value >= axis.min && preset.value <= axis.max).map(preset => (
                        <Button
                          key={preset.value}
                          variant={currentValue === preset.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            handleAxisChange(axis.tag, preset.value);
                          }}
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
          
          {/* Show current CSS for debugging/copying */}
          {Object.keys(selectedElement.fontVariationSettings || {}).length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Label className="text-xs text-muted-foreground mb-1 block">CSS font-variation-settings:</Label>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
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

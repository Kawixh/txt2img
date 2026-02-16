'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import {
  IMAGE_UPLOAD_ACCEPT,
  createImageLayerDraftFromBlob,
  isSupportedImageFile,
} from '@/lib/canvas-media';
import {
  Circle,
  Diamond,
  Hexagon,
  ImagePlus,
  Plus,
  Square,
  Star,
  Triangle,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

export function TextInput() {
  const { addTextElement, addShapeElement, addImageElement, setError } =
    useAppActions();
  const isLoading = useAppStore((state) => state.isLoading);
  const layerCounts = useAppStore(
    (state) => ({
      text: state.textElements.length,
      shapes: state.shapeElements.length,
      images: state.imageElements.length,
    }),
    (a, b) =>
      a.text === b.text && a.shapes === b.shapes && a.images === b.images,
  );
  const [inputText, setInputText] = useState('');
  const [isAddingImage, setIsAddingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = useCallback(() => {
    if (inputText.trim()) {
      addTextElement(inputText.trim());
      setInputText('');
    }
  }, [addTextElement, inputText]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddText();
    }
  }, [handleAddText]);

  const handleImageFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError(null);
      setIsAddingImage(true);

      try {
        const skipped: string[] = [];

        for (const file of files) {
          if (!isSupportedImageFile(file)) {
            skipped.push(file.name);
            continue;
          }

          const draft = await createImageLayerDraftFromBlob(file, file.name);
          addImageElement(draft);
        }

        if (skipped.length > 0) {
          setError(
            `Skipped unsupported files: ${skipped.join(
              ', ',
            )}. Use PNG, JPEG, SVG, WEBP, or GIF.`,
          );
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        setError('Unable to add image. Please try a different file.');
      } finally {
        setIsAddingImage(false);
      }
    },
    [addImageElement, setError],
  );

  const handleImageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      void handleImageFiles(files);
      event.target.value = '';
    },
    [handleImageFiles],
  );

  const totalLayers = layerCounts.text + layerCounts.shapes + layerCounts.images;

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-3">
        <div className="space-y-2">
          <Label htmlFor="text-input">Text Layer</Label>
          <Input
            id="text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your text..."
            disabled={isLoading}
            title="Type text and press Enter to create a new layer"
          />
        </div>
        <Button
          onClick={handleAddText}
          disabled={!inputText.trim() || isLoading}
          className="w-full"
          title="Add a new text layer to the canvas"
        >
          <Plus size={16} className="mr-2" />
          Add Text
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-3">
        <Label>Shape Layer</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-center"
            onClick={() => addShapeElement('rectangle')}
            title="Add rectangle"
          >
            <Square size={14} />
            Box
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-center"
            onClick={() => addShapeElement('circle')}
            title="Add circle"
          >
            <Circle size={14} />
            Circle
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-center"
            onClick={() => addShapeElement('triangle')}
            title="Add triangle"
          >
            <Triangle size={14} />
            Triangle
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-center"
            onClick={() => addShapeElement('diamond')}
            title="Add diamond"
          >
            <Diamond size={14} />
            Diamond
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-center"
            onClick={() => addShapeElement('hexagon')}
            title="Add hexagon"
          >
            <Hexagon size={14} />
            Hexagon
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-center"
            onClick={() => addShapeElement('star')}
            title="Add star"
          >
            <Star size={14} />
            Star
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-3">
        <Label>Image Layer</Label>
        <Input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT}
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isAddingImage || isLoading}
          title="Upload image files to canvas"
        >
          <ImagePlus size={16} className="mr-2" />
          {isAddingImage ? 'Adding Images...' : 'Upload Images'}
        </Button>
        <p className="text-muted-foreground text-xs">
          Paste directly with Ctrl/Cmd + V. Supports PNG, JPEG, SVG, WEBP, and
          GIF.
        </p>
      </div>

      {totalLayers > 0 && (
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm">
          <p className="text-muted-foreground">
            {totalLayers} layer{totalLayers > 1 ? 's' : ''} on canvas
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {layerCounts.text} text, {layerCounts.shapes} shape
            {layerCounts.shapes !== 1 ? 's' : ''}, {layerCounts.images} image
            {layerCounts.images !== 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}

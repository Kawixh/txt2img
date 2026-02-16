'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { Plus } from 'lucide-react';
import React, { useCallback, useState } from 'react';

export function TextInput() {
  const { addTextElement } = useAppActions();
  const isLoading = useAppStore((state) => state.isLoading);
  const textCount = useAppStore((state) => state.textElements.length);
  const [inputText, setInputText] = useState('');

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-input">Text Content</Label>
        <Input
          id="text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter your text here..."
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
        Add Text Layer
      </Button>

      {textCount > 0 && (
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm">
          <p className="text-muted-foreground">
            {textCount} layer{textCount > 1 ? 's' : ''} on canvas
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Manage order and edit text from the Layers tab.
          </p>
        </div>
      )}
    </div>
  );
}

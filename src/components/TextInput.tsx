'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

export function TextInput() {
  const { addTextElement } = useAppActions();
  const isLoading = useAppStore((state) => state.isLoading);
  const textCount = useAppStore((state) => state.textElements.length);
  const [inputText, setInputText] = useState('');

  const handleAddText = () => {
    if (inputText.trim()) {
      addTextElement(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddText();
    }
  };

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
        />
      </div>
      <Button
        onClick={handleAddText}
        disabled={!inputText.trim() || isLoading}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Text Layer
      </Button>

      {textCount > 0 && (
        <div className="text-muted-foreground text-sm">
          {textCount} layer{textCount > 1 ? 's' : ''} on canvas
        </div>
      )}
    </div>
  );
}

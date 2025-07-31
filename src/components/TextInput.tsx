'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

export function TextInput() {
  const { addTextElement, state } = useApp();
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
          onKeyPress={handleKeyPress}
          placeholder="Enter your text here..."
          disabled={state.isLoading}
        />
      </div>
      <Button
        onClick={handleAddText}
        disabled={!inputText.trim() || state.isLoading}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Text Element
      </Button>

      {state.textElements.length > 0 && (
        <div className="text-muted-foreground text-sm">
          {state.textElements.length} text element(s) on canvas
        </div>
      )}
    </div>
  );
}

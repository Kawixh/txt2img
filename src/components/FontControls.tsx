'use client'

import React from 'react'
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { FontFamily } from '@/types'

const FONT_FAMILIES: FontFamily[] = [
  'Arial',
  'Helvetica', 
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Palatino'
]

export function FontControls() {
  const { state, updateTextElement } = useApp()
  
  const selectedElement = state.textElements.find(
    element => element.id === state.selectedElementId
  )

  if (!selectedElement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Type size={20} />
            Font Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Select a text element to edit its properties
          </div>
        </CardContent>
      </Card>
    )
  }

  const updateSelectedElement = (updates: Partial<typeof selectedElement>) => {
    updateTextElement(selectedElement.id, updates)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Type size={20} />
          Font Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Family */}
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select
            value={selectedElement.fontFamily}
            onValueChange={(value: FontFamily) => updateSelectedElement({ fontFamily: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
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

        {/* Font Style Controls */}
        <div className="space-y-2">
          <Label>Style</Label>
          <div className="flex gap-2">
            <Button
              variant={selectedElement.fontWeight === 'bold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSelectedElement({ 
                fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' 
              })}
            >
              <Bold size={16} />
            </Button>
            <Button
              variant={selectedElement.fontStyle === 'italic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSelectedElement({ 
                fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' 
              })}
            >
              <Italic size={16} />
            </Button>
            <Button
              variant={selectedElement.textDecoration === 'underline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSelectedElement({ 
                textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' 
              })}
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
              variant={selectedElement.textAlign === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSelectedElement({ textAlign: 'left' })}
            >
              <AlignLeft size={16} />
            </Button>
            <Button
              variant={selectedElement.textAlign === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSelectedElement({ textAlign: 'center' })}
            >
              <AlignCenter size={16} />
            </Button>
            <Button
              variant={selectedElement.textAlign === 'right' ? 'default' : 'outline'}
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
          <div className="flex gap-2 items-center">
            <Input
              id="text-color"
              type="color"
              value={selectedElement.color}
              onChange={(e) => updateSelectedElement({ color: e.target.value })}
              className="w-12 h-10 p-1 border rounded"
            />
            <Input
              value={selectedElement.color}
              onChange={(e) => updateSelectedElement({ color: e.target.value })}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
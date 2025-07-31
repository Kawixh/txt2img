'use client'

import React, { useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { TextElement } from './TextElement'
import { BackgroundConfig } from '@/types'

export function TextCanvas() {
  const { state, selectElement } = useApp()
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectElement(null)
    }
  }

  const getBackgroundStyle = (background: BackgroundConfig): React.CSSProperties => {
    switch (background.type) {
      case 'solid':
        return { backgroundColor: background.color }
      
      case 'transparent':
        return { 
          backgroundColor: 'transparent',
          backgroundImage: `
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }
      
      case 'gradient':
        const direction = background.direction.replace('to-', 'to ')
        const gradientStops = background.via 
          ? `${background.from}, ${background.via}, ${background.to}`
          : `${background.from}, ${background.to}`
        return { 
          background: `linear-gradient(${direction}, ${gradientStops})`
        }
      
      case 'pattern':
        return getPatternStyle(background)
      
      default:
        return { backgroundColor: '#ffffff' }
    }
  }

  const getPatternStyle = (pattern: Extract<BackgroundConfig, { type: 'pattern' }>): React.CSSProperties => {
    const { pattern: patternType, color, backgroundColor } = pattern
    
    switch (patternType) {
      case 'dots':
        return {
          backgroundColor,
          backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }
      
      case 'grid':
        return {
          backgroundColor,
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }
      
      case 'stripes':
        return {
          backgroundColor,
          backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%)`,
          backgroundSize: '20px 20px'
        }
      
      case 'zigzag':
        return {
          backgroundColor,
          backgroundImage: `linear-gradient(135deg, ${color} 25%, transparent 25%, transparent 50%, ${color} 50%, ${color} 75%, transparent 75%)`,
          backgroundSize: '20px 20px'
        }
      
      default:
        return { backgroundColor }
    }
  }

  const canvasStyle: React.CSSProperties = {
    width: `${state.canvasSettings.width}px`,
    height: `${state.canvasSettings.height}px`,
    borderRadius: `${state.canvasSettings.borderRadius}px`,
    position: 'relative',
    border: '2px solid #e5e7eb',
    overflow: 'hidden',
    margin: '0 auto',
    ...getBackgroundStyle(state.canvasSettings.background)
  }

  return (
    <div className="flex justify-center p-8">
      <div
        ref={canvasRef}
        id="text-canvas"
        style={canvasStyle}
        onClick={handleCanvasClick}
        className="shadow-lg"
      >
        {state.textElements.map((element) => (
          <TextElement
            key={element.id}
            element={element}
            isSelected={state.selectedElementId === element.id}
          />
        ))}
        {state.textElements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg pointer-events-none">
            Click "Add Text" to start creating your image
          </div>
        )}
      </div>
    </div>
  )
}
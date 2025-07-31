export interface TextElement {
  id: string
  content: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  color: string
  textAlign: 'left' | 'center' | 'right'
}

export type BackgroundType = 'solid' | 'transparent' | 'gradient' | 'pattern'

export interface SolidBackground {
  type: 'solid'
  color: string
}

export interface TransparentBackground {
  type: 'transparent'
}

export interface GradientBackground {
  type: 'gradient'
  direction: 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl' | 'to-t' | 'to-tr'
  from: string
  to: string
  via?: string
}

export interface PatternBackground {
  type: 'pattern'
  pattern: 'dots' | 'grid' | 'stripes' | 'zigzag'
  color: string
  backgroundColor: string
}

export type BackgroundConfig = 
  | SolidBackground 
  | TransparentBackground 
  | GradientBackground 
  | PatternBackground

export interface CanvasSettings {
  width: number
  height: number
  background: BackgroundConfig
  borderRadius: number
}

export interface AppState {
  textElements: TextElement[]
  canvasSettings: CanvasSettings
  selectedElementId: string | null
  isLoading: boolean
  error: string | null
  exportStatus: 'idle' | 'loading' | 'success' | 'error'
}

export type FontFamily = 
  | 'Arial'
  | 'Helvetica'
  | 'Times New Roman'
  | 'Georgia'
  | 'Courier New'
  | 'Verdana'
  | 'Impact'
  | 'Comic Sans MS'
  | 'Trebuchet MS'
  | 'Palatino'
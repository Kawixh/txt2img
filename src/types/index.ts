export type PositionPreset =
  | 'manual'
  | 'center'
  | 'center-left'
  | 'center-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right';

export interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  width: number;
  positionPreset: PositionPreset;
  paddingX: number;
  paddingY: number;
  wordWrap: boolean;
}

export type BackgroundType = 'solid' | 'transparent' | 'gradient' | 'pattern';

export interface SolidBackground {
  type: 'solid';
  color: string;
}

export interface TransparentBackground {
  type: 'transparent';
}

export interface GradientBackground {
  type: 'gradient';
  direction:
    | 'to-r'
    | 'to-br'
    | 'to-b'
    | 'to-bl'
    | 'to-l'
    | 'to-tl'
    | 'to-t'
    | 'to-tr';
  from: string;
  to: string;
  via?: string;
}

export interface PatternBackground {
  type: 'pattern';
  patternId: string;
  primaryColor: string;
  backgroundColor: string;
  opacity: number;
  size: number;
  spacing: number;
}

export type BackgroundConfig =
  | SolidBackground
  | TransparentBackground
  | GradientBackground
  | PatternBackground;

export interface CanvasSettings {
  width: number;
  height: number;
  background: BackgroundConfig;
  borderRadius: number;
}

export interface AppState {
  textElements: TextElement[];
  canvasSettings: CanvasSettings;
  selectedElementId: string | null;
  isLoading: boolean;
  error: string | null;
  exportStatus: 'idle' | 'loading' | 'success' | 'error';
  fonts: FontsState;
}

export type FontFamily = string;

export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  kind: string;
}

export interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
  error?: string;
}

export interface FontSearchOptions {
  sort?: 'alpha' | 'date' | 'popularity' | 'style' | 'trending';
  category?: GoogleFont['category'];
  subset?: string;
}

export interface FontsState {
  fonts: GoogleFont[];
  popularFonts: GoogleFont[];
  searchQuery: string;
  selectedCategory: GoogleFont['category'] | '';
  isLoading: boolean;
  isLoadingFont: boolean;
  error: string | null;
  loadedFonts: Set<string>;
}

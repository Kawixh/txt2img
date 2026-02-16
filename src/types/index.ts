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

export type TextElement = {
  id: string;
  layerType: 'text';
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontStyle: 'normal' | 'italic' | 'oblique';
  fontSlant?: number;
  fontStretch?: number;
  textDecoration: {
    underline: boolean;
    overline: boolean;
    strikethrough: boolean;
  };
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'small-caps';
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  fontVariationSettings?: Record<string, number>;
  width: number;
  positionPreset: PositionPreset;
  paddingX: number;
  paddingY: number;
  wordWrap: boolean;
};

export type ShapeKind =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'star';

export type ShapeElement = {
  id: string;
  layerType: 'shape';
  shape: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string;
};

export type CanvasImageElement = {
  id: string;
  layerType: 'image';
  src: string;
  mimeType: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
};

export type BackgroundType = 'solid' | 'transparent' | 'gradient' | 'pattern';

export type SolidBackground = {
  type: 'solid';
  color: string;
};

export type TransparentBackground = {
  type: 'transparent';
};

export type GradientBackground = {
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
};

export type PatternBackground = {
  type: 'pattern';
  patternId: string;
  primaryColor: string;
  backgroundColor: string;
  opacity: number;
  size: number;
  spacing: number;
};

export type BackgroundConfig =
  | SolidBackground
  | TransparentBackground
  | GradientBackground
  | PatternBackground;

export type CanvasSettings = {
  width: number;
  height: number;
  background: BackgroundConfig;
  borderRadius: number;
};

export type AppState = {
  textElements: TextElement[];
  shapeElements: ShapeElement[];
  imageElements: CanvasImageElement[];
  graphicLayerOrder: string[];
  canvasSettings: CanvasSettings;
  selectedElementId: string | null;
  isLoading: boolean;
  error: string | null;
  exportStatus: 'idle' | 'loading' | 'success' | 'error';
  fonts: FontsState;
};

export type FontFamily = string;

export type GoogleFont = {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  kind: string;
  axes?: Array<{
    tag: string;
    min: number;
    max: number;
    defaultValue: number;
  }>;
};

export type GoogleFontsResponse = {
  kind: string;
  items: GoogleFont[];
  error?: string;
};

export type FontSearchOptions = {
  sort?: 'alpha' | 'date' | 'popularity' | 'style' | 'trending';
  category?: GoogleFont['category'];
  subset?: string;
};

export type FontsState = {
  fonts: GoogleFont[];
  popularFonts: GoogleFont[];
  searchQuery: string;
  selectedCategory: GoogleFont['category'] | 'variable' | '';
  isLoading: boolean;
  isLoadingFont: boolean;
  currentlyLoadingFont: string | null;
  error: string | null;
  loadedFonts: Set<string>;
};

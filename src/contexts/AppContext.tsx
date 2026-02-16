'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import {
  AppState,
  BackgroundConfig,
  CanvasImageElement,
  CanvasSettings,
  FontSearchOptions,
  GoogleFont,
  ShapeElement,
  TextElement,
} from '@/types';
import { googleFontsManager } from '@/lib/google-fonts';

type AppActions = {
  addTextElement: (content: string) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  removeTextElement: (id: string) => void;
  reorderTextElement: (id: string, targetIndex: number) => void;
  reorderGraphicLayer: (id: string, targetIndex: number) => void;
  addShapeElement: (shape: ShapeElement['shape']) => void;
  updateShapeElement: (id: string, updates: Partial<ShapeElement>) => void;
  removeShapeElement: (id: string) => void;
  addImageElement: (
    image: {
      src: string;
      mimeType: string;
      name: string;
      width: number;
      height: number;
      x?: number;
      y?: number;
      rotation?: number;
      opacity?: number;
    },
  ) => void;
  updateImageElement: (
    id: string,
    updates: Partial<CanvasImageElement>,
  ) => void;
  removeImageElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  updateBackground: (background: BackgroundConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setExportStatus: (status: AppState['exportStatus']) => void;
  fetchFonts: (options?: FontSearchOptions) => Promise<void>;
  loadFont: (
    fontFamily: string,
    options?: { variants?: string[]; axes?: GoogleFont['axes'] },
  ) => Promise<void>;
  setFontsLoading: (loading: boolean) => void;
  setFontLoading: (loading: boolean, fontFamily?: string) => void;
  setFontsError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: GoogleFont['category'] | 'variable' | '') => void;
  getFilteredFonts: () => GoogleFont[];
};

type AppStore = {
  getState: () => AppState;
  subscribe: (listener: () => void) => () => void;
  actions: AppActions;
};

type AppAction =
  | { type: 'ADD_TEXT_ELEMENT'; payload: { content: string } }
  | {
      type: 'UPDATE_TEXT_ELEMENT';
      payload: { id: string; updates: Partial<TextElement> };
    }
  | { type: 'REMOVE_TEXT_ELEMENT'; payload: { id: string } }
  | {
      type: 'REORDER_TEXT_ELEMENT';
      payload: { id: string; targetIndex: number };
    }
  | {
      type: 'REORDER_GRAPHIC_LAYER';
      payload: { id: string; targetIndex: number };
    }
  | {
      type: 'ADD_SHAPE_ELEMENT';
      payload: { shape: ShapeElement['shape'] };
    }
  | {
      type: 'UPDATE_SHAPE_ELEMENT';
      payload: { id: string; updates: Partial<ShapeElement> };
    }
  | { type: 'REMOVE_SHAPE_ELEMENT'; payload: { id: string } }
  | {
      type: 'ADD_IMAGE_ELEMENT';
      payload: {
        src: string;
        mimeType: string;
        name: string;
        width: number;
        height: number;
        x?: number;
        y?: number;
        rotation?: number;
        opacity?: number;
      };
    }
  | {
      type: 'UPDATE_IMAGE_ELEMENT';
      payload: { id: string; updates: Partial<CanvasImageElement> };
    }
  | { type: 'REMOVE_IMAGE_ELEMENT'; payload: { id: string } }
  | { type: 'SELECT_ELEMENT'; payload: { id: string | null } }
  | {
      type: 'UPDATE_CANVAS_SETTINGS';
      payload: { settings: Partial<CanvasSettings> };
    }
  | { type: 'UPDATE_BACKGROUND'; payload: { background: BackgroundConfig } }
  | { type: 'SET_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | {
      type: 'SET_EXPORT_STATUS';
      payload: { status: AppState['exportStatus'] };
    }
  | { type: 'SET_FONTS'; payload: { fonts: GoogleFont[] } }
  | { type: 'SET_POPULAR_FONTS'; payload: { fonts: GoogleFont[] } }
  | { type: 'SET_FONTS_LOADING'; payload: { loading: boolean } }
  | {
      type: 'SET_FONT_LOADING';
      payload: { loading: boolean; fontFamily?: string };
    }
  | { type: 'SET_FONTS_ERROR'; payload: { error: string | null } }
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | {
      type: 'SET_SELECTED_CATEGORY';
      payload: { category: GoogleFont['category'] | 'variable' | '' };
    }
  | { type: 'ADD_LOADED_FONT'; payload: { fontFamily: string } };

const initialState: AppState = {
  textElements: [],
  shapeElements: [],
  imageElements: [],
  graphicLayerOrder: [],
  canvasSettings: {
    width: 800,
    height: 600,
    background: { type: 'solid', color: '#ffffff' },
    borderRadius: 16,
  },
  selectedElementId: null,
  isLoading: false,
  error: null,
  exportStatus: 'idle',
  fonts: {
    fonts: [],
    popularFonts: [],
    searchQuery: '',
    selectedCategory: '',
    isLoading: false,
    isLoadingFont: false,
    currentlyLoadingFont: null,
    error: null,
    loadedFonts: new Set(),
  },
};

const createElementId = (prefix: 'text' | 'shape' | 'image') => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const getDefaultShapeColor = (shape: ShapeElement['shape']) => {
  switch (shape) {
    case 'circle':
      return '#0ea5e9';
    case 'triangle':
      return '#f97316';
    case 'diamond':
      return '#f43f5e';
    case 'hexagon':
      return '#14b8a6';
    case 'star':
      return '#f59e0b';
    default:
      return '#7c3aed';
  }
};

const getDefaultShapeSize = (shape: ShapeElement['shape']) => {
  switch (shape) {
    case 'triangle':
      return { width: 240, height: 220 };
    case 'star':
      return { width: 240, height: 240 };
    case 'hexagon':
      return { width: 240, height: 210 };
    default:
      return { width: 220, height: 220 };
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TEXT_ELEMENT': {
      const newElement: TextElement = {
        id: createElementId('text'),
        layerType: 'text',
        content: action.payload.content,
        x: 50,
        y: 50,
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 400,
        fontStyle: 'normal',
        fontSlant: 0,
        fontStretch: 100,
        textDecoration: { underline: false, overline: false, strikethrough: false },
        textTransform: 'none',
        lineHeight: 1.2,
        letterSpacing: 0,
        wordSpacing: 0,
        fontVariationSettings: {},
        color: '#141414',
        textAlign: 'left',
        width: 260,
        positionPreset: 'manual',
        paddingX: 0,
        paddingY: 0,
        wordWrap: true,
      };
      return {
        ...state,
        textElements: [...state.textElements, newElement],
        selectedElementId: newElement.id,
      };
    }
    case 'UPDATE_TEXT_ELEMENT': {
      return {
        ...state,
        textElements: state.textElements.map((element) =>
          element.id === action.payload.id
            ? { ...element, ...action.payload.updates }
            : element,
        ),
      };
    }
    case 'REMOVE_TEXT_ELEMENT': {
      return {
        ...state,
        textElements: state.textElements.filter(
          (element) => element.id !== action.payload.id,
        ),
        selectedElementId:
          state.selectedElementId === action.payload.id
            ? null
            : state.selectedElementId,
      };
    }
    case 'REORDER_TEXT_ELEMENT': {
      const currentIndex = state.textElements.findIndex(
        (element) => element.id === action.payload.id,
      );

      if (currentIndex === -1) {
        return state;
      }

      const targetIndex = Math.max(
        0,
        Math.min(state.textElements.length - 1, action.payload.targetIndex),
      );

      if (currentIndex === targetIndex) {
        return state;
      }

      const reordered = [...state.textElements];
      const [movedElement] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, movedElement);

      return {
        ...state,
        textElements: reordered,
      };
    }
    case 'REORDER_GRAPHIC_LAYER': {
      const fallbackOrder = [
        ...state.shapeElements.map((element) => element.id),
        ...state.imageElements.map((element) => element.id),
      ];
      const activeOrder =
        state.graphicLayerOrder.length > 0 ? state.graphicLayerOrder : fallbackOrder;
      const currentIndex = activeOrder.findIndex(
        (layerId) => layerId === action.payload.id,
      );

      if (currentIndex === -1) {
        return state;
      }

      const targetIndex = Math.max(
        0,
        Math.min(activeOrder.length - 1, action.payload.targetIndex),
      );

      if (currentIndex === targetIndex) {
        return state;
      }

      const reordered = [...activeOrder];
      const [movedLayer] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, movedLayer);

      return {
        ...state,
        graphicLayerOrder: reordered,
      };
    }
    case 'ADD_SHAPE_ELEMENT': {
      const shape = action.payload.shape;
      const { width, height } = getDefaultShapeSize(shape);
      const newShape: ShapeElement = {
        id: createElementId('shape'),
        layerType: 'shape',
        shape,
        width,
        height,
        x: Math.max(0, (state.canvasSettings.width - width) / 2),
        y: Math.max(0, (state.canvasSettings.height - height) / 2),
        rotation: 0,
        opacity: 1,
        fill: getDefaultShapeColor(shape),
      };

      return {
        ...state,
        shapeElements: [...state.shapeElements, newShape],
        graphicLayerOrder: [...state.graphicLayerOrder, newShape.id],
        selectedElementId: newShape.id,
      };
    }
    case 'UPDATE_SHAPE_ELEMENT': {
      return {
        ...state,
        shapeElements: state.shapeElements.map((element) =>
          element.id === action.payload.id
            ? { ...element, ...action.payload.updates }
            : element,
        ),
      };
    }
    case 'REMOVE_SHAPE_ELEMENT': {
      return {
        ...state,
        shapeElements: state.shapeElements.filter(
          (element) => element.id !== action.payload.id,
        ),
        graphicLayerOrder: state.graphicLayerOrder.filter(
          (layerId) => layerId !== action.payload.id,
        ),
        selectedElementId:
          state.selectedElementId === action.payload.id
            ? null
            : state.selectedElementId,
      };
    }
    case 'ADD_IMAGE_ELEMENT': {
      const imageWidth = Math.max(24, action.payload.width);
      const imageHeight = Math.max(24, action.payload.height);
      const newImage: CanvasImageElement = {
        id: createElementId('image'),
        layerType: 'image',
        src: action.payload.src,
        mimeType: action.payload.mimeType,
        name: action.payload.name,
        width: imageWidth,
        height: imageHeight,
        x:
          action.payload.x ??
          Math.max(0, (state.canvasSettings.width - imageWidth) / 2),
        y:
          action.payload.y ??
          Math.max(0, (state.canvasSettings.height - imageHeight) / 2),
        rotation: action.payload.rotation ?? 0,
        opacity: action.payload.opacity ?? 1,
      };

      return {
        ...state,
        imageElements: [...state.imageElements, newImage],
        graphicLayerOrder: [...state.graphicLayerOrder, newImage.id],
        selectedElementId: newImage.id,
      };
    }
    case 'UPDATE_IMAGE_ELEMENT': {
      return {
        ...state,
        imageElements: state.imageElements.map((element) =>
          element.id === action.payload.id
            ? { ...element, ...action.payload.updates }
            : element,
        ),
      };
    }
    case 'REMOVE_IMAGE_ELEMENT': {
      return {
        ...state,
        imageElements: state.imageElements.filter(
          (element) => element.id !== action.payload.id,
        ),
        graphicLayerOrder: state.graphicLayerOrder.filter(
          (layerId) => layerId !== action.payload.id,
        ),
        selectedElementId:
          state.selectedElementId === action.payload.id
            ? null
            : state.selectedElementId,
      };
    }
    case 'SELECT_ELEMENT': {
      return {
        ...state,
        selectedElementId: action.payload.id,
      };
    }
    case 'UPDATE_CANVAS_SETTINGS': {
      return {
        ...state,
        canvasSettings: { ...state.canvasSettings, ...action.payload.settings },
      };
    }
    case 'UPDATE_BACKGROUND': {
      return {
        ...state,
        canvasSettings: {
          ...state.canvasSettings,
          background: action.payload.background,
        },
      };
    }
    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload.loading,
      };
    }
    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload.error,
      };
    }
    case 'SET_EXPORT_STATUS': {
      return {
        ...state,
        exportStatus: action.payload.status,
      };
    }
    case 'SET_FONTS': {
      return {
        ...state,
        fonts: {
          ...state.fonts,
          fonts: action.payload.fonts,
        },
      };
    }
    case 'SET_POPULAR_FONTS': {
      return {
        ...state,
        fonts: {
          ...state.fonts,
          popularFonts: action.payload.fonts,
        },
      };
    }
    case 'SET_FONTS_LOADING': {
      return {
        ...state,
        fonts: {
          ...state.fonts,
          isLoading: action.payload.loading,
        },
      };
    }
    case 'SET_FONT_LOADING': {
      return {
        ...state,
        fonts: {
          ...state.fonts,
          isLoadingFont: action.payload.loading,
          currentlyLoadingFont: action.payload.loading
            ? action.payload.fontFamily || null
            : null,
        },
      };
    }
    case 'SET_FONTS_ERROR': {
      return {
        ...state,
        fonts: {
          ...state.fonts,
          error: action.payload.error,
        },
      };
    }
    case 'SET_SEARCH_QUERY': {
      return {
        ...state,
        fonts: {
          ...state.fonts,
          searchQuery: action.payload.query,
        },
      };
    }
    case 'SET_SELECTED_CATEGORY': {
      return {
        ...state,
        fonts: {
          ...state.fonts,
          selectedCategory: action.payload.category,
        },
      };
    }
    case 'ADD_LOADED_FONT': {
      const newLoadedFonts = new Set(state.fonts.loadedFonts);
      newLoadedFonts.add(action.payload.fontFamily);
      return {
        ...state,
        fonts: {
          ...state.fonts,
          loadedFonts: newLoadedFonts,
        },
      };
    }
    default:
      return state;
  }
}

function createAppStore(): AppStore {
  let state = initialState;
  const listeners = new Set<() => void>();

  const getState = () => state;

  const setState = (nextState: AppState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
  };

  const dispatch = (action: AppAction) => {
    setState(appReducer(state, action));
  };

  const actions: AppActions = {
    addTextElement: (content: string) => {
      dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { content } });
    },
    updateTextElement: (id: string, updates: Partial<TextElement>) => {
      dispatch({ type: 'UPDATE_TEXT_ELEMENT', payload: { id, updates } });
    },
    removeTextElement: (id: string) => {
      dispatch({ type: 'REMOVE_TEXT_ELEMENT', payload: { id } });
    },
    reorderTextElement: (id: string, targetIndex: number) => {
      dispatch({ type: 'REORDER_TEXT_ELEMENT', payload: { id, targetIndex } });
    },
    reorderGraphicLayer: (id: string, targetIndex: number) => {
      dispatch({
        type: 'REORDER_GRAPHIC_LAYER',
        payload: { id, targetIndex },
      });
    },
    addShapeElement: (shape: ShapeElement['shape']) => {
      dispatch({ type: 'ADD_SHAPE_ELEMENT', payload: { shape } });
    },
    updateShapeElement: (id: string, updates: Partial<ShapeElement>) => {
      dispatch({ type: 'UPDATE_SHAPE_ELEMENT', payload: { id, updates } });
    },
    removeShapeElement: (id: string) => {
      dispatch({ type: 'REMOVE_SHAPE_ELEMENT', payload: { id } });
    },
    addImageElement: (image) => {
      dispatch({ type: 'ADD_IMAGE_ELEMENT', payload: image });
    },
    updateImageElement: (
      id: string,
      updates: Partial<CanvasImageElement>,
    ) => {
      dispatch({ type: 'UPDATE_IMAGE_ELEMENT', payload: { id, updates } });
    },
    removeImageElement: (id: string) => {
      dispatch({ type: 'REMOVE_IMAGE_ELEMENT', payload: { id } });
    },
    selectElement: (id: string | null) => {
      dispatch({ type: 'SELECT_ELEMENT', payload: { id } });
    },
    updateCanvasSettings: (settings: Partial<CanvasSettings>) => {
      dispatch({ type: 'UPDATE_CANVAS_SETTINGS', payload: { settings } });
    },
    updateBackground: (background: BackgroundConfig) => {
      dispatch({ type: 'UPDATE_BACKGROUND', payload: { background } });
    },
    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: { loading } });
    },
    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: { error } });
    },
    setExportStatus: (status: AppState['exportStatus']) => {
      dispatch({ type: 'SET_EXPORT_STATUS', payload: { status } });
    },
    fetchFonts: async (options?: FontSearchOptions) => {
      dispatch({ type: 'SET_FONTS_LOADING', payload: { loading: true } });
      dispatch({ type: 'SET_FONTS_ERROR', payload: { error: null } });

      try {
        const fonts = await googleFontsManager.fetchFonts(options);
        dispatch({ type: 'SET_FONTS', payload: { fonts } });

        if (options?.sort === 'popularity' || !options) {
          dispatch({
            type: 'SET_POPULAR_FONTS',
            payload: { fonts: fonts.slice(0, 50) },
          });
        }

        if (fonts.length === 0) {
          console.warn('No Google Fonts available, using fallback system fonts');
        }
      } catch (error) {
        console.warn('Google Fonts API error, falling back to system fonts:', error);
        dispatch({ type: 'SET_FONTS', payload: { fonts: [] } });
      } finally {
        dispatch({ type: 'SET_FONTS_LOADING', payload: { loading: false } });
      }
    },
    loadFont: async (
      fontFamily: string,
      options?: { variants?: string[]; axes?: GoogleFont['axes'] },
    ) => {
      const alreadyLoaded = state.fonts.loadedFonts.has(fontFamily);
      const hasAxes = Boolean(options?.axes && options.axes.length > 0);

      if (alreadyLoaded && !hasAxes) {
        return;
      }

      dispatch({
        type: 'SET_FONT_LOADING',
        payload: { loading: true, fontFamily },
      });

      try {
        await googleFontsManager.loadFont(fontFamily, options);
        if (!alreadyLoaded) {
          dispatch({ type: 'ADD_LOADED_FONT', payload: { fontFamily } });
        }
      } catch (error) {
        console.error('Failed to load font:', error);
      } finally {
        dispatch({ type: 'SET_FONT_LOADING', payload: { loading: false } });
      }
    },
    setFontsLoading: (loading: boolean) => {
      dispatch({ type: 'SET_FONTS_LOADING', payload: { loading } });
    },
    setFontLoading: (loading: boolean, fontFamily?: string) => {
      dispatch({ type: 'SET_FONT_LOADING', payload: { loading, fontFamily } });
    },
    setFontsError: (error: string | null) => {
      dispatch({ type: 'SET_FONTS_ERROR', payload: { error } });
    },
    setSearchQuery: (query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } });
    },
    setSelectedCategory: (category: GoogleFont['category'] | 'variable' | '') => {
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: { category } });
    },
    getFilteredFonts: () => {
      let fonts = state.fonts.fonts;

      if (state.fonts.selectedCategory) {
        if (state.fonts.selectedCategory === 'variable') {
          fonts = fonts.filter((font) => font.axes && font.axes.length > 0);
        } else {
          fonts = googleFontsManager.filterFontsByCategory(
            fonts,
            state.fonts.selectedCategory as GoogleFont['category'],
          );
        }
      }

      if (state.fonts.searchQuery) {
        fonts = googleFontsManager.searchFonts(fonts, state.fonts.searchQuery);
      }

      return fonts;
    },
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, subscribe, actions };
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createAppStore(), []);

  return (
    <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore<T>(
  selector: (state: AppState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useContext(AppStoreContext);

  if (!store) {
    throw new Error('useAppStore must be used within an AppProvider');
  }

  const lastSelectionRef = useRef<T | undefined>(undefined);
  const hasSelectionRef = useRef(false);

  const getSnapshot = useCallback(() => {
    const next = selector(store.getState());

    if (hasSelectionRef.current) {
      const prev = lastSelectionRef.current as T;
      if (isEqual(prev, next)) {
        return prev;
      }
    }

    hasSelectionRef.current = true;
    lastSelectionRef.current = next;
    return next;
  }, [isEqual, selector, store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function useAppActions(): AppActions {
  const store = useContext(AppStoreContext);

  if (!store) {
    throw new Error('useAppActions must be used within an AppProvider');
  }

  return store.actions;
}

// Legacy convenience hook (avoid in new code).
export function useApp() {
  const state = useAppStore((current) => current);
  const actions = useAppActions();

  return useMemo(
    () => ({
      state,
      ...actions,
    }),
    [actions, state],
  );
}

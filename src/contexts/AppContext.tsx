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
  CanvasSettings,
  FontSearchOptions,
  GoogleFont,
  TextElement,
} from '@/types';
import { googleFontsManager } from '@/lib/google-fonts';

type AppActions = {
  addTextElement: (content: string) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  removeTextElement: (id: string) => void;
  reorderTextElement: (id: string, targetIndex: number) => void;
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

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TEXT_ELEMENT': {
      const newElement: TextElement = {
        id: Date.now().toString(),
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

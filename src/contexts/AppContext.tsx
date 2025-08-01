'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  AppState,
  TextElement,
  CanvasSettings,
  BackgroundConfig,
  GoogleFont,
  FontSearchOptions,
} from '@/types';
import { googleFontsManager } from '@/lib/google-fonts';

interface AppContextType {
  state: AppState;
  addTextElement: (content: string) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  removeTextElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  updateBackground: (background: BackgroundConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setExportStatus: (status: AppState['exportStatus']) => void;
  // Font management
  fetchFonts: (options?: FontSearchOptions) => Promise<void>;
  loadFont: (fontFamily: string, variants?: string[]) => Promise<void>;
  setFontsLoading: (loading: boolean) => void;
  setFontLoading: (loading: boolean) => void;
  setFontsError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: GoogleFont['category'] | '') => void;
  getFilteredFonts: () => GoogleFont[];
}

type AppAction =
  | { type: 'ADD_TEXT_ELEMENT'; payload: { content: string } }
  | {
      type: 'UPDATE_TEXT_ELEMENT';
      payload: { id: string; updates: Partial<TextElement> };
    }
  | { type: 'REMOVE_TEXT_ELEMENT'; payload: { id: string } }
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
  | { type: 'SET_FONT_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_FONTS_ERROR'; payload: { error: string | null } }
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | { type: 'SET_SELECTED_CATEGORY'; payload: { category: GoogleFont['category'] | '' } }
  | { type: 'ADD_LOADED_FONT'; payload: { fontFamily: string } };

const initialState: AppState = {
  textElements: [],
  canvasSettings: {
    width: 800,
    height: 600,
    background: { type: 'solid', color: '#ffffff' },
    borderRadius: 0,
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
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        textAlign: 'left',
        width: 200,
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue: AppContextType = {
    state,
    addTextElement: (content: string) => {
      dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { content } });
    },
    updateTextElement: (id: string, updates: Partial<TextElement>) => {
      dispatch({ type: 'UPDATE_TEXT_ELEMENT', payload: { id, updates } });
    },
    removeTextElement: (id: string) => {
      dispatch({ type: 'REMOVE_TEXT_ELEMENT', payload: { id } });
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
    // Font management functions
    fetchFonts: async (options?: FontSearchOptions) => {
      dispatch({ type: 'SET_FONTS_LOADING', payload: { loading: true } });
      dispatch({ type: 'SET_FONTS_ERROR', payload: { error: null } });
      
      try {
        const fonts = await googleFontsManager.fetchFonts(options);
        dispatch({ type: 'SET_FONTS', payload: { fonts } });
        
        if (options?.sort === 'popularity' || !options) {
          dispatch({ type: 'SET_POPULAR_FONTS', payload: { fonts: fonts.slice(0, 50) } });
        }
        
        // If no fonts were fetched (API not configured), don't set an error
        if (fonts.length === 0) {
          console.warn('No Google Fonts available, using fallback system fonts');
        }
      } catch (error) {
        console.warn('Google Fonts API error, falling back to system fonts:', error);
        // Don't set an error state for API configuration issues
        dispatch({ type: 'SET_FONTS', payload: { fonts: [] } });
      } finally {
        dispatch({ type: 'SET_FONTS_LOADING', payload: { loading: false } });
      }
    },
    loadFont: async (fontFamily: string, variants?: string[]) => {
      dispatch({ type: 'SET_FONT_LOADING', payload: { loading: true } });
      
      try {
        await googleFontsManager.loadFont(fontFamily, variants);
        dispatch({ type: 'ADD_LOADED_FONT', payload: { fontFamily } });
      } catch (error) {
        console.error('Failed to load font:', error);
      } finally {
        dispatch({ type: 'SET_FONT_LOADING', payload: { loading: false } });
      }
    },
    setFontsLoading: (loading: boolean) => {
      dispatch({ type: 'SET_FONTS_LOADING', payload: { loading } });
    },
    setFontLoading: (loading: boolean) => {
      dispatch({ type: 'SET_FONT_LOADING', payload: { loading } });
    },
    setFontsError: (error: string | null) => {
      dispatch({ type: 'SET_FONTS_ERROR', payload: { error } });
    },
    setSearchQuery: (query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } });
    },
    setSelectedCategory: (category: GoogleFont['category'] | '') => {
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: { category } });
    },
    getFilteredFonts: () => {
      let fonts = state.fonts.fonts;
      
      // Filter by category
      if (state.fonts.selectedCategory) {
        fonts = googleFontsManager.filterFontsByCategory(fonts, state.fonts.selectedCategory);
      }
      
      // Filter by search query
      if (state.fonts.searchQuery) {
        fonts = googleFontsManager.searchFonts(fonts, state.fonts.searchQuery);
      }
      
      return fonts;
    },
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

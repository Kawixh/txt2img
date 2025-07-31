'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, TextElement, CanvasSettings, BackgroundConfig } from '@/types'

interface AppContextType {
  state: AppState
  addTextElement: (content: string) => void
  updateTextElement: (id: string, updates: Partial<TextElement>) => void
  removeTextElement: (id: string) => void
  selectElement: (id: string | null) => void
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void
  updateBackground: (background: BackgroundConfig) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setExportStatus: (status: AppState['exportStatus']) => void
}

type AppAction = 
  | { type: 'ADD_TEXT_ELEMENT'; payload: { content: string } }
  | { type: 'UPDATE_TEXT_ELEMENT'; payload: { id: string; updates: Partial<TextElement> } }
  | { type: 'REMOVE_TEXT_ELEMENT'; payload: { id: string } }
  | { type: 'SELECT_ELEMENT'; payload: { id: string | null } }
  | { type: 'UPDATE_CANVAS_SETTINGS'; payload: { settings: Partial<CanvasSettings> } }
  | { type: 'UPDATE_BACKGROUND'; payload: { background: BackgroundConfig } }
  | { type: 'SET_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'SET_EXPORT_STATUS'; payload: { status: AppState['exportStatus'] } }

const initialState: AppState = {
  textElements: [],
  canvasSettings: {
    width: 800,
    height: 600,
    background: { type: 'solid', color: '#ffffff' },
    borderRadius: 0
  },
  selectedElementId: null,
  isLoading: false,
  error: null,
  exportStatus: 'idle'
}

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
        textAlign: 'left'
      }
      return {
        ...state,
        textElements: [...state.textElements, newElement],
        selectedElementId: newElement.id
      }
    }
    case 'UPDATE_TEXT_ELEMENT': {
      return {
        ...state,
        textElements: state.textElements.map(element =>
          element.id === action.payload.id
            ? { ...element, ...action.payload.updates }
            : element
        )
      }
    }
    case 'REMOVE_TEXT_ELEMENT': {
      return {
        ...state,
        textElements: state.textElements.filter(element => element.id !== action.payload.id),
        selectedElementId: state.selectedElementId === action.payload.id ? null : state.selectedElementId
      }
    }
    case 'SELECT_ELEMENT': {
      return {
        ...state,
        selectedElementId: action.payload.id
      }
    }
    case 'UPDATE_CANVAS_SETTINGS': {
      return {
        ...state,
        canvasSettings: { ...state.canvasSettings, ...action.payload.settings }
      }
    }
    case 'UPDATE_BACKGROUND': {
      return {
        ...state,
        canvasSettings: { ...state.canvasSettings, background: action.payload.background }
      }
    }
    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload.loading
      }
    }
    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload.error
      }
    }
    case 'SET_EXPORT_STATUS': {
      return {
        ...state,
        exportStatus: action.payload.status
      }
    }
    default:
      return state
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const contextValue: AppContextType = {
    state,
    addTextElement: (content: string) => {
      dispatch({ type: 'ADD_TEXT_ELEMENT', payload: { content } })
    },
    updateTextElement: (id: string, updates: Partial<TextElement>) => {
      dispatch({ type: 'UPDATE_TEXT_ELEMENT', payload: { id, updates } })
    },
    removeTextElement: (id: string) => {
      dispatch({ type: 'REMOVE_TEXT_ELEMENT', payload: { id } })
    },
    selectElement: (id: string | null) => {
      dispatch({ type: 'SELECT_ELEMENT', payload: { id } })
    },
    updateCanvasSettings: (settings: Partial<CanvasSettings>) => {
      dispatch({ type: 'UPDATE_CANVAS_SETTINGS', payload: { settings } })
    },
    updateBackground: (background: BackgroundConfig) => {
      dispatch({ type: 'UPDATE_BACKGROUND', payload: { background } })
    },
    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: { loading } })
    },
    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: { error } })
    },
    setExportStatus: (status: AppState['exportStatus']) => {
      dispatch({ type: 'SET_EXPORT_STATUS', payload: { status } })
    }
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
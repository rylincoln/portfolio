import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react'

type GlobeFocus = {
  coordinates: [number, number] | null // [longitude, latitude]
  previousCoordinates: [number, number] | null
  label: string | null
  transitionStart: number | null
}

type GlobeFocusContextType = {
  focus: GlobeFocus
  setFocus: (coords: [number, number], label: string) => void
  clearFocus: () => void
}

const GlobeFocusContext = createContext<GlobeFocusContextType | null>(null)

export function GlobeFocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocusState] = useState<GlobeFocus>({
    coordinates: null,
    previousCoordinates: null,
    label: null,
    transitionStart: null,
  })

  const currentCoordsRef = useRef<[number, number] | null>(null)

  const setFocus = useCallback((coords: [number, number], label: string) => {
    const previous = currentCoordsRef.current
    currentCoordsRef.current = coords
    setFocusState({
      coordinates: coords,
      previousCoordinates: previous,
      label,
      transitionStart: performance.now(),
    })
  }, [])

  const clearFocus = useCallback(() => {
    // Don't clear currentCoordsRef - we need it to track previous location for trails
    setFocusState({
      coordinates: null,
      previousCoordinates: null,
      label: null,
      transitionStart: null,
    })
  }, [])

  return (
    <GlobeFocusContext.Provider value={{ focus, setFocus, clearFocus }}>
      {children}
    </GlobeFocusContext.Provider>
  )
}

export function useGlobeFocus() {
  const context = useContext(GlobeFocusContext)
  if (!context) {
    throw new Error('useGlobeFocus must be used within a GlobeFocusProvider')
  }
  return context
}

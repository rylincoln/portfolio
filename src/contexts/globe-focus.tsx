import { createContext, useContext, useState, type ReactNode } from 'react'

type GlobeFocus = {
  coordinates: [number, number] | null // [longitude, latitude]
  label: string | null
}

type GlobeFocusContextType = {
  focus: GlobeFocus
  setFocus: (focus: GlobeFocus) => void
  clearFocus: () => void
}

const GlobeFocusContext = createContext<GlobeFocusContextType | null>(null)

export function GlobeFocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocusState] = useState<GlobeFocus>({
    coordinates: null,
    label: null,
  })

  const setFocus = (newFocus: GlobeFocus) => {
    setFocusState(newFocus)
  }

  const clearFocus = () => {
    setFocusState({ coordinates: null, label: null })
  }

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

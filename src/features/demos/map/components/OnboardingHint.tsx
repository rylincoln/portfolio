import { useEffect, useState, useCallback } from 'react'
import { X, MapPin } from 'lucide-react'

const STORAGE_KEY = 'air-quality-map-onboarding-dismissed'

interface OnboardingHintProps {
  onDismiss?: () => void
}

export function OnboardingHint({ onDismiss }: OnboardingHintProps) {
  const [visible, setVisible] = useState(false)

  const handleDismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
    onDismiss?.()
  }, [onDismiss])

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      setVisible(true)

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [handleDismiss])

  if (!visible) return null

  return (
    <div
      className="
        absolute top-4 left-1/2 -translate-x-1/2 z-20
        max-w-sm w-[calc(100%-2rem)]
        bg-background/95 backdrop-blur-sm
        border rounded-lg shadow-lg
        p-4
        animate-in fade-in slide-in-from-top-2 duration-300
      "
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-sm">Explore Real-Time Air Quality</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Click any station marker on the map to view live air quality data across Colorado.
          </p>
        </div>
      </div>
    </div>
  )
}

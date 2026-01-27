import { Radio } from 'lucide-react'

interface MobileSummaryPillProps {
  isLive: boolean
  stationCount: number
  onClick: () => void
}

export function MobileSummaryPill({ isLive, stationCount, onClick }: MobileSummaryPillProps) {
  return (
    <button
      onClick={onClick}
      className="
        absolute top-4 left-1/2 -translate-x-1/2 z-10
        flex items-center gap-2 px-4 py-2
        bg-background/80 backdrop-blur-sm
        border rounded-full shadow-lg
        text-sm font-medium
        hover:bg-background/90 transition-colors
      "
    >
      {isLive ? (
        <>
          <Radio className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Live</span>
        </>
      ) : (
        <span className="text-yellow-500">Demo</span>
      )}
      <span className="text-muted-foreground">•</span>
      <span>{stationCount} stations</span>
    </button>
  )
}

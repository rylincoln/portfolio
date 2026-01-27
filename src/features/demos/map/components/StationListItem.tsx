import { Badge } from '@/components/ui/badge'
import { getCategoryColor } from '../utils/aqi'
import type { DisplayStation } from '../types'

interface StationListItemProps {
  station: DisplayStation
  isSelected: boolean
  isFocused?: boolean
  onSelect: (station: DisplayStation) => void
}

export function StationListItem({ station, isSelected, isFocused, onSelect }: StationListItemProps) {
  const color = getCategoryColor(station.category)

  return (
    <button
      onClick={() => onSelect(station)}
      className={`
        w-full text-left px-3 py-2.5 rounded-md transition-all duration-200
        hover:bg-muted/50
        ${isSelected ? 'bg-muted/30' : ''}
        ${isFocused ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
      `}
      style={{
        borderLeft: isSelected ? `4px solid ${color}` : '4px solid transparent',
      }}
      role="option"
      aria-selected={isSelected}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="font-medium text-sm truncate">{station.name}</span>
        </div>
        <Badge
          className="text-white text-xs flex-shrink-0"
          style={{ background: color }}
        >
          {station.aqi}
        </Badge>
      </div>
      <div className="flex items-center justify-between mt-0.5 ml-4.5 pl-0.5">
        <span className="text-xs text-muted-foreground truncate">
          {station.location}
        </span>
        <span className="text-xs text-muted-foreground capitalize flex-shrink-0 ml-2">
          {station.category.toLowerCase().replace('-', ' ')}
        </span>
      </div>
    </button>
  )
}

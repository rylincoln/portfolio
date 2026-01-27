import { useMemo } from 'react'
import { getCategoryColor, type FilterCategory } from '../utils/aqi'
import type { DisplayStation } from '../types'

interface StatsBarProps {
  stations: DisplayStation[]
  filter: FilterCategory
  onFilterChange: (filter: FilterCategory) => void
}

interface CategoryStats {
  good: number
  moderate: number
  unhealthy: number
}

export function StatsBar({ stations, filter, onFilterChange }: StatsBarProps) {
  const stats = useMemo<CategoryStats>(() => {
    return stations.reduce(
      (acc, station) => {
        if (station.aqi <= 50) acc.good++
        else if (station.aqi <= 100) acc.moderate++
        else acc.unhealthy++
        return acc
      },
      { good: 0, moderate: 0, unhealthy: 0 }
    )
  }, [stations])

  const bestStation = useMemo(() => {
    if (stations.length === 0) return null
    return stations.reduce((best, s) => (s.aqi < best.aqi ? s : best))
  }, [stations])

  const worstStation = useMemo(() => {
    if (stations.length === 0) return null
    return stations.reduce((worst, s) => (s.aqi > worst.aqi ? s : worst))
  }, [stations])

  const categories: { key: FilterCategory; label: string; count: number; color: string }[] = [
    { key: 'good', label: 'Good', count: stats.good, color: getCategoryColor('Good') },
    { key: 'moderate', label: 'Moderate', count: stats.moderate, color: getCategoryColor('Moderate') },
    { key: 'unhealthy', label: 'Unhealthy+', count: stats.unhealthy, color: getCategoryColor('Unhealthy') },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {categories.map(({ key, label, count, color }) => (
        <button
          key={key}
          onClick={() => onFilterChange(filter === key ? 'all' : key)}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all
            ${filter === key
              ? 'text-white ring-2 ring-offset-2 ring-offset-background'
              : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }
          `}
          style={{
            backgroundColor: filter === key ? color : undefined,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: filter !== key ? color : 'white' }}
          />
          <span className="font-medium">{count}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}

      {filter !== 'all' && (
        <button
          onClick={() => onFilterChange('all')}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Clear
        </button>
      )}

      <div className="flex-1" />

      {bestStation && worstStation && (
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Best: <span className="font-medium text-foreground">{bestStation.name}</span>{' '}
            <span style={{ color: getCategoryColor(bestStation.category) }}>({bestStation.aqi})</span>
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span>
            Worst: <span className="font-medium text-foreground">{worstStation.name}</span>{' '}
            <span style={{ color: getCategoryColor(worstStation.category) }}>({worstStation.aqi})</span>
          </span>
        </div>
      )}
    </div>
  )
}

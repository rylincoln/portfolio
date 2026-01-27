import { useEffect, useRef, useState, useCallback } from 'react'
import { StationListItem } from './StationListItem'
import type { DisplayStation } from '../types'

interface StationListProps {
  stations: DisplayStation[]
  selectedStation: DisplayStation | null
  onSelectStation: (station: DisplayStation) => void
}

export function StationList({ stations, selectedStation, onSelectStation }: StationListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  // Sort by AQI descending (worst first)
  const sortedStations = [...stations].sort((a, b) => b.aqi - a.aqi)

  // Scroll selected item into view
  useEffect(() => {
    if (selectedStation && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [selectedStation])

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-station-item]')
      const focusedItem = items[focusedIndex] as HTMLElement
      if (focusedItem) {
        focusedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [focusedIndex])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (sortedStations.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev < sortedStations.length - 1 ? prev + 1 : 0
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : sortedStations.length - 1
          return next
        })
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < sortedStations.length) {
          onSelectStation(sortedStations[focusedIndex])
        }
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(sortedStations.length - 1)
        break
    }
  }, [sortedStations, focusedIndex, onSelectStation])

  // Reset focus index when stations change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [stations])

  if (stations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No stations found
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="space-y-1 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Air quality stations"
    >
      {sortedStations.map((station, index) => (
        <div
          key={station.id}
          ref={selectedStation?.id === station.id ? selectedRef : null}
          data-station-item
        >
          <StationListItem
            station={station}
            isSelected={selectedStation?.id === station.id}
            isFocused={focusedIndex === index}
            onSelect={onSelectStation}
          />
        </div>
      ))}
    </div>
  )
}

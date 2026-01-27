import { useEffect, useRef, useState, useMemo } from 'react'
import { useQueryState, parseAsInteger } from 'nuqs'
import { useQuery } from '@tanstack/react-query'
import maplibregl from 'maplibre-gl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import type { CareerPosition } from '@/types/career'
import careerFallback from '@/data/career.json'

function getYearFromDate(dateStr: string): number {
  return parseInt(dateStr.split('-')[0], 10)
}

export default function MapTimeline() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const { data: positions = careerFallback as CareerPosition[] } = useQuery({
    queryKey: ['career'],
    queryFn: async () => {
      const res = await fetch('/api/career')
      if (!res.ok) throw new Error('Failed to fetch career data')
      return res.json() as Promise<CareerPosition[]>
    },
    staleTime: 5 * 60 * 1000,
  })

  const maxYear = new Date().getFullYear()

  const minYear = positions.length > 0
    ? Math.min(...positions.map(p => getYearFromDate(p.startDate)))
    : 2006

  const [year, setYear] = useQueryState('year', parseAsInteger.withDefault(maxYear))
  // Clamp year to valid range
  const selectedYear = Math.max(minYear, Math.min(maxYear, year))
  const [selectedPosition, setSelectedPosition] = useState<CareerPosition | null>(null)

  // Get positions active in selected year
  const getActivePositions = useMemo(() => {
    return (year: number) => {
      return positions.filter(p => {
        const start = getYearFromDate(p.startDate)
        const end = p.endDate ? getYearFromDate(p.endDate) : maxYear
        return year >= start && year <= end
      })
    }
  }, [positions, maxYear])

  // Compute initial selected position when positions change
  const initialPosition = useMemo(() => {
    if (positions.length === 0) return null
    const active = getActivePositions(maxYear)
    return active.length > 0 ? active[active.length - 1] : null
  }, [positions, getActivePositions, maxYear])

  // Sync selected position with initial when it changes and no position is selected
  const currentPosition = selectedPosition ?? initialPosition

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-102, 35],
      zoom: 4.5,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Get positions active in selected year
    const activePositions = getActivePositions(selectedYear)

    // Add markers for active positions
    activePositions.forEach(position => {
      const el = document.createElement('div')
      el.className = 'w-4 h-4 rounded-full bg-primary border-2 border-background cursor-pointer transition-transform hover:scale-125'

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(position.coordinates)
        .addTo(map.current!)

      el.addEventListener('click', () => {
        setSelectedPosition(position)
        map.current?.flyTo({
          center: position.coordinates,
          zoom: 8,
          duration: 1000,
        })
      })

      markersRef.current.push(marker)
    })
  }, [selectedYear, getActivePositions])

  return (
    <div className="space-y-4">
      <div ref={mapContainer} className="h-[400px] rounded-lg overflow-hidden relative z-0" />

      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{minYear}</span>
          <span className="text-lg font-bold text-primary">{selectedYear}</span>
          <span className="text-sm text-muted-foreground">{maxYear}</span>
        </div>
        <Slider
          value={[selectedYear]}
          min={minYear}
          max={maxYear}
          step={1}
          onValueChange={([value]) => setYear(value)}
        />
      </div>

      {currentPosition && (
        <Card>
          <CardHeader>
            <CardTitle>{currentPosition.title}</CardTitle>
            <CardDescription>
              {currentPosition.company} | {currentPosition.location}
            </CardDescription>
            <CardDescription>
              {currentPosition.startDate} - {currentPosition.endDate ?? 'Present'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {currentPosition.accomplishments.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

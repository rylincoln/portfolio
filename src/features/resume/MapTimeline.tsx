import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import careerData from '@/data/career.json'
import type { CareerPosition } from '@/types/career'

const positions = careerData as CareerPosition[]

function getYearFromDate(dateStr: string): number {
  return parseInt(dateStr.split('-')[0], 10)
}

function getActivePositions(year: number, maxYear: number): CareerPosition[] {
  return positions.filter(p => {
    const start = getYearFromDate(p.startDate)
    const end = p.endDate ? getYearFromDate(p.endDate) : maxYear
    return year >= start && year <= end
  })
}

function getInitialPosition(maxYear: number): CareerPosition | null {
  const active = getActivePositions(maxYear, maxYear)
  return active.length > 0 ? active[active.length - 1] : null
}

export default function MapTimeline() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const minYear = Math.min(...positions.map(p => getYearFromDate(p.startDate)))
  const maxYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = useState(maxYear)
  const [selectedPosition, setSelectedPosition] = useState<CareerPosition | null>(() => getInitialPosition(maxYear))

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
    const activePositions = getActivePositions(selectedYear, maxYear)

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
  }, [selectedYear, maxYear])

  return (
    <div className="space-y-4">
      <div ref={mapContainer} className="h-[400px] rounded-lg overflow-hidden" />

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
          onValueChange={([value]) => setSelectedYear(value)}
        />
      </div>

      {selectedPosition && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedPosition.title}</CardTitle>
            <CardDescription>
              {selectedPosition.company} | {selectedPosition.location}
            </CardDescription>
            <CardDescription>
              {selectedPosition.startDate} - {selectedPosition.endDate ?? 'Present'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {selectedPosition.accomplishments.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import stationsData from '@/data/air-quality/stations.json'
import readingsData from '@/data/air-quality/readings.json'
import type { Station, Reading } from '@/types/air-quality'

const stations = stationsData as Station[]
const readings = readingsData as Reading[]

const categoryColors: Record<string, string> = {
  'good': '#22c55e',
  'moderate': '#eab308',
  'unhealthy-sensitive': '#f97316',
  'unhealthy': '#ef4444',
  'very-unhealthy': '#a855f7',
  'hazardous': '#7f1d1d',
}

function getLatestReading(stationId: string): Reading | undefined {
  return readings.find(r => r.stationId === stationId && r.parameter === 'pm25')
}

export default function AirQualityMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-105.5, 39.0],
      zoom: 6.5,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      stations.forEach(station => {
        const reading = getLatestReading(station.id)
        const color = reading ? categoryColors[reading.category] : '#666'

        const el = document.createElement('div')
        el.className = 'flex items-center justify-center cursor-pointer'
        el.style.width = '24px'
        el.style.height = '24px'
        el.innerHTML = `
          <div style="
            width: 16px;
            height: 16px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `

        new maplibregl.Marker({ element: el })
          .setLngLat(station.coordinates)
          .addTo(map.current!)

        el.addEventListener('click', () => {
          setSelectedStation(station)
          setSelectedReading(reading || null)
          map.current?.flyTo({
            center: station.coordinates,
            zoom: 10,
            duration: 1000,
          })
        })
      })
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      <div ref={mapContainer} className="lg:col-span-2 rounded-lg overflow-hidden" />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Colorado Air Quality</CardTitle>
            <CardDescription>
              Click a station to view details. Data from fallback dataset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryColors).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="capitalize">{cat.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedStation && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedStation.name}</CardTitle>
              <CardDescription>
                {selectedStation.city}, {selectedStation.state}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Elevation</div>
                <div>{selectedStation.elevation.toLocaleString()} m</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Parameters</div>
                <div className="flex flex-wrap gap-1">
                  {selectedStation.parameters.map(p => (
                    <Badge key={p} variant="secondary">{p.toUpperCase()}</Badge>
                  ))}
                </div>
              </div>
              {selectedReading && (
                <div>
                  <div className="text-sm text-muted-foreground">PM2.5 Reading</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{selectedReading.value}</span>
                    <span className="text-muted-foreground">{selectedReading.unit}</span>
                    <Badge
                      style={{
                        background: categoryColors[selectedReading.category],
                        color: 'white'
                      }}
                    >
                      AQI {selectedReading.aqi}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

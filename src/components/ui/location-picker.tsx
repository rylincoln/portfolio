import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Input } from './input'
import { Label } from './label'
import { Button } from './button'
import { MapPin, Search, Crosshair } from 'lucide-react'

type LocationPickerProps = {
  lng: string
  lat: string
  onCoordinatesChange: (lng: string, lat: string) => void
  locationName?: string
}

export function LocationPicker({ lng, lat, onCoordinatesChange, locationName }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const [searchQuery, setSearchQuery] = useState(locationName || '')
  const [isSearching, setIsSearching] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const initialLng = parseFloat(lng) || -98.5
    const initialLat = parseFloat(lat) || 39.8

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [initialLng, initialLat],
      zoom: lng && lat ? 8 : 3,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Add marker if coordinates exist
    if (lng && lat && !isNaN(parseFloat(lng)) && !isNaN(parseFloat(lat))) {
      marker.current = new maplibregl.Marker({ color: '#f59e0b' })
        .setLngLat([parseFloat(lng), parseFloat(lat)])
        .addTo(map.current)
    }

    // Click handler to set location
    map.current.on('click', (e) => {
      const { lng: clickLng, lat: clickLat } = e.lngLat

      // Update or create marker
      if (marker.current) {
        marker.current.setLngLat([clickLng, clickLat])
      } else if (map.current) {
        marker.current = new maplibregl.Marker({ color: '#f59e0b' })
          .setLngLat([clickLng, clickLat])
          .addTo(map.current)
      }

      onCoordinatesChange(clickLng.toFixed(4), clickLat.toFixed(4))
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update marker when coordinates change externally
  useEffect(() => {
    if (!map.current) return

    const parsedLng = parseFloat(lng)
    const parsedLat = parseFloat(lat)

    if (!isNaN(parsedLng) && !isNaN(parsedLat)) {
      if (marker.current) {
        marker.current.setLngLat([parsedLng, parsedLat])
      } else {
        marker.current = new maplibregl.Marker({ color: '#f59e0b' })
          .setLngLat([parsedLng, parsedLat])
          .addTo(map.current)
      }
    }
  }, [lng, lat])

  // Geocode search using Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim() || !map.current) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'User-Agent': 'PortfolioAdmin/1.0' } }
      )
      const results = await response.json()

      if (results.length > 0) {
        const { lon, lat: resultLat } = results[0]
        const parsedLng = parseFloat(lon)
        const parsedLat = parseFloat(resultLat)

        // Update map view
        map.current.flyTo({
          center: [parsedLng, parsedLat],
          zoom: 10,
          duration: 1500,
        })

        // Update or create marker
        if (marker.current) {
          marker.current.setLngLat([parsedLng, parsedLat])
        } else {
          marker.current = new maplibregl.Marker({ color: '#f59e0b' })
            .setLngLat([parsedLng, parsedLat])
            .addTo(map.current)
        }

        onCoordinatesChange(parsedLng.toFixed(4), parsedLat.toFixed(4))
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Center on current coordinates
  const handleCenterOnCoords = () => {
    if (!map.current) return

    const parsedLng = parseFloat(lng)
    const parsedLat = parseFloat(lat)

    if (!isNaN(parsedLng) && !isNaN(parsedLat)) {
      map.current.flyTo({
        center: [parsedLng, parsedLat],
        zoom: 10,
        duration: 1000,
      })
    }
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Location Coordinates
      </Label>

      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search for a place..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleSearch}
          disabled={isSearching}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCenterOnCoords}
          disabled={!lng || !lat}
          title="Center on current coordinates"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      {/* Map */}
      <div
        ref={mapContainer}
        className="h-64 rounded-lg border border-border overflow-hidden"
        style={{ cursor: 'crosshair' }}
      />

      {/* Coordinate inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Longitude</Label>
          <Input
            value={lng}
            onChange={(e) => onCoordinatesChange(e.target.value, lat)}
            placeholder="-105.0"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Latitude</Label>
          <Input
            value={lat}
            onChange={(e) => onCoordinatesChange(lng, e.target.value)}
            placeholder="39.7"
            className="font-mono text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click on the map to set coordinates, or search for a location
      </p>
    </div>
  )
}

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs'
import maplibregl from 'maplibre-gl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Radio, RefreshCw, X, Search } from 'lucide-react'
import stationsData from '@/data/air-quality/stations.json'
import readingsData from '@/data/air-quality/readings.json'
import type { Station, Reading } from '@/types/air-quality'
import { StationList } from './components/StationList'
import { StatsBar } from './components/StatsBar'
import { MobileBottomSheet } from './components/MobileBottomSheet'
import { MobileSummaryPill } from './components/MobileSummaryPill'
import { OnboardingHint } from './components/OnboardingHint'
import { LoadingSkeleton, MobileLoadingSkeleton } from './components/LoadingSkeleton'
import { createPopupHTML } from './components/StationPopup'
import { getCategoryColor, getMarkerSize, matchesFilter, filterCategories, type FilterCategory } from './utils/aqi'
import { useIsMobile } from './hooks/useMediaQuery'
import type { DisplayStation } from './types'

const fallbackStations = stationsData as Station[]
const fallbackReadings = readingsData as Reading[]

function getLatestReading(stationId: string): Reading | undefined {
  return fallbackReadings.find(r => r.stationId === stationId && r.parameter === 'pm25')
}

function convertFallbackToDisplay(): DisplayStation[] {
  return fallbackStations.map(station => {
    const reading = getLatestReading(station.id)
    return {
      id: station.id,
      name: station.name,
      location: `${station.city}, ${station.state}`,
      coordinates: station.coordinates,
      aqi: reading?.aqi ?? 0,
      category: reading?.category ?? 'good',
      pollutant: reading?.parameter ?? 'pm25',
      status: station.status,
    }
  })
}

interface AQICNStation {
  id: number
  name: string
  location: string
  coordinates: [number, number]
  aqi: number
  category: string
  pollutant: string
  lastUpdated: string
  status: string
}

const filterValues = filterCategories.map(c => c.value)

export default function AirQualityMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string | number, maplibregl.Marker>>(new Map())
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const [stationId, setStationId] = useQueryState('station', parseAsString)
  const [filter, setFilter] = useQueryState('filter', parseAsStringLiteral(filterValues).withDefault('all'))
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const isMobile = useIsMobile()

  const { data: liveStations, isLoading, isError, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['aqicn-stations'],
    queryFn: async () => {
      const res = await fetch('/api/aqicn/stations')
      if (!res.ok) throw new Error('Failed to fetch live air quality data')
      return res.json() as Promise<AQICNStation[]>
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  })

  const isLive = !!liveStations && liveStations.length > 0
  const allStations: DisplayStation[] = isLive
    ? liveStations.map(s => ({ ...s, lastUpdated: s.lastUpdated }))
    : convertFallbackToDisplay()

  // Filter stations by search and category
  const stations = useMemo(() => {
    return allStations.filter(station => {
      const matchesSearch = search
        ? station.name.toLowerCase().includes(search.toLowerCase()) ||
          station.location.toLowerCase().includes(search.toLowerCase())
        : true
      const matchesCategory = matchesFilter(station.aqi, filter as FilterCategory)
      return matchesSearch && matchesCategory
    })
  }, [allStations, search, filter])

  // Derive selected station from URL state
  const selectedStation = stationId
    ? allStations.find(s => String(s.id) === stationId) ?? null
    : null

  // Close popup helper
  const closePopup = useCallback(() => {
    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }
  }, [])

  // Handle station selection - updates URL state
  const handleSelectStation = useCallback((station: DisplayStation) => {
    setStationId(String(station.id))
    closePopup()

    if (map.current) {
      map.current.flyTo({
        center: station.coordinates,
        zoom: 10,
        duration: 1000,
      })
    }
  }, [closePopup, setStationId])

  // Handle deselection - clears URL state
  const handleDeselect = useCallback(() => {
    setStationId(null)
    closePopup()
  }, [closePopup, setStationId])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDeselect()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDeselect])

  // Fly to selected station on initial load from URL
  const initialFlyRef = useRef(false)
  useEffect(() => {
    if (selectedStation && map.current && !initialFlyRef.current) {
      initialFlyRef.current = true
      // Wait for map to be ready
      if (map.current.loaded()) {
        map.current.flyTo({
          center: selectedStation.coordinates,
          zoom: 10,
          duration: 1000,
        })
      } else {
        map.current.on('load', () => {
          map.current?.flyTo({
            center: selectedStation.coordinates,
            zoom: 10,
            duration: 1000,
          })
        })
      }
    }
  }, [selectedStation])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-105.5, 39.0],
      zoom: 6.5,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Deselect on map click (not on markers)
    map.current.on('click', (e) => {
      // Check if click was on a marker by checking if originalEvent target has marker class
      const target = e.originalEvent.target as HTMLElement
      if (!target.closest('.station-marker')) {
        handleDeselect()
      }
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [handleDeselect])

  // Track which stations are filtered for dimming effect
  const filteredStationIds = useMemo(() => {
    return new Set(stations.map(s => s.id))
  }, [stations])

  // Update markers when stations data changes
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    const addMarkers = () => {
      allStations.forEach(station => {
        const color = getCategoryColor(station.category)
        const size = getMarkerSize(station.aqi)
        const isSelected = selectedStation?.id === station.id
        const isFiltered = filteredStationIds.has(station.id)

        const el = document.createElement('div')
        el.className = 'station-marker flex items-center justify-center cursor-pointer'
        el.style.width = `${size + 8}px`
        el.style.height = `${size + 8}px`
        el.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out'
        el.style.opacity = isFiltered ? '1' : '0.3'

        const markerDot = document.createElement('div')
        markerDot.style.width = `${size}px`
        markerDot.style.height = `${size}px`
        markerDot.style.background = color
        markerDot.style.border = '2px solid white'
        markerDot.style.borderRadius = '50%'
        markerDot.style.boxShadow = isSelected
          ? `0 0 0 3px ${color}40, 0 2px 4px rgba(0,0,0,0.3)`
          : '0 2px 4px rgba(0,0,0,0.3)'
        markerDot.style.transition = 'all 0.2s ease-out'
        markerDot.style.transform = isSelected ? 'scale(1.1)' : 'scale(1)'

        // Add pulse animation for markers with AQI > 50 (Moderate or worse)
        if (station.aqi > 50 && !isSelected) {
          markerDot.classList.add('station-marker-pulse')
          markerDot.style.color = `${color}40`
        }

        el.appendChild(markerDot)

        // Add native tooltip with station name (desktop only)
        el.title = `${station.name} - AQI: ${station.aqi}`

        // Hover effect
        el.addEventListener('mouseenter', () => {
          if (selectedStation?.id !== station.id) {
            markerDot.style.transform = 'scale(1.15)'
          }
        })
        el.addEventListener('mouseleave', () => {
          if (selectedStation?.id !== station.id) {
            markerDot.style.transform = 'scale(1)'
          }
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(station.coordinates)
          .addTo(map.current!)

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          closePopup()

          // Create and show popup
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15,
            className: 'station-popup-container',
          })
            .setLngLat(station.coordinates)
            .setHTML(createPopupHTML(station))
            .addTo(map.current!)

          popupRef.current = popup

          // Add event listeners to popup buttons
          setTimeout(() => {
            const popupEl = popup.getElement()
            const closeBtn = popupEl?.querySelector('.popup-close')
            const detailsBtn = popupEl?.querySelector('.popup-details')

            closeBtn?.addEventListener('click', closePopup)
            detailsBtn?.addEventListener('click', () => {
              handleSelectStation(station)
            })
          }, 0)
        })

        markersRef.current.set(station.id, marker)
      })
    }

    if (map.current.loaded()) {
      addMarkers()
    } else {
      map.current.on('load', addMarkers)
    }
  }, [allStations, selectedStation, filteredStationIds, closePopup, handleSelectStation])

  // Update selected marker styling and filter opacity
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      const markerDot = el.querySelector('div') as HTMLDivElement
      if (markerDot) {
        const station = allStations.find(s => s.id === id)
        const color = station ? getCategoryColor(station.category) : '#666'
        const isSelected = selectedStation?.id === id
        const isFiltered = filteredStationIds.has(id)

        el.style.opacity = isFiltered ? '1' : '0.3'
        markerDot.style.boxShadow = isSelected
          ? `0 0 0 3px ${color}40, 0 2px 4px rgba(0,0,0,0.3)`
          : '0 2px 4px rgba(0,0,0,0.3)'
        markerDot.style.transform = isSelected ? 'scale(1.1)' : 'scale(1)'
      }
    })
  }, [selectedStation, allStations, filteredStationIds])

  // Show loading skeleton during initial load
  if (isLoading && allStations.length === 0) {
    return isMobile ? <MobileLoadingSkeleton /> : <LoadingSkeleton />
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {/* Stats Bar - compact on mobile */}
        <div className="bg-card border rounded-lg px-3 py-2">
          <StatsBar
            stations={allStations}
            filter={filter as FilterCategory}
            onFilterChange={(f) => setFilter(f === 'all' ? null : f)}
          />
        </div>

        {/* Full-width map with floating pill */}
        <div className="relative h-[calc(100vh-200px)] min-h-[400px] rounded-lg overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />
          <OnboardingHint />
          <MobileSummaryPill
            isLive={isLive}
            stationCount={allStations.length}
            onClick={() => setBottomSheetOpen(true)}
          />
        </div>

        {/* Bottom sheet */}
        <MobileBottomSheet
          stations={stations}
          allStations={allStations}
          selectedStation={selectedStation}
          isLive={isLive}
          search={search}
          onSearchChange={setSearch}
          onSelectStation={(station) => {
            handleSelectStation(station)
            // Keep sheet open but scroll to top
          }}
          onDeselect={handleDeselect}
          open={bottomSheetOpen}
          onOpenChange={setBottomSheetOpen}
        />
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="flex flex-col gap-4">
      {/* Stats Bar */}
      <div className="bg-card border rounded-lg px-4 py-3">
        <StatsBar
          stations={allStations}
          filter={filter as FilterCategory}
          onFilterChange={(f) => setFilter(f === 'all' ? null : f)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        <div ref={mapContainer} className="lg:col-span-2 rounded-lg overflow-hidden relative z-0">
          <OnboardingHint />
        </div>

        <div className="flex flex-col gap-4 overflow-hidden">
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Colorado Air Quality</CardTitle>
                <button
                  onClick={() => refetch()}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <CardDescription className="flex items-center gap-2">
                {isLive ? (
                  <>
                    <Radio className="h-3 w-3 text-green-500" />
                    <span className="text-green-500 font-medium">Live</span>
                    <span>• {allStations.length} stations</span>
                    {dataUpdatedAt && (
                      <span className="text-xs">
                        • Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-yellow-500">
                      {isError ? 'API unavailable' : isLoading ? 'Loading...' : 'Demo data'}
                    </span>
                    <span>• {allStations.length} stations</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">AQI Legend:</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['Good', getCategoryColor('Good')],
                  ['Moderate', getCategoryColor('Moderate')],
                  ['Unhealthy for Sensitive', getCategoryColor('Unhealthy for Sensitive Groups')],
                  ['Unhealthy', getCategoryColor('Unhealthy')],
                  ['Very Unhealthy', getCategoryColor('Very Unhealthy')],
                  ['Hazardous', getCategoryColor('Hazardous')],
                ].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        {selectedStation && (
          <Card className="flex-shrink-0">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedStation.name}</CardTitle>
                  <CardDescription>{selectedStation.location}</CardDescription>
                </div>
                <button
                  onClick={handleDeselect}
                  className="p-1 rounded-md hover:bg-muted transition-colors -mr-1 -mt-1"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Air Quality Index</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-bold">{selectedStation.aqi}</span>
                  <Badge
                    className="text-white"
                    style={{ background: getCategoryColor(selectedStation.category) }}
                  >
                    {selectedStation.category}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Pollutant</div>
                  <Badge variant="secondary" className="mt-1">{selectedStation.pollutant}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={selectedStation.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                    {selectedStation.status}
                  </Badge>
                </div>
              </div>
              {selectedStation.lastUpdated && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Last reading: {new Date(selectedStation.lastUpdated).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 overflow-hidden flex flex-col min-h-0">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-medium">Stations</CardTitle>
              {stations.length !== allStations.length && (
                <span className="text-xs text-muted-foreground">
                  {stations.length} of {allStations.length}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stations..."
                value={search}
                onChange={(e) => setSearch(e.target.value || null)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1 pt-0">
            <StationList
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={handleSelectStation}
            />
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}

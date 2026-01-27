import { Drawer } from 'vaul'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, X, Radio } from 'lucide-react'
import { StationList } from './StationList'
import { getCategoryColor } from '../utils/aqi'
import type { DisplayStation } from '../types'

interface MobileBottomSheetProps {
  stations: DisplayStation[]
  allStations: DisplayStation[]
  selectedStation: DisplayStation | null
  isLive: boolean
  search: string
  onSearchChange: (value: string | null) => void
  onSelectStation: (station: DisplayStation) => void
  onDeselect: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileBottomSheet({
  stations,
  allStations,
  selectedStation,
  isLive,
  search,
  onSearchChange,
  onSelectStation,
  onDeselect,
  open,
  onOpenChange,
}: MobileBottomSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.15, 0.5, 0.9]}
      activeSnapPoint={selectedStation ? 0.9 : 0.5}
      modal={false}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background border-t rounded-t-xl"
          style={{ maxHeight: '90vh' }}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-3" />

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              {isLive ? (
                <>
                  <Radio className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">Live</span>
                  <span className="text-muted-foreground">• {allStations.length} stations</span>
                </>
              ) : (
                <span className="text-yellow-500">Demo data • {allStations.length} stations</span>
              )}
            </div>

            {/* Selected station card */}
            {selectedStation && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedStation.name}</CardTitle>
                      <CardDescription>{selectedStation.location}</CardDescription>
                    </div>
                    <button
                      onClick={onDeselect}
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

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stations..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value || null)}
                className="pl-8 h-9"
              />
            </div>

            {/* Station count */}
            {stations.length !== allStations.length && (
              <div className="text-xs text-muted-foreground mb-2">
                Showing {stations.length} of {allStations.length} stations
              </div>
            )}

            {/* Station list */}
            <StationList
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={onSelectStation}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

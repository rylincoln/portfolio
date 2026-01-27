import { useMemo } from 'react'
import { useQueryStates, parseAsString, parseAsStringLiteral } from 'nuqs'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Search } from 'lucide-react'
import stationsData from '@/data/air-quality/stations.json'
import readingsData from '@/data/air-quality/readings.json'
import type { Station, Reading, APIStation } from '@/types/air-quality'

const fallbackStations = stationsData as Station[]
const fallbackReadings = readingsData as Reading[]

// Unified display type
interface DisplayStation {
  id: string | number
  name: string
  location: string
  aqi: number
  category: string
  pollutant: string
  status: string
}

function getLatestReading(stationId: string): Reading | undefined {
  return fallbackReadings.find(r => r.stationId === stationId && r.parameter === 'pm25')
}

// Convert fallback data to display format
function convertFallbackToDisplay(): DisplayStation[] {
  return fallbackStations.map(station => {
    const reading = getLatestReading(station.id)
    return {
      id: station.id,
      name: station.name,
      location: `${station.city}, ${station.state}`,
      aqi: reading?.aqi ?? 0,
      category: reading?.category ?? 'good',
      pollutant: reading?.parameter ?? 'pm25',
      status: station.status,
    }
  })
}

// Convert API data to display format
function convertAPIToDisplay(apiStations: APIStation[]): DisplayStation[] {
  return apiStations.map(station => ({
    id: station.id,
    name: station.name,
    location: station.location,
    aqi: station.aqi,
    category: station.category,
    pollutant: station.pollutant,
    status: station.status,
  }))
}

const sortFields = ['name', 'location', 'aqi'] as const
const sortDirs = ['asc', 'desc'] as const

export default function DataExplorer() {
  const [{ q, status, sort, dir }, setFilters] = useQueryStates({
    q: parseAsString.withDefault(''),
    status: parseAsString.withDefault('all'),
    sort: parseAsStringLiteral(sortFields).withDefault('name'),
    dir: parseAsStringLiteral(sortDirs).withDefault('asc'),
  })

  const { data: stations = convertFallbackToDisplay() } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await fetch('/api/stations')
      if (!res.ok) throw new Error('Failed to fetch stations')
      const data = await res.json() as APIStation[]
      return convertAPIToDisplay(data)
    },
    staleTime: 5 * 60 * 1000,
  })

  const data = useMemo(() => {
    let result = [...stations]

    if (q) {
      const query = q.toLowerCase()
      result = result.filter(
        s => s.name.toLowerCase().includes(query) || s.location.toLowerCase().includes(query)
      )
    }

    if (status !== 'all') {
      result = result.filter(s => s.status === status)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sort === 'name') cmp = a.name.localeCompare(b.name)
      else if (sort === 'location') cmp = a.location.localeCompare(b.location)
      else if (sort === 'aqi') cmp = a.aqi - b.aqi
      return dir === 'asc' ? cmp : -cmp
    })

    return result
  }, [stations, q, status, sort, dir])

  const handleSort = (field: 'name' | 'location' | 'aqi') => {
    if (sort === field) {
      setFilters({ dir: dir === 'asc' ? 'desc' : 'asc' })
    } else {
      setFilters({ sort: field, dir: 'asc' })
    }
  }

  const exportCsv = () => {
    const headers = ['Name', 'Location', 'Status', 'AQI', 'Category', 'Pollutant']
    const rows = data.map(s => [
      s.name,
      s.location,
      s.status,
      s.aqi,
      s.category,
      s.pollutant,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stations.csv'
    a.click()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or city..."
                  value={q}
                  onChange={e => setFilters({ q: e.target.value || null })}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={status} onValueChange={v => setFilters({ status: v === 'all' ? null : v })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('name')}
                >
                  Name {sort === 'name' && (dir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('location')}
                >
                  Location {sort === 'location' && (dir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pollutant</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('aqi')}
                >
                  AQI {sort === 'aqi' && (dir === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(station => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>{station.location}</TableCell>
                  <TableCell>
                    <Badge variant={station.status === 'active' ? 'default' : 'secondary'}>
                      {station.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {station.pollutant}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{station.aqi}</span>
                      <Badge variant="outline" className="text-xs">
                        {station.category}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {data.length} of {stations.length} stations
      </div>
    </div>
  )
}

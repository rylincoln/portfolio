import { useState, useMemo } from 'react'
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
import type { Station, Reading } from '@/types/air-quality'

const stations = stationsData as Station[]
const readings = readingsData as Reading[]

interface StationWithReading extends Station {
  latestReading?: Reading
}

function getStationsWithReadings(): StationWithReading[] {
  return stations.map(station => ({
    ...station,
    latestReading: readings.find(r => r.stationId === station.id && r.parameter === 'pm25'),
  }))
}

export default function DataExplorer() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'name' | 'city' | 'aqi'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const data = useMemo(() => {
    let result = getStationsWithReadings()

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'city') cmp = a.city.localeCompare(b.city)
      else if (sortField === 'aqi') {
        const aAqi = a.latestReading?.aqi ?? 0
        const bAqi = b.latestReading?.aqi ?? 0
        cmp = aAqi - bAqi
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [search, statusFilter, sortField, sortDir])

  const handleSort = (field: 'name' | 'city' | 'aqi') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const exportCsv = () => {
    const headers = ['Name', 'City', 'State', 'Status', 'PM2.5', 'AQI', 'Category']
    const rows = data.map(s => [
      s.name,
      s.city,
      s.state,
      s.status,
      s.latestReading?.value ?? '',
      s.latestReading?.aqi ?? '',
      s.latestReading?.category ?? '',
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
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('city')}
                >
                  City {sortField === 'city' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Parameters</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('aqi')}
                >
                  PM2.5 / AQI {sortField === 'aqi' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(station => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>{station.city}, {station.state}</TableCell>
                  <TableCell>
                    <Badge variant={station.status === 'active' ? 'default' : 'secondary'}>
                      {station.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {station.parameters.slice(0, 3).map(p => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {station.parameters.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{station.parameters.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {station.latestReading ? (
                      <span>
                        {station.latestReading.value} {station.latestReading.unit} (AQI {station.latestReading.aqi})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
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

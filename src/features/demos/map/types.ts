// Unified station type for display
export interface DisplayStation {
  id: string | number
  name: string
  location: string
  coordinates: [number, number]
  aqi: number
  category: string
  pollutant: string
  status: string
  lastUpdated?: string
}

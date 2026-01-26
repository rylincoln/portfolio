export interface Station {
  id: string
  name: string
  city: string
  state: string
  coordinates: [number, number]
  elevation: number
  parameters: string[]
  status: 'active' | 'inactive'
}

export interface Reading {
  stationId: string
  parameter: string
  value: number
  unit: string
  timestamp: string
  aqi: number
  category: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous'
}

export type Pollutant = 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co'

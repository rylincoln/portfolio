import { Router } from 'express'

const router = Router()

// Colorado bounding box (roughly)
const COLORADO_BOUNDS = {
  south: 36.9,
  west: -109.1,
  north: 41.0,
  east: -102.0,
}

interface AQICNStation {
  lat: number
  lon: number
  uid: number
  aqi: string
  station: {
    name: string
    time: string
  }
}

interface AQICNResponse {
  status: string
  data: AQICNStation[]
}

// Get AQI category based on value
function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

// Get all air quality stations in Colorado from AQICN
router.get('/api/aqicn/stations', async (_req, res) => {
  const token = process.env.AQICN_API_TOKEN

  if (!token) {
    res.status(500).json({ error: 'AQICN API token not configured' })
    return
  }

  try {
    const { south, west, north, east } = COLORADO_BOUNDS
    const url = `https://api.waqi.info/map/bounds/?latlng=${south},${west},${north},${east}&token=${token}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`AQICN API error: ${response.status}`)
    }

    const data = await response.json() as AQICNResponse

    if (data.status !== 'ok') {
      throw new Error('AQICN API returned error status')
    }

    // Transform to our station format
    const stations = data.data
      .filter(s => s.aqi !== '-') // Filter out stations with no data
      .map(station => {
        const aqi = parseInt(station.aqi, 10) || 0
        return {
          id: station.uid,
          name: station.station.name.replace(', Colorado, USA', '').replace(', USA', ''),
          location: 'Colorado',
          coordinates: [station.lon, station.lat] as [number, number],
          aqi,
          category: getAQICategory(aqi),
          pollutant: 'PM2.5', // AQICN returns dominant pollutant AQI
          lastUpdated: station.station.time,
          status: 'active',
        }
      })

    res.json(stations)
  } catch (error) {
    console.error('Error fetching AQICN data:', error)
    res.status(500).json({ error: 'Failed to fetch air quality data' })
  }
})

// Get detailed data for a specific station
router.get('/api/aqicn/station/:uid', async (req, res) => {
  const token = process.env.AQICN_API_TOKEN
  const { uid } = req.params

  if (!token) {
    res.status(500).json({ error: 'AQICN API token not configured' })
    return
  }

  try {
    const url = `https://api.waqi.info/feed/@${uid}/?token=${token}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`AQICN API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'ok') {
      throw new Error('AQICN API returned error status')
    }

    res.json(data.data)
  } catch (error) {
    console.error('Error fetching station details:', error)
    res.status(500).json({ error: 'Failed to fetch station details' })
  }
})

export default router

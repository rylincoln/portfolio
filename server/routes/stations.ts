import { Router } from 'express'
import { db } from '../db/client.js'

const router = Router()

// Get all air quality stations
router.get('/api/stations', async (_req, res) => {
  try {
    const stations = await db.execute(`
      SELECT id, name, location, coordinates_lng, coordinates_lat,
             aqi, category, pollutant, last_updated, status
      FROM air_quality_stations
      ORDER BY name
    `)

    // Format response to match existing frontend expectations
    const result = stations.rows.map(station => ({
      id: station.id,
      name: station.name,
      location: station.location,
      coordinates: [station.coordinates_lng, station.coordinates_lat] as [number, number],
      aqi: station.aqi,
      category: station.category,
      pollutant: station.pollutant,
      lastUpdated: station.last_updated,
      status: station.status
    }))

    res.json(result)
  } catch (error) {
    console.error('Error fetching stations:', error)
    res.status(500).json({ error: 'Failed to fetch stations' })
  }
})

export default router

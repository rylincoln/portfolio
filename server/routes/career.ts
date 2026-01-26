import { Router } from 'express'
import { db } from '../db/client.js'

const router = Router()

// Get all career positions with accomplishments
router.get('/api/career', async (_req, res) => {
  try {
    const positions = await db.execute(`
      SELECT id, title, company, location, start_date, end_date,
             coordinates_lng, coordinates_lat
      FROM career_positions
      ORDER BY start_date ASC
    `)

    const accomplishments = await db.execute(`
      SELECT position_id, accomplishment, sort_order
      FROM career_accomplishments
      ORDER BY position_id, sort_order
    `)

    // Group accomplishments by position
    const accomplishmentsByPosition = new Map<number, string[]>()
    for (const row of accomplishments.rows) {
      const posId = row.position_id as number
      const acc = row.accomplishment as string
      if (!accomplishmentsByPosition.has(posId)) {
        accomplishmentsByPosition.set(posId, [])
      }
      accomplishmentsByPosition.get(posId)!.push(acc)
    }

    // Format response to match existing frontend expectations
    const result = positions.rows.map(pos => ({
      id: pos.id,
      title: pos.title,
      company: pos.company,
      location: pos.location,
      startDate: pos.start_date,
      endDate: pos.end_date,
      coordinates: [pos.coordinates_lng, pos.coordinates_lat] as [number, number],
      accomplishments: accomplishmentsByPosition.get(pos.id as number) || []
    }))

    res.json(result)
  } catch (error) {
    console.error('Error fetching career data:', error)
    res.status(500).json({ error: 'Failed to fetch career data' })
  }
})

export default router

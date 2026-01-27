import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../db/client.js'

const router = Router()

// Admin authentication middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const secretKey = process.env.ADMIN_SECRET_KEY?.trim()

  if (!secretKey) {
    res.status(500).json({ error: 'Admin authentication not configured' })
    return
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization required' })
    return
  }

  const token = authHeader.substring(7).trim()
  if (token !== secretKey) {
    res.status(403).json({ error: 'Invalid credentials' })
    return
  }

  next()
}

// Verify admin credentials
router.post('/api/admin/verify', (req: Request, res: Response) => {
  const { secretKey } = req.body
  const adminKey = process.env.ADMIN_SECRET_KEY?.trim()

  if (!secretKey) {
    res.status(400).json({ error: 'Secret key required' })
    return
  }

  if (!adminKey) {
    res.status(500).json({ error: 'Admin authentication not configured' })
    return
  }

  if (secretKey.trim() !== adminKey) {
    res.status(403).json({ error: 'Invalid credentials' })
    return
  }

  res.json({ success: true })
})

// Initialize/seed database
router.post('/api/admin/init-db', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const { initializeDatabase, seedDatabase } = await import('../db/schema.js')
    await initializeDatabase()
    await seedDatabase()
    res.json({ success: true, message: 'Database initialized and seeded' })
  } catch (error) {
    console.error('Error initializing database:', error)
    res.status(500).json({ error: 'Failed to initialize database' })
  }
})

// === Career Position Routes ===

router.post('/api/admin/career', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, company, location, startDate, endDate, coordinates, accomplishments } = req.body

    const result = await db.execute({
      sql: `INSERT INTO career_positions (title, company, location, start_date, end_date, coordinates_lng, coordinates_lat)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [title, company, location, startDate, endDate || null, coordinates[0], coordinates[1]]
    })

    const positionId = result.lastInsertRowid

    if (accomplishments && Array.isArray(accomplishments)) {
      for (let i = 0; i < accomplishments.length; i++) {
        await db.execute({
          sql: `INSERT INTO career_accomplishments (position_id, accomplishment, sort_order)
                VALUES (?, ?, ?)`,
          args: [positionId, accomplishments[i], i]
        })
      }
    }

    res.json({ success: true, id: positionId })
  } catch (error) {
    console.error('Error creating career position:', error)
    res.status(500).json({ error: 'Failed to create career position' })
  }
})

router.put('/api/admin/career/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10)
    const { title, company, location, startDate, endDate, coordinates, accomplishments } = req.body

    await db.execute({
      sql: `UPDATE career_positions
            SET title = ?, company = ?, location = ?, start_date = ?, end_date = ?,
                coordinates_lng = ?, coordinates_lat = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [title, company, location, startDate, endDate || null, coordinates[0], coordinates[1], id]
    })

    // Replace accomplishments
    await db.execute({ sql: 'DELETE FROM career_accomplishments WHERE position_id = ?', args: [id] })

    if (accomplishments && Array.isArray(accomplishments)) {
      for (let i = 0; i < accomplishments.length; i++) {
        await db.execute({
          sql: `INSERT INTO career_accomplishments (position_id, accomplishment, sort_order)
                VALUES (?, ?, ?)`,
          args: [id, accomplishments[i], i]
        })
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating career position:', error)
    res.status(500).json({ error: 'Failed to update career position' })
  }
})

router.delete('/api/admin/career/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10)
    await db.execute({ sql: 'DELETE FROM career_positions WHERE id = ?', args: [id] })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting career position:', error)
    res.status(500).json({ error: 'Failed to delete career position' })
  }
})

// === Skills Routes ===

router.post('/api/admin/skills', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category, proficiency } = req.body

    const result = await db.execute({
      sql: `INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)`,
      args: [name, category, proficiency]
    })

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error('Error creating skill:', error)
    res.status(500).json({ error: 'Failed to create skill' })
  }
})

router.put('/api/admin/skills/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10)
    const { name, category, proficiency } = req.body

    await db.execute({
      sql: `UPDATE skills SET name = ?, category = ?, proficiency = ? WHERE id = ?`,
      args: [name, category, proficiency, id]
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating skill:', error)
    res.status(500).json({ error: 'Failed to update skill' })
  }
})

router.delete('/api/admin/skills/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10)
    await db.execute({ sql: 'DELETE FROM skills WHERE id = ?', args: [id] })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting skill:', error)
    res.status(500).json({ error: 'Failed to delete skill' })
  }
})

// === Air Quality Station Routes ===

router.post('/api/admin/stations', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, location, coordinates, aqi, category, pollutant, lastUpdated, status } = req.body

    const result = await db.execute({
      sql: `INSERT INTO air_quality_stations (name, location, coordinates_lng, coordinates_lat, aqi, category, pollutant, last_updated, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, location, coordinates[0], coordinates[1], aqi, category, pollutant, lastUpdated, status || 'active']
    })

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error('Error creating station:', error)
    res.status(500).json({ error: 'Failed to create station' })
  }
})

router.put('/api/admin/stations/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10)
    const { name, location, coordinates, aqi, category, pollutant, lastUpdated, status } = req.body

    await db.execute({
      sql: `UPDATE air_quality_stations
            SET name = ?, location = ?, coordinates_lng = ?, coordinates_lat = ?,
                aqi = ?, category = ?, pollutant = ?, last_updated = ?, status = ?
            WHERE id = ?`,
      args: [name, location, coordinates[0], coordinates[1], aqi, category, pollutant, lastUpdated, status, id]
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating station:', error)
    res.status(500).json({ error: 'Failed to update station' })
  }
})

router.delete('/api/admin/stations/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10)
    await db.execute({ sql: 'DELETE FROM air_quality_stations WHERE id = ?', args: [id] })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting station:', error)
    res.status(500).json({ error: 'Failed to delete station' })
  }
})

export default router

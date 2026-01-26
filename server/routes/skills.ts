import { Router } from 'express'
import { db } from '../db/client.js'

const router = Router()

// Get all skills
router.get('/api/skills', async (_req, res) => {
  try {
    const skills = await db.execute(`
      SELECT id, name, category, proficiency
      FROM skills
      ORDER BY category, proficiency DESC
    `)

    res.json(skills.rows)
  } catch (error) {
    console.error('Error fetching skills:', error)
    res.status(500).json({ error: 'Failed to fetch skills' })
  }
})

export default router

import { Router } from 'express'
import { db } from '../db/client.js'

const router = Router()

// Map category names to slugs
const categoryToSlug: Record<string, string> = {
  'GIS/Spatial': 'gis-spatial',
  'Cloud/Infrastructure': 'cloud-infrastructure',
  'Data Platforms': 'data-platforms',
  'App Delivery': 'app-delivery',
  'Leadership': 'leadership',
}

// Get all skills
router.get('/api/skills', async (_req, res) => {
  try {
    const skills = await db.execute(`
      SELECT id, name, category, proficiency
      FROM skills
      ORDER BY category, proficiency DESC
    `)

    // Transform response to match frontend expectations
    const result = skills.rows.map(skill => ({
      id: skill.name, // Use name as ID for compatibility
      name: skill.name,
      category: categoryToSlug[skill.category as string] || skill.category,
      proficiency: skill.proficiency,
      yearsUsed: Math.round((skill.proficiency as number) * 3), // Estimate years
    }))

    res.json(result)
  } catch (error) {
    console.error('Error fetching skills:', error)
    res.status(500).json({ error: 'Failed to fetch skills' })
  }
})

export default router

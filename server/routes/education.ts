import { Router } from 'express'
import { db } from '../db/client.js'

const router = Router()

router.get('/api/education', async (_req, res) => {
  try {
    const education = await db.execute(`
      SELECT id, degree, field_of_study, institution, location,
             start_date, end_date, gpa, coordinates_lng, coordinates_lat,
             accomplishments
      FROM education
      ORDER BY end_date DESC
    `)

    const result = education.rows.map(row => ({
      id: row.id,
      degree: row.degree,
      fieldOfStudy: row.field_of_study,
      institution: row.institution,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      gpa: row.gpa,
      coordinates: row.coordinates_lng != null && row.coordinates_lat != null
        ? [row.coordinates_lng, row.coordinates_lat] as [number, number]
        : undefined,
      accomplishments: row.accomplishments ? JSON.parse(row.accomplishments as string) : []
    }))

    res.json(result)
  } catch (error) {
    console.error('Error fetching education:', error)
    res.status(500).json({ error: 'Failed to fetch education data' })
  }
})

export default router

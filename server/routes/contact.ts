import { Router, Request, Response } from 'express'
import { Resend } from 'resend'

const router = Router()

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in ms

function getRateLimitKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (entry.count >= RATE_LIMIT) {
    return true
  }

  entry.count++
  return false
}

router.post('/api/contact', async (req: Request, res: Response) => {
  const { name, email, message } = req.body

  // Validate required fields
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required' })
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' })
    return
  }

  // Check rate limit
  const rateLimitKey = getRateLimitKey(req)
  if (isRateLimited(rateLimitKey)) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' })
    return
  }

  // Check for Resend API key
  const resendApiKey = process.env.RESEND_API_KEY
  const contactEmail = process.env.CONTACT_EMAIL || 'ry@rlblais.org'

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    res.status(500).json({ error: 'Email service not configured' })
    return
  }

  try {
    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: contactEmail,
      subject: `Portfolio Contact: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      replyTo: email,
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Failed to send email:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router

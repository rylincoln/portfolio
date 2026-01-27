import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import careerFallback from '@/data/career.json'
import skillsFallback from '@/data/skills.json'

type CareerPosition = {
  id: number | string
  company: string
  title: string
  location: string
  startDate: string
  endDate: string | null
  accomplishments: string[]
}

type Skill = {
  id: number | string
  name: string
  category: string
}

const categoryLabels: Record<string, string> = {
  'gis-spatial': 'GIS/Spatial',
  'cloud-infrastructure': 'Cloud/Infrastructure',
  'data-platforms': 'Data Platforms',
  'app-delivery': 'App Delivery',
  'leadership': 'Leadership',
}

const categoryOrder = ['gis-spatial', 'cloud-infrastructure', 'data-platforms', 'app-delivery', 'leadership']

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = new Date(startDate)
  const startYear = start.getFullYear()

  if (!endDate) {
    return `${startYear}–Present`
  }

  const end = new Date(endDate)
  const endYear = end.getFullYear()

  return `${startYear}–${endYear}`
}

function groupSkillsByCategory(skills: Skill[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}

  for (const skill of skills) {
    if (!grouped[skill.category]) {
      grouped[skill.category] = []
    }
    grouped[skill.category].push(skill.name)
  }

  return grouped
}

async function fetchCareer(): Promise<CareerPosition[]> {
  const res = await fetch('/api/career')
  if (!res.ok) throw new Error('Failed to fetch career data')
  return res.json()
}

async function fetchSkills(): Promise<Skill[]> {
  const res = await fetch('/api/skills')
  if (!res.ok) throw new Error('Failed to fetch skills data')
  return res.json()
}

export default function Landing() {
  const { data: careerData } = useQuery({
    queryKey: ['career'],
    queryFn: fetchCareer,
    placeholderData: careerFallback as CareerPosition[],
    staleTime: 5 * 60 * 1000,
  })

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    placeholderData: skillsFallback as Skill[],
    staleTime: 5 * 60 * 1000,
  })

  const positions = [...(careerData || [])].reverse()
  const skillsByCategory = groupSkillsByCategory(skillsData || [])

  return (
    <div className="container max-w-3xl py-12 px-6">
      {/* Name & Title */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Ry Blaisdell</h1>
        <p className="text-xl text-muted-foreground mb-4">Technical Director & GIS/Software Leader</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          20+ years building geospatial and data-driven systems. I bridge technical implementation
          and business strategy, turning complex spatial and operational challenges into reliable
          platforms that teams trust and clients value.
        </p>
      </header>

      {/* Experience */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">Experience</h2>
        <div className="space-y-8">
          {positions.map((position) => (
            <div key={position.id}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-2">
                <div>
                  <span className="font-semibold">{position.title}</span>
                  <span className="text-muted-foreground"> @ {position.company}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateRange(position.startDate, position.endDate)} | {position.location}
                </div>
              </div>
              <ul className="list-disc list-outside ml-5 space-y-1 text-muted-foreground">
                {position.accomplishments.map((accomplishment) => (
                  <li key={accomplishment}>{accomplishment}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">Skills</h2>
        <div className="space-y-2">
          {categoryOrder.map((category) => (
            skillsByCategory[category] && (
              <p key={category}>
                <span className="font-medium">{categoryLabels[category]}:</span>{' '}
                <span className="text-muted-foreground">{skillsByCategory[category].join(', ')}</span>
              </p>
            )
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">Education</h2>
        <div>
          <p className="font-semibold">B.S. Environmental Geoscience</p>
          <p className="text-muted-foreground">Texas A&M University, 2010</p>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">Contact</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="mailto:ry@rlblais.org" className="text-primary hover:underline">
            ry@rlblais.org
          </a>
          <a href="https://linkedin.com/in/ryblaisdell" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            LinkedIn
          </a>
          <a href="https://github.com/rlblaisdell" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            GitHub
          </a>
          <Link to="/contact" className="text-primary hover:underline">
            Contact Form
          </Link>
        </div>
      </section>
    </div>
  )
}

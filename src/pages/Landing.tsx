import { useQuery } from '@tanstack/react-query'
import { Mail, Linkedin, Github, MapPin, Calendar } from 'lucide-react'
import careerFallback from '@/data/career.json'
import skillsFallback from '@/data/skills.json'
import { ExperienceTimeline } from '@/components/ui/experience-timeline'
import { SkillsChart } from '@/components/ui/skills-chart'
import { SectionConnector } from '@/components/ui/section-connector'
import { useGlobeFocus } from '@/contexts/globe-focus'

type CareerPosition = {
  id: number | string
  company: string
  title: string
  location: string
  coordinates: [number, number]
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold pl-4 border-l-2 border-primary mb-8">
      {children}
    </h2>
  )
}

function SkillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-sm px-2.5 py-1 border border-border rounded-sm bg-secondary/30 text-foreground/90">
      {children}
    </span>
  )
}

export default function Landing() {
  const { setFocus, clearFocus } = useGlobeFocus()

  const { data: careerData } = useQuery({
    queryKey: ['career'],
    queryFn: fetchCareer,
    placeholderData: careerFallback as unknown as CareerPosition[],
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

  const handlePositionHover = (position: CareerPosition) => {
    setFocus(position.coordinates, position.location)
  }

  const handlePositionLeave = () => {
    clearFocus()
  }

  // Prepare skills chart data
  const skillsChartData = categoryOrder
    .filter(cat => skillsByCategory[cat])
    .map(cat => ({
      name: categoryLabels[cat],
      count: skillsByCategory[cat].length,
    }))

  return (
    <div className="container max-w-3xl py-16 md:py-20 px-6">
      {/* Name & Title */}
      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Ry Blaisdell
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light mb-6">
          Technical Director & GIS/Software Leader
        </p>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          20+ years building geospatial and data-driven systems. I bridge technical implementation
          and business strategy, turning complex spatial and operational challenges into reliable
          platforms that teams trust and clients value.
        </p>
      </header>

      <SectionConnector />

      {/* Experience */}
      <section className="mb-16">
        <SectionHeader>Experience</SectionHeader>
        <div className="relative pl-8">
          <ExperienceTimeline positions={positions.length} />
          <div className="space-y-10">
            {positions.map((position) => (
              <article
                key={position.id}
                onMouseEnter={() => handlePositionHover(position)}
                onMouseLeave={handlePositionLeave}
                className="cursor-default transition-opacity duration-300 hover:opacity-100 group"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {position.title}
                  </h3>
                  <p className="text-foreground/80">
                    {position.company}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 font-mono text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateRange(position.startDate, position.endDate)}
                    </span>
                    <span className="flex items-center gap-1.5 group-hover:text-accent transition-colors">
                      <MapPin className="w-3.5 h-3.5" />
                      {position.location}
                    </span>
                  </div>
                </div>
                <ul className="list-disc list-outside ml-5 space-y-1.5 text-muted-foreground">
                  {position.accomplishments.map((accomplishment) => (
                    <li key={accomplishment} className="pl-1">{accomplishment}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SectionConnector />

      {/* Skills */}
      <section className="mb-16">
        <SectionHeader>Skills</SectionHeader>
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            {categoryOrder.map((category) => (
              skillsByCategory[category] && (
                <div key={category}>
                  <span className="font-mono text-sm text-muted-foreground block mb-2.5">
                    {categoryLabels[category]}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {skillsByCategory[category].map((skill) => (
                      <SkillTag key={skill}>{skill}</SkillTag>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
          <div className="hidden md:block">
            <SkillsChart categories={skillsChartData} />
          </div>
        </div>
      </section>

      <SectionConnector />

      {/* Education */}
      <section className="mb-16">
        <SectionHeader>Education</SectionHeader>
        <div>
          <p className="text-lg font-semibold">B.S. Environmental Geoscience</p>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            Texas A&M University · 2010
          </p>
        </div>
      </section>

      <SectionConnector />

      {/* Contact */}
      <section>
        <SectionHeader>Contact</SectionHeader>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <a
            href="mailto:ry@rlblais.org"
            className="group flex items-center gap-2 text-primary hover:underline underline-offset-4"
          >
            <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-mono text-sm text-muted-foreground group-hover:text-primary transition-colors">
              ry@rlblais.org
            </span>
          </a>
          <a
            href="https://linkedin.com/in/ryblaisdell"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-primary hover:underline underline-offset-4"
          >
            <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-mono text-sm text-muted-foreground group-hover:text-primary transition-colors">
              linkedin
            </span>
          </a>
          <a
            href="https://github.com/rlblaisdell"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-primary hover:underline underline-offset-4"
          >
            <Github className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-mono text-sm text-muted-foreground group-hover:text-primary transition-colors">
              github
            </span>
          </a>
        </div>
      </section>
    </div>
  )
}

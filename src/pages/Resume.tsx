import MapTimeline from '@/features/resume/MapTimeline'
import SkillsMatrix from '@/features/resume/SkillsMatrix'

export default function Resume() {
  return (
    <div className="container py-8 space-y-12">
      <section>
        <h1 className="text-3xl font-bold mb-2">Career Timeline</h1>
        <p className="text-muted-foreground mb-6">
          20+ years across Texas and Colorado, from GIS analyst to Technical Director
        </p>
        <MapTimeline />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-2">Skills</h2>
        <p className="text-muted-foreground mb-6">
          Filter by category or click a skill to see related experience
        </p>
        <SkillsMatrix />
      </section>
    </div>
  )
}

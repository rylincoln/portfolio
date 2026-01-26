import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import skillsData from '@/data/skills.json'
import type { Skill, SkillCategory } from '@/types/skills'

const skills = skillsData as Skill[]

const categoryLabels: Record<SkillCategory, string> = {
  'gis-spatial': 'GIS / Spatial',
  'cloud-infrastructure': 'Cloud / Infrastructure',
  'data-platforms': 'Data Platforms',
  'app-delivery': 'App Delivery',
  'leadership': 'Leadership',
}

const categoryColors: Record<SkillCategory, string> = {
  'gis-spatial': 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
  'cloud-infrastructure': 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
  'data-platforms': 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
  'app-delivery': 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
  'leadership': 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30',
}

interface SkillsMatrixProps {
  onSkillSelect?: (skill: Skill | null) => void
}

export default function SkillsMatrix({ onSkillSelect }: SkillsMatrixProps) {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const categories = Object.keys(categoryLabels) as SkillCategory[]
  const filteredSkills = selectedCategory
    ? skills.filter(s => s.category === selectedCategory)
    : skills

  const handleSkillClick = (skill: Skill) => {
    const newSelected = selectedSkill?.id === skill.id ? null : skill
    setSelectedSkill(newSelected)
    onSkillSelect?.(newSelected)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer',
            !selectedCategory && 'bg-primary/20 text-primary'
          )}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {categories.map(cat => (
          <Badge
            key={cat}
            variant="outline"
            className={cn(
              'cursor-pointer',
              selectedCategory === cat && categoryColors[cat]
            )}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            {categoryLabels[cat]}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredSkills.map(skill => (
          <div
            key={skill.id}
            onClick={() => handleSkillClick(skill)}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-colors',
              'hover:border-primary/50',
              selectedSkill?.id === skill.id && 'border-primary bg-primary/10'
            )}
          >
            <div className="font-medium text-sm">{skill.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(level => (
                  <div
                    key={level}
                    className={cn(
                      'w-2 h-2 rounded-full',
                      level <= skill.proficiency ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {skill.yearsUsed}y
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

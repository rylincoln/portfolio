export interface Skill {
  id: string
  name: string
  category: SkillCategory
  proficiency: 1 | 2 | 3 | 4 | 5
  yearsUsed: number
  relatedPositions: string[]
}

export type SkillCategory =
  | 'gis-spatial'
  | 'cloud-infrastructure'
  | 'data-platforms'
  | 'app-delivery'
  | 'leadership'

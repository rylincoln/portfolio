export interface Education {
  id: number
  degree: string
  fieldOfStudy: string
  institution: string
  location?: string
  startDate?: string
  endDate?: string
  gpa?: string
  coordinates?: [number, number]
  accomplishments?: string[]
}

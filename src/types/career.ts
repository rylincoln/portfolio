export interface CareerPosition {
  id: string
  company: string
  title: string
  location: string
  coordinates: [number, number] // [lng, lat]
  startDate: string
  endDate: string | null
  isRemote: boolean
  accomplishments: string[]
  skills: string[]
}

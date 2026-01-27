// AQI category types
export type AQICategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous'

// Lowercase variants from API
export type AQICategoryLower =
  | 'good'
  | 'moderate'
  | 'unhealthy-sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous'

// Color mapping for AQI categories
export const categoryColors: Record<string, string> = {
  'good': '#22c55e',
  'Good': '#22c55e',
  'moderate': '#eab308',
  'Moderate': '#eab308',
  'unhealthy-sensitive': '#f97316',
  'Unhealthy for Sensitive Groups': '#f97316',
  'unhealthy': '#ef4444',
  'Unhealthy': '#ef4444',
  'very-unhealthy': '#a855f7',
  'Very Unhealthy': '#a855f7',
  'hazardous': '#7f1d1d',
  'Hazardous': '#7f1d1d',
}

// Get color for a category
export function getCategoryColor(category: string): string {
  return categoryColors[category] || '#666666'
}

// Get marker size based on AQI value
export function getMarkerSize(aqi: number): number {
  if (aqi <= 50) return 14    // Good
  if (aqi <= 100) return 18   // Moderate
  if (aqi <= 150) return 20   // Unhealthy for Sensitive Groups
  return 22                   // Unhealthy+
}

// Get AQI category from value
export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

// Normalize category string to display format
export function normalizeCategory(category: string): AQICategory {
  const map: Record<string, AQICategory> = {
    'good': 'Good',
    'moderate': 'Moderate',
    'unhealthy-sensitive': 'Unhealthy for Sensitive Groups',
    'unhealthy': 'Unhealthy',
    'very-unhealthy': 'Very Unhealthy',
    'hazardous': 'Hazardous',
  }
  return map[category.toLowerCase()] || (category as AQICategory)
}

// Filter categories for UI
export const filterCategories = [
  { value: 'all', label: 'All' },
  { value: 'good', label: 'Good' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'unhealthy', label: 'Unhealthy+' },
] as const

export type FilterCategory = typeof filterCategories[number]['value']

// Check if station matches filter
export function matchesFilter(aqi: number, filter: FilterCategory): boolean {
  if (filter === 'all') return true
  if (filter === 'good') return aqi <= 50
  if (filter === 'moderate') return aqi > 50 && aqi <= 100
  if (filter === 'unhealthy') return aqi > 100
  return true
}

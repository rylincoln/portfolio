import { useState, useEffect } from 'react'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LocationPicker } from '@/components/ui/location-picker'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Database, LogOut, Pencil, MapPin, Loader2, Check } from 'lucide-react'

// ============================================================================
// Types & Schemas
// ============================================================================

const adminTabs = ['career', 'education', 'skills', 'stations'] as const

const careerSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  company: z.string().min(2, 'Company must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Use format YYYY-MM'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Use format YYYY-MM').or(z.literal('')).optional(),
  lng: z.string().refine(v => !isNaN(parseFloat(v)), 'Must be a valid number'),
  lat: z.string().refine(v => !isNaN(parseFloat(v)), 'Must be a valid number'),
  accomplishments: z.string().min(1, 'Add at least one accomplishment'),
})

const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  institution: z.string().min(1, 'Institution is required'),
  location: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Use format YYYY-MM').or(z.literal('')).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Use format YYYY-MM').or(z.literal('')).optional(),
  gpa: z.string().optional(),
  lng: z.string().refine(v => !v || !isNaN(parseFloat(v)), 'Must be a valid number').optional(),
  lat: z.string().refine(v => !v || !isNaN(parseFloat(v)), 'Must be a valid number').optional(),
  accomplishments: z.string().optional(),
})

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().min(1, 'Category is required'),
  proficiency: z.string().refine(v => {
    const n = parseInt(v)
    return n >= 1 && n <= 5
  }, 'Must be between 1 and 5'),
})

const stationSchema = z.object({
  name: z.string().min(1, 'Station name is required'),
  location: z.string().min(1, 'Location is required'),
  lng: z.string().refine(v => !isNaN(parseFloat(v)), 'Must be a valid number'),
  lat: z.string().refine(v => !isNaN(parseFloat(v)), 'Must be a valid number'),
  aqi: z.string().refine(v => !isNaN(parseInt(v)) && parseInt(v) >= 0, 'Must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  pollutant: z.string().min(1, 'Pollutant is required'),
  status: z.string().min(1, 'Status is required'),
})

type CareerFormValues = z.infer<typeof careerSchema>
type SkillFormValues = z.infer<typeof skillSchema>
type StationFormValues = z.infer<typeof stationSchema>
type EducationFormValues = z.infer<typeof educationSchema>

interface CareerPosition {
  id: number
  title: string
  company: string
  location: string
  startDate: string
  endDate: string | null
  coordinates: [number, number]
  accomplishments: string[]
}

interface Skill {
  id: number
  name: string
  category: string
  proficiency: number
}

interface Station {
  id: number
  name: string
  location: string
  coordinates: [number, number]
  aqi: number
  category: string
  pollutant: string
  lastUpdated: string
  status: string
}

interface EducationEntry {
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

const skillCategories = [
  { value: 'gis-spatial', label: 'GIS/Spatial' },
  { value: 'cloud-infrastructure', label: 'Cloud/Infrastructure' },
  { value: 'data-platforms', label: 'Data Platforms' },
  { value: 'app-delivery', label: 'App Delivery' },
  { value: 'leadership', label: 'Leadership' },
]

const aqiCategories = ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous']
const pollutants = ['PM2.5', 'PM10', 'Ozone', 'NO2', 'SO2', 'CO']

// ============================================================================
// Auth helpers
// ============================================================================

function getInitialAuthState() {
  const storedKey = sessionStorage.getItem('adminKey')
  return {
    isAuthenticated: !!storedKey,
    secretKey: storedKey || ''
  }
}

// ============================================================================
// Main Admin Component
// ============================================================================

export default function Admin() {
  const initialAuth = getInitialAuthState()
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuthenticated)
  const [secretKey, setSecretKey] = useState(initialAuth.secretKey)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [activeTab, setActiveTab] = useQueryState('tab', parseAsStringLiteral(adminTabs).withDefault('career'))

  const [careers, setCareers] = useState<CareerPosition[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [education, setEducation] = useState<EducationEntry[]>([])

  const loadData = async () => {
    try {
      const [careerRes, educationRes, skillsRes, stationsRes] = await Promise.all([
        fetch('/api/career'),
        fetch('/api/education'),
        fetch('/api/skills'),
        fetch('/api/stations')
      ])

      if (careerRes.ok) setCareers(await careerRes.json())
      if (educationRes.ok) setEducation(await educationRes.json())
      if (skillsRes.ok) setSkills(await skillsRes.json())
      if (stationsRes.ok) setStations(await stationsRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const handleLogin = async () => {
    setError('')
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKey.trim() })
      })

      if (res.ok) {
        sessionStorage.setItem('adminKey', secretKey.trim())
        setIsAuthenticated(true)
        loadData()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to authenticate')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminKey')
    setIsAuthenticated(false)
    setSecretKey('')
  }

  const initDatabase = async () => {
    setMessage('')
    try {
      const res = await fetch('/api/admin/init-db', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}` }
      })

      if (res.ok) {
        setMessage('Database initialized and seeded successfully!')
        loadData()
      } else {
        setMessage('Failed to initialize database')
      }
    } catch {
      setMessage('Error initializing database')
    }
  }

  const deleteCareer = async (id: number) => {
    if (!confirm('Delete this career position?')) return
    try {
      const res = await fetch(`/api/admin/career/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secretKey}` }
      })
      if (res.ok) setCareers(careers.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const deleteSkill = async (id: number) => {
    if (!confirm('Delete this skill?')) return
    try {
      const res = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secretKey}` }
      })
      if (res.ok) setSkills(skills.filter(s => s.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const deleteEducation = async (id: number) => {
    if (!confirm('Delete this education entry?')) return
    try {
      const res = await fetch(`/api/admin/education/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secretKey}` }
      })
      if (res.ok) setEducation(education.filter(e => e.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const deleteStation = async (id: number) => {
    if (!confirm('Delete this station?')) return
    try {
      const res = await fetch(`/api/admin/stations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secretKey}` }
      })
      if (res.ok) setStations(stations.filter(s => s.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter your secret key to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleLogin} className="w-full">Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your portfolio data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={initDatabase}>
            <Database className="mr-2 h-4 w-4" />
            Init/Seed DB
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-primary/10 rounded-md text-sm flex items-center gap-2">
          <Check className="h-4 w-4" />
          {message}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="career">Career ({careers.length})</TabsTrigger>
          <TabsTrigger value="education">Education ({education.length})</TabsTrigger>
          <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
          <TabsTrigger value="stations">Stations ({stations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="career" className="space-y-6">
          <CareerForm secretKey={secretKey} onSuccess={loadData} />
          <div className="space-y-4">
            {careers.map(career => (
              <CareerCard
                key={career.id}
                career={career}
                secretKey={secretKey}
                onDelete={() => deleteCareer(career.id)}
                onUpdate={loadData}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          <EducationForm secretKey={secretKey} onSuccess={loadData} />
          <div className="space-y-4">
            {education.map(entry => (
              <EducationCard
                key={entry.id}
                education={entry}
                secretKey={secretKey}
                onDelete={() => deleteEducation(entry.id)}
                onUpdate={loadData}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <SkillForm secretKey={secretKey} onSuccess={loadData} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                secretKey={secretKey}
                onDelete={() => deleteSkill(skill.id)}
                onUpdate={loadData}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stations" className="space-y-6">
          <StationForm secretKey={secretKey} onSuccess={loadData} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stations.map(station => (
              <StationCard
                key={station.id}
                station={station}
                secretKey={secretKey}
                onDelete={() => deleteStation(station.id)}
                onUpdate={loadData}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// Career Form & Card
// ============================================================================

function CareerForm({ secretKey, onSuccess }: { secretKey: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CareerFormValues>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      lng: '',
      lat: '',
      accomplishments: '',
    },
  })

  const onSubmit = async (values: CareerFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/career', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          title: values.title,
          company: values.company,
          location: values.location,
          startDate: values.startDate,
          endDate: values.endDate || null,
          coordinates: [parseFloat(values.lng), parseFloat(values.lat)],
          accomplishments: values.accomplishments.split('\n').filter(a => a.trim())
        })
      })

      if (res.ok) {
        form.reset()
        setIsOpen(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to create:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Position
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Career Position</CardTitle>
        <CardDescription>Add a new work experience entry</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Technical Director" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Austin, TX or Remote" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input placeholder="2020-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input placeholder="Present (leave empty)" {...field} />
                        </FormControl>
                        <FormDescription>Leave empty for current role</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="accomplishments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accomplishments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="One accomplishment per line..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Enter one accomplishment per line</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right column - Map */}
              <div>
                <LocationPicker
                  lng={form.watch('lng')}
                  lat={form.watch('lat')}
                  onCoordinatesChange={(lng, lat) => {
                    form.setValue('lng', lng, { shouldValidate: true })
                    form.setValue('lat', lat, { shouldValidate: true })
                  }}
                  locationName={form.watch('location')}
                />
                {(form.formState.errors.lng || form.formState.errors.lat) && (
                  <p className="text-sm text-destructive mt-2">
                    Please select a valid location on the map
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Position
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function CareerCard({ career, secretKey, onDelete, onUpdate }: {
  career: CareerPosition
  secretKey: string
  onDelete: () => void
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CareerFormValues>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      title: career.title,
      company: career.company,
      location: career.location,
      startDate: career.startDate,
      endDate: career.endDate || '',
      lng: career.coordinates[0].toString(),
      lat: career.coordinates[1].toString(),
      accomplishments: career.accomplishments.join('\n'),
    },
  })

  const onSubmit = async (values: CareerFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/career/${career.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          title: values.title,
          company: values.company,
          location: values.location,
          startDate: values.startDate,
          endDate: values.endDate || null,
          coordinates: [parseFloat(values.lng), parseFloat(values.lat)],
          accomplishments: values.accomplishments.split('\n').filter(a => a.trim())
        })
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to update:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Position</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input placeholder="Leave empty for current" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="accomplishments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accomplishments</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <LocationPicker
                    lng={form.watch('lng')}
                    lat={form.watch('lat')}
                    onCoordinatesChange={(lng, lat) => {
                      form.setValue('lng', lng, { shouldValidate: true })
                      form.setValue('lat', lat, { shouldValidate: true })
                    }}
                    locationName={form.watch('location')}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">{career.title}</CardTitle>
            <CardDescription>{career.company} | {career.location}</CardDescription>
            <CardDescription className="flex items-center gap-4">
              <span>{career.startDate} - {career.endDate || 'Present'}</span>
              <span className="flex items-center gap-1 font-mono text-xs">
                <MapPin className="h-3 w-3" />
                {career.coordinates[0].toFixed(2)}, {career.coordinates[1].toFixed(2)}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          {career.accomplishments.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Education Form & Card
// ============================================================================

function EducationForm({ secretKey, onSuccess }: { secretKey: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: '',
      fieldOfStudy: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      lng: '',
      lat: '',
      accomplishments: '',
    },
  })

  const onSubmit = async (values: EducationFormValues) => {
    setIsSubmitting(true)
    try {
      const hasCoords = values.lng && values.lat
      const res = await fetch('/api/admin/education', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          degree: values.degree,
          fieldOfStudy: values.fieldOfStudy,
          institution: values.institution,
          location: values.location || null,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          gpa: values.gpa || null,
          coordinates: hasCoords ? [parseFloat(values.lng!), parseFloat(values.lat!)] : null,
          accomplishments: values.accomplishments
            ? values.accomplishments.split('\n').filter(a => a.trim())
            : []
        })
      })

      if (res.ok) {
        form.reset()
        setIsOpen(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to create:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Education
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Education</CardTitle>
        <CardDescription>Add a degree or certification</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <FormControl>
                          <Input placeholder="B.S." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fieldOfStudy"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Field of Study</FormLabel>
                        <FormControl>
                          <Input placeholder="Environmental Geoscience" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution</FormLabel>
                      <FormControl>
                        <Input placeholder="Texas A&M University" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="College Station, TX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input placeholder="2006-08" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input placeholder="2010-05" {...field} />
                        </FormControl>
                        <FormDescription>Empty = in progress</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA</FormLabel>
                        <FormControl>
                          <Input placeholder="3.8" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="accomplishments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Honors & Accomplishments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="One per line..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Enter one accomplishment per line</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <LocationPicker
                  lng={form.watch('lng') || ''}
                  lat={form.watch('lat') || ''}
                  onCoordinatesChange={(lng, lat) => {
                    form.setValue('lng', lng, { shouldValidate: true })
                    form.setValue('lat', lat, { shouldValidate: true })
                  }}
                  locationName={form.watch('location') || ''}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Education
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function EducationCard({ education, secretKey, onDelete, onUpdate }: {
  education: EducationEntry
  secretKey: string
  onDelete: () => void
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy,
      institution: education.institution,
      location: education.location || '',
      startDate: education.startDate || '',
      endDate: education.endDate || '',
      gpa: education.gpa || '',
      lng: education.coordinates ? education.coordinates[0].toString() : '',
      lat: education.coordinates ? education.coordinates[1].toString() : '',
      accomplishments: education.accomplishments?.join('\n') || '',
    },
  })

  const onSubmit = async (values: EducationFormValues) => {
    setIsSubmitting(true)
    try {
      const hasCoords = values.lng && values.lat
      const res = await fetch(`/api/admin/education/${education.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          degree: values.degree,
          fieldOfStudy: values.fieldOfStudy,
          institution: values.institution,
          location: values.location || null,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          gpa: values.gpa || null,
          coordinates: hasCoords ? [parseFloat(values.lng!), parseFloat(values.lat!)] : null,
          accomplishments: values.accomplishments
            ? values.accomplishments.split('\n').filter(a => a.trim())
            : []
        })
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to update:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Education</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="degree"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Degree</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fieldOfStudy"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Field of Study</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input placeholder="Empty = in progress" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gpa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GPA</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="accomplishments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Honors & Accomplishments</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <LocationPicker
                    lng={form.watch('lng') || ''}
                    lat={form.watch('lat') || ''}
                    onCoordinatesChange={(lng, lat) => {
                      form.setValue('lng', lng, { shouldValidate: true })
                      form.setValue('lat', lat, { shouldValidate: true })
                    }}
                    locationName={form.watch('location') || ''}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">{education.degree} {education.fieldOfStudy}</CardTitle>
            <CardDescription>{education.institution}{education.location ? ` | ${education.location}` : ''}</CardDescription>
            <CardDescription className="flex items-center gap-4">
              {education.startDate && education.endDate && (
                <span>{education.startDate} - {education.endDate}</span>
              )}
              {education.endDate && !education.startDate && (
                <span>{education.endDate}</span>
              )}
              {education.gpa && <span>GPA: {education.gpa}</span>}
              {education.coordinates && (
                <span className="flex items-center gap-1 font-mono text-xs">
                  <MapPin className="h-3 w-3" />
                  {education.coordinates[0].toFixed(2)}, {education.coordinates[1].toFixed(2)}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {education.accomplishments && education.accomplishments.length > 0 && (
        <CardContent>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {education.accomplishments.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// Skill Form & Card
// ============================================================================

function SkillForm({ secretKey, onSuccess }: { secretKey: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      category: '',
      proficiency: '3',
    },
  })

  const onSubmit = async (values: SkillFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          name: values.name,
          category: values.category,
          proficiency: parseInt(values.proficiency)
        })
      })

      if (res.ok) {
        form.reset()
        setIsOpen(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to create:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Skill
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Skill</CardTitle>
        <CardDescription>Add a new skill to your profile</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="React" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {skillCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency (1-5)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} - {['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][n - 1]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Skill
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function SkillCard({ skill, secretKey, onDelete, onUpdate }: {
  skill: Skill
  secretKey: string
  onDelete: () => void
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency.toString(),
    },
  })

  const onSubmit = async (values: SkillFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          name: values.name,
          category: values.category,
          proficiency: parseInt(values.proficiency)
        })
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to update:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {skillCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{skill.name}</CardTitle>
            <CardDescription>
              {skillCategories.find(c => c.value === skill.category)?.label || skill.category}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className={`w-2 h-2 rounded-full ${n <= skill.proficiency ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Station Form & Card
// ============================================================================

function StationForm({ secretKey, onSuccess }: { secretKey: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<StationFormValues>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: '',
      location: '',
      lng: '',
      lat: '',
      aqi: '',
      category: 'Good',
      pollutant: 'PM2.5',
      status: 'active',
    },
  })

  const onSubmit = async (values: StationFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          name: values.name,
          location: values.location,
          coordinates: [parseFloat(values.lng), parseFloat(values.lat)],
          aqi: parseInt(values.aqi),
          category: values.category,
          pollutant: values.pollutant,
          lastUpdated: new Date().toISOString(),
          status: values.status
        })
      })

      if (res.ok) {
        form.reset()
        setIsOpen(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to create:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Station
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Air Quality Station</CardTitle>
        <CardDescription>Add a new monitoring station</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Downtown Monitor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="aqi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AQI Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="42" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {aqiCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pollutant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Pollutant</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pollutants.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <LocationPicker
                  lng={form.watch('lng')}
                  lat={form.watch('lat')}
                  onCoordinatesChange={(lng, lat) => {
                    form.setValue('lng', lng, { shouldValidate: true })
                    form.setValue('lat', lat, { shouldValidate: true })
                  }}
                  locationName={form.watch('location')}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Station
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function StationCard({ station, secretKey, onDelete, onUpdate }: {
  station: Station
  secretKey: string
  onDelete: () => void
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<StationFormValues>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: station.name,
      location: station.location,
      lng: station.coordinates[0].toString(),
      lat: station.coordinates[1].toString(),
      aqi: station.aqi.toString(),
      category: station.category,
      pollutant: station.pollutant,
      status: station.status,
    },
  })

  const onSubmit = async (values: StationFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          name: values.name,
          location: values.location,
          coordinates: [parseFloat(values.lng), parseFloat(values.lat)],
          aqi: parseInt(values.aqi),
          category: values.category,
          pollutant: values.pollutant,
          lastUpdated: new Date().toISOString(),
          status: values.status
        })
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to update:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Station</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aqi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AQI</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {aqiCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pollutant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pollutant</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pollutants.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{station.name}</CardTitle>
            <CardDescription>{station.location}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        <p>AQI: {station.aqi} ({station.category})</p>
        <p>Pollutant: {station.pollutant}</p>
        <p className="flex items-center gap-1">
          Status:
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            station.status === 'active' ? 'bg-green-500/20 text-green-400' :
            station.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {station.status}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Plus, Database, LogOut } from 'lucide-react'

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

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [secretKey, setSecretKey] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [careers, setCareers] = useState<CareerPosition[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [stations, setStations] = useState<Station[]>([])

  // Check for stored auth
  useEffect(() => {
    const storedKey = sessionStorage.getItem('adminKey')
    if (storedKey) {
      setSecretKey(storedKey)
      setIsAuthenticated(true)
      loadData(storedKey)
    }
  }, [])

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
        loadData(secretKey.trim())
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

  const loadData = async (_key: string) => {
    try {
      const [careerRes, skillsRes, stationsRes] = await Promise.all([
        fetch('/api/career'),
        fetch('/api/skills'),
        fetch('/api/stations')
      ])

      if (careerRes.ok) setCareers(await careerRes.json())
      if (skillsRes.ok) setSkills(await skillsRes.json())
      if (stationsRes.ok) setStations(await stationsRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    }
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
        loadData(secretKey)
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

      if (res.ok) {
        setCareers(careers.filter(c => c.id !== id))
      }
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

      if (res.ok) {
        setSkills(skills.filter(s => s.id !== id))
      }
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

      if (res.ok) {
        setStations(stations.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

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
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
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
        <div className="mb-4 p-4 bg-primary/10 rounded-md text-sm">
          {message}
        </div>
      )}

      <Tabs defaultValue="career">
        <TabsList>
          <TabsTrigger value="career">Career ({careers.length})</TabsTrigger>
          <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
          <TabsTrigger value="stations">Stations ({stations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="career" className="space-y-4">
          <CareerForm secretKey={secretKey} onSuccess={() => loadData(secretKey)} />
          <div className="space-y-4">
            {careers.map(career => (
              <Card key={career.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-lg">{career.title}</CardTitle>
                      <CardDescription>{career.company} | {career.location}</CardDescription>
                      <CardDescription>{career.startDate} - {career.endDate || 'Present'}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteCareer(career.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {career.accomplishments.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillForm secretKey={secretKey} onSuccess={() => loadData(secretKey)} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map(skill => (
              <Card key={skill.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{skill.name}</CardTitle>
                      <CardDescription>{skill.category}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteSkill(skill.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stations" className="space-y-4">
          <StationForm secretKey={secretKey} onSuccess={() => loadData(secretKey)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stations.map(station => (
              <Card key={station.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{station.name}</CardTitle>
                      <CardDescription>{station.location}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteStation(station.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>AQI: {station.aqi} ({station.category})</p>
                  <p>Pollutant: {station.pollutant}</p>
                  <p>Status: {station.status}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Form components
function CareerForm({ secretKey, onSuccess }: { secretKey: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    lng: '',
    lat: '',
    accomplishments: ''
  })

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/admin/career', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          title: form.title,
          company: form.company,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate || null,
          coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
          accomplishments: form.accomplishments.split('\n').filter(a => a.trim())
        })
      })

      if (res.ok) {
        setForm({ title: '', company: '', location: '', startDate: '', endDate: '', lng: '', lat: '', accomplishments: '' })
        setIsOpen(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to create:', err)
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Start Date (YYYY-MM)</Label>
            <Input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} placeholder="2020-01" />
          </div>
          <div className="space-y-2">
            <Label>End Date (YYYY-MM, leave empty for current)</Label>
            <Input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} placeholder="2022-12" />
          </div>
          <div className="space-y-2">
            <Label>Longitude</Label>
            <Input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="-105.0" />
          </div>
          <div className="space-y-2">
            <Label>Latitude</Label>
            <Input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="39.7" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Accomplishments (one per line)</Label>
          <Textarea
            value={form.accomplishments}
            onChange={e => setForm({ ...form, accomplishments: e.target.value })}
            rows={4}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>Save</Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SkillForm({ secretKey, onSuccess }: { secretKey: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', proficiency: '3' })

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          proficiency: parseInt(form.proficiency)
        })
      })

      if (res.ok) {
        setForm({ name: '', category: '', proficiency: '3' })
        setIsOpen(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to create:', err)
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="GIS/Spatial" />
          </div>
          <div className="space-y-2">
            <Label>Proficiency (1-5)</Label>
            <Input type="number" min="1" max="5" value={form.proficiency} onChange={e => setForm({ ...form, proficiency: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>Save</Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StationForm({ secretKey, onSuccess }: { secretKey: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    location: '',
    lng: '',
    lat: '',
    aqi: '',
    category: 'Good',
    pollutant: 'PM2.5',
    status: 'active'
  })

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/admin/stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`
        },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
          aqi: parseInt(form.aqi),
          category: form.category,
          pollutant: form.pollutant,
          lastUpdated: new Date().toISOString(),
          status: form.status
        })
      })

      if (res.ok) {
        setForm({ name: '', location: '', lng: '', lat: '', aqi: '', category: 'Good', pollutant: 'PM2.5', status: 'active' })
        setIsOpen(false)
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to create:', err)
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Longitude</Label>
            <Input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Latitude</Label>
            <Input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>AQI</Label>
            <Input type="number" value={form.aqi} onChange={e => setForm({ ...form, aqi: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Good, Moderate, etc." />
          </div>
          <div className="space-y-2">
            <Label>Pollutant</Label>
            <Input value={form.pollutant} onChange={e => setForm({ ...form, pollutant: e.target.value })} placeholder="PM2.5, Ozone, etc." />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} placeholder="active" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>Save</Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )
}

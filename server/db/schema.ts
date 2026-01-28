import { db } from './client.js'

export async function initializeDatabase() {
  // Career positions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS career_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      coordinates_lng REAL NOT NULL,
      coordinates_lat REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Career accomplishments table (one-to-many with positions)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS career_accomplishments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_id INTEGER NOT NULL,
      accomplishment TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (position_id) REFERENCES career_positions(id) ON DELETE CASCADE
    )
  `)

  // Skills table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      proficiency INTEGER NOT NULL CHECK (proficiency >= 1 AND proficiency <= 5),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Air quality stations table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS air_quality_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      coordinates_lng REAL NOT NULL,
      coordinates_lat REAL NOT NULL,
      aqi INTEGER NOT NULL,
      category TEXT NOT NULL,
      pollutant TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Education table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      degree TEXT NOT NULL,
      field_of_study TEXT NOT NULL,
      institution TEXT NOT NULL,
      location TEXT,
      start_date TEXT,
      end_date TEXT,
      gpa TEXT,
      coordinates_lng REAL,
      coordinates_lat REAL,
      accomplishments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('Database schema initialized')
}

export async function seedDatabase() {
  // Check if data already exists
  const existingPositions = await db.execute('SELECT COUNT(*) as count FROM career_positions')
  const count = existingPositions.rows[0]?.count as number
  if (count > 0) {
    console.log('Database already seeded, skipping...')
    return
  }

  // Seed career positions
  const positions = [
    {
      title: 'GIS/IT Manager',
      company: 'PASA (Pedernales Area Sustainable Agriculture)',
      location: 'College Station, TX',
      start_date: '2006-08',
      end_date: '2012-05',
      lng: -96.3344,
      lat: 30.6280,
      accomplishments: [
        'Built first GIS data platform for regional agricultural planning',
        'Managed IT infrastructure for multi-county organization',
        'Developed custom mapping applications for field staff'
      ]
    },
    {
      title: 'GIS Manager',
      company: 'TRC Companies, Inc.',
      location: 'Austin, TX',
      start_date: '2012-06',
      end_date: '2018-03',
      lng: -97.7431,
      lat: 30.2672,
      accomplishments: [
        'Led GIS team supporting environmental consulting projects',
        'Architected enterprise geodatabase for multi-state operations',
        'Implemented automated QA/QC workflows reducing errors by 40%'
      ]
    },
    {
      title: 'Solutions Engineer',
      company: 'Fulcrum (Spatial Networks)',
      location: 'Remote',
      start_date: '2018-04',
      end_date: '2020-08',
      lng: -107.8801,
      lat: 37.2753,
      accomplishments: [
        'Designed custom mobile data collection solutions',
        'Built integrations connecting field data to enterprise systems',
        'Supported Fortune 500 clients with spatial data workflows'
      ]
    },
    {
      title: 'Senior Solutions Architect',
      company: 'TRC Companies, Inc.',
      location: 'Remote (Bayfield, CO)',
      start_date: '2020-09',
      end_date: '2022-09',
      lng: -107.5981,
      lat: 37.2247,
      accomplishments: [
        'Architected cloud-native environmental monitoring platform',
        'Led technical delivery for $2M+ digital transformation initiative',
        'Established DevOps practices and CI/CD pipelines'
      ]
    },
    {
      title: 'Technical Director, EV Digital',
      company: 'TRC Companies, Inc.',
      location: 'Remote (Bayfield, CO)',
      start_date: '2022-10',
      end_date: null,
      lng: -107.5981,
      lat: 37.2247,
      accomplishments: [
        'Lead architecture and delivery for digital systems',
        'Drive cross-functional delivery to move prototypes to production',
        'Own platform patterns for multi-tenant solutions'
      ]
    }
  ]

  for (const pos of positions) {
    const result = await db.execute({
      sql: `INSERT INTO career_positions (title, company, location, start_date, end_date, coordinates_lng, coordinates_lat)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [pos.title, pos.company, pos.location, pos.start_date, pos.end_date, pos.lng, pos.lat]
    })

    const positionId = Number(result.lastInsertRowid)

    for (let i = 0; i < pos.accomplishments.length; i++) {
      await db.execute({
        sql: `INSERT INTO career_accomplishments (position_id, accomplishment, sort_order)
              VALUES (?, ?, ?)`,
        args: [positionId, pos.accomplishments[i], i]
      })
    }
  }

  // Seed skills
  const skills = [
    { name: 'PostgreSQL/PostGIS', category: 'Data Platforms', proficiency: 5 },
    { name: 'SQL Server', category: 'Data Platforms', proficiency: 4 },
    { name: 'ETL/Data Pipelines', category: 'Data Platforms', proficiency: 5 },
    { name: 'ArcGIS Platform', category: 'GIS/Spatial', proficiency: 5 },
    { name: 'MapLibre/Mapbox', category: 'GIS/Spatial', proficiency: 4 },
    { name: 'Spatial Data Analysis', category: 'GIS/Spatial', proficiency: 5 },
    { name: 'QGIS', category: 'GIS/Spatial', proficiency: 4 },
    { name: 'AWS', category: 'Cloud/Infrastructure', proficiency: 4 },
    { name: 'Linux Administration', category: 'Cloud/Infrastructure', proficiency: 4 },
    { name: 'Docker/Containers', category: 'Cloud/Infrastructure', proficiency: 4 },
    { name: 'React/Next.js', category: 'App Delivery', proficiency: 4 },
    { name: 'TypeScript', category: 'App Delivery', proficiency: 4 },
    { name: 'Node.js', category: 'App Delivery', proficiency: 4 },
    { name: 'Python', category: 'App Delivery', proficiency: 3 },
    { name: 'Technical Leadership', category: 'Leadership', proficiency: 5 }
  ]

  for (const skill of skills) {
    await db.execute({
      sql: `INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)`,
      args: [skill.name, skill.category, skill.proficiency]
    })
  }

  // Seed air quality stations
  const stations = [
    { name: 'Denver - CAMP', location: 'Denver, CO', lng: -104.9876, lat: 39.7392, aqi: 42, category: 'Good', pollutant: 'PM2.5', last_updated: '2024-01-15T10:30:00Z', status: 'active' },
    { name: 'Fort Collins - CSU', location: 'Fort Collins, CO', lng: -105.0844, lat: 40.5853, aqi: 35, category: 'Good', pollutant: 'Ozone', last_updated: '2024-01-15T10:15:00Z', status: 'active' },
    { name: 'Boulder - Table Mesa', location: 'Boulder, CO', lng: -105.2705, lat: 39.9936, aqi: 28, category: 'Good', pollutant: 'PM2.5', last_updated: '2024-01-15T10:45:00Z', status: 'active' },
    { name: 'Colorado Springs - USAFA', location: 'Colorado Springs, CO', lng: -104.8214, lat: 38.8339, aqi: 51, category: 'Moderate', pollutant: 'Ozone', last_updated: '2024-01-15T09:30:00Z', status: 'active' },
    { name: 'Pueblo - Fountain', location: 'Pueblo, CO', lng: -104.6091, lat: 38.2544, aqi: 45, category: 'Good', pollutant: 'PM2.5', last_updated: '2024-01-15T10:00:00Z', status: 'active' },
    { name: 'Grand Junction - Pitkin', location: 'Grand Junction, CO', lng: -108.5507, lat: 39.0639, aqi: 38, category: 'Good', pollutant: 'PM2.5', last_updated: '2024-01-15T09:45:00Z', status: 'active' },
    { name: 'Durango - Riverview', location: 'Durango, CO', lng: -107.8801, lat: 37.2753, aqi: 22, category: 'Good', pollutant: 'PM2.5', last_updated: '2024-01-15T10:30:00Z', status: 'active' },
    { name: 'Aspen - Pitkin County', location: 'Aspen, CO', lng: -106.8175, lat: 39.1911, aqi: 18, category: 'Good', pollutant: 'Ozone', last_updated: '2024-01-15T10:15:00Z', status: 'active' },
    { name: 'Greeley - Weld Tower', location: 'Greeley, CO', lng: -104.7091, lat: 40.4233, aqi: 58, category: 'Moderate', pollutant: 'PM2.5', last_updated: '2024-01-15T09:00:00Z', status: 'active' },
    { name: 'Cortez - Centennial', location: 'Cortez, CO', lng: -108.5859, lat: 37.3489, aqi: 25, category: 'Good', pollutant: 'PM2.5', last_updated: '2024-01-15T10:00:00Z', status: 'active' }
  ]

  for (const station of stations) {
    await db.execute({
      sql: `INSERT INTO air_quality_stations (name, location, coordinates_lng, coordinates_lat, aqi, category, pollutant, last_updated, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [station.name, station.location, station.lng, station.lat, station.aqi, station.category, station.pollutant, station.last_updated, station.status]
    })
  }

  // Seed education
  const existingEducation = await db.execute('SELECT COUNT(*) as count FROM education')
  const educationCount = existingEducation.rows[0]?.count as number
  if (educationCount === 0) {
    await db.execute({
      sql: `INSERT INTO education (degree, field_of_study, institution, location, start_date, end_date, gpa, coordinates_lng, coordinates_lat, accomplishments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['B.S.', 'Environmental Geoscience', 'Texas A&M University', 'College Station, TX', '2002-08', '2006-05', null, -96.3344, 30.6280, '[]']
    })
  }

  console.log('Database seeded successfully')
}

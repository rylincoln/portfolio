# Portfolio Application Design

## Overview

A technical portfolio for Ry Blaisdell - Technical Director and GIS/software leader with 20+ years experience. The portfolio serves dual purposes: job hunting and professional presence/networking.

The design philosophy: **show, don't tell**. The portfolio itself demonstrates technical skills through interactive demos, while a resume-forward structure communicates depth of experience.

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Maps**: MapLibre GL JS
- **Charts**: Tremor (data-viz focused component library)
- **Data Fetching**: TanStack Query
- **Routing**: React Router
- **Backend**: Express (minimal, for API routes)
- **Email**: Resend
- **Deployment**: Docker on CapRover (self-hosted)

## Visual Identity

### Aesthetic
Dark mode primary with a technical, data-driven feel. Subtle nods to GIS and spatial thinking without being gimmicky.

### Colors
- **Background**: Deep navy/charcoal
- **Text**: Light gray/white
- **Accents**: Blues and teals (water/air data conventions), warm amber for highlights
- **Status colors**: Standard green/yellow/red for data states

### Typography
- **Primary**: Inter or similar clean sans-serif
- **Monospace accents**: For technical elements, code snippets, data values

### Texture & Pattern
- Subtle topographic contour lines as background elements
- Hex grids or dot grids in low opacity
- Not overwhelming - just enough to signal spatial expertise

### Motion
- Understated, smooth transitions
- Hero may have subtle animated contours or data particles
- Data updates animate smoothly

## Site Structure

```
/                     # Landing page
/resume               # Interactive resume with map timeline
/demos/map            # Interactive map demo
/demos/dashboard      # Live data dashboard demo
/demos/explorer       # Data exploration tool demo
/contact              # Contact form + links
```

## Project Structure

```
src/
├── components/           # Shared UI components
│   ├── ui/              # shadcn components
│   ├── layout/          # Header, footer, navigation
│   └── common/          # Buttons, cards, etc.
├── features/
│   ├── landing/         # Hero, preview cards
│   ├── resume/
│   │   ├── MapTimeline/ # Map-based career timeline
│   │   └── SkillsMatrix/# Filterable skills grid
│   ├── demos/
│   │   ├── map/         # Colorado air quality map
│   │   ├── dashboard/   # Real-time metrics dashboard
│   │   └── explorer/    # Data query/filter tool
│   └── contact/         # Form + direct links
├── data/                # Static fallback datasets
│   ├── career.json      # Timeline data
│   ├── skills.json      # Skills matrix data
│   └── air-quality/     # Fallback environmental data
├── lib/
│   ├── api/             # API client functions
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Utilities
├── api/                 # Backend routes (Express)
│   ├── contact.ts       # Resend integration
│   └── air-quality.ts   # Optional data proxy
└── styles/              # Global styles, Tailwind config
```

## Pages

### Landing Page (`/`)

**Hero Section**
- Name: "Ry Blaisdell"
- Title: "Technical Director & GIS/Software Leader"
- Tagline: One line capturing your value prop
- Background: Subtle animated map contours or data flow visualization

**Quick Stats Bar**
- "20+ years experience"
- "5+ production platforms"
- "Full-stack delivery"
Immediate credibility markers.

**Navigation**
- Resume
- Demos (with dropdown showing Map, Dashboard, Explorer)
- Contact

**Demo Preview Cards**
Below the fold, three cards with visual previews of each demo. Entice exploration.

### Interactive Resume (`/resume`)

**Map-Based Career Timeline**
- Full-width MapLibre map centered on Texas/Colorado region
- Location markers for each career chapter:
  - **College Station (2006-2012)**: PASA - GIS/IT Manager
  - **Austin (2012-2018)**: TRC - GIS Manager
  - **Remote/Bayfield (2018-Present)**: Fulcrum, TRC Sr. Architect, Technical Director
- Timeline scrubber below the map
- Dragging/clicking advances through career, map pans/zooms to focus
- Info panel shows role details, company, key accomplishments
- Click markers to jump to that period
- "Remote" period shows Bayfield location with subtle indication of distributed work

**Skills Matrix**
- Grid of core skills, visually weighted by depth/recency
- Categories:
  - GIS/Spatial: ArcGIS, PostGIS, MapLibre, spatial data workflows
  - Cloud/Infrastructure: AWS, Linux, automation, security
  - Data Platforms: PostgreSQL, SQL Server, ETL, schema design
  - App Delivery: React, Next.js, Node.js, TypeScript, Python
  - Leadership: Architecture, cross-functional delivery, consulting
- Clicking a skill highlights relevant timeline periods
- Filter timeline by skill category

### Demo 1: Interactive Map (`/demos/map`)

**Colorado Air Quality Map**
- MapLibre map focused on Colorado
- Base layer: Terrain/hillshade for Colorado context
- Data layer: EPA/OpenAQ air quality monitoring stations
- Features:
  - Click stations for detail popup (current readings, station info)
  - Toggle pollutant types: PM2.5, ozone, NO2, etc.
  - Time slider for historical data (if available)
  - Legend with AQI color scale
- Colorado flavor:
  - Highlight Four Corners region
  - Optional: wildfire smoke impact visualization
- Data strategy:
  - Primary: OpenAQ API for live data
  - Fallback: Bundled JSON snapshot of station locations + recent readings

### Demo 2: Live Dashboard (`/demos/dashboard`)

**Environmental Metrics Dashboard**
- Mimics real-time fenceline monitoring systems
- Layout:
  - Header with location name, last updated timestamp
  - Grid of metric cards (4-6 cards)
  - Trend chart showing last 24 hours
- Each metric card shows:
  - Pollutant name
  - Current value with units
  - Status indicator (Good/Moderate/Unhealthy)
  - Sparkline showing recent trend
- Auto-refresh every 30-60 seconds with smooth transitions
- Time range selector: 1h, 6h, 24h, 7d
- Data strategy:
  - Primary: Live API if available
  - Fallback: Simulated data stream that updates realistically

### Demo 3: Data Explorer (`/demos/explorer`)

**Station Query Tool**
- Two-panel layout: filters on left, results table on right
- Filters:
  - Location (state/region dropdown or map-based selection)
  - Pollutant type (multi-select)
  - Date range picker
  - Status (active/inactive)
  - Search by station name
- Results table:
  - Sortable columns: Name, Location, Pollutant, Last Reading, Status
  - Pagination (25/50/100 per page)
  - Click row for detail view or "View on Map" link
- Export to CSV button
- Data strategy:
  - Bundled dataset of ~500-1000 station records
  - Optional: fetch fresh data from API with fallback

### Contact (`/contact`)

**Contact Form**
- Fields: Name, Email, Message
- Validation: Required fields, email format
- Submit: POST to `/api/contact`
- States: idle, submitting, success, error
- Rate limiting on backend

**Direct Links**
- Email: ry@rlblais.org (mailto link)
- LinkedIn: Profile link
- GitHub: Profile link
- Optional: Download resume as PDF

## Backend API

Minimal Express server bundled with the app.

### `POST /api/contact`
- Validates input (name, email, message required)
- Sends email via Resend
- Rate limited (e.g., 5 requests per IP per hour)
- Returns: `{ success: true }` or `{ error: "message" }`

### `GET /api/air-quality` (optional)
- Proxies requests to OpenAQ or EPA APIs
- Adds caching layer (5-15 min TTL)
- Handles CORS, aggregates data if needed
- Returns normalized data structure

### `GET /health`
- Returns `{ status: "ok" }` for CapRover health checks

## Data Strategy

**Hybrid Approach**: Static fallback data with live data when available.

### Static Data (bundled in `/src/data/`)
- `career.json`: Timeline entries with coordinates, dates, roles, accomplishments
- `skills.json`: Skills with categories, proficiency levels, related timeline entries
- `stations.json`: Air quality station snapshot (~500-1000 records)
- `readings.json`: Sample readings for dashboard demo

### Live Data Sources
- **OpenAQ API**: Air quality readings (free, no auth required)
- **EPA AQS API**: Alternative/supplementary air quality data

### Fetching Pattern (TanStack Query)
```typescript
const { data } = useQuery({
  queryKey: ['air-quality', filters],
  queryFn: fetchAirQuality,
  placeholderData: fallbackData,  // Static data while loading
  staleTime: 5 * 60 * 1000,       // 5 min cache
  retry: 1,                        // Don't hammer failing APIs
});
```

## Deployment

### Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

### CapRover
- Create app in CapRover dashboard
- Deploy via git push or tarball upload
- Configure environment variables:
  - `RESEND_API_KEY`
  - `CONTACT_EMAIL` (destination for contact form)
- Enable HTTPS via CapRover's Let's Encrypt integration

## Routes Summary

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, stats, demo previews |
| `/resume` | Interactive map timeline + skills matrix |
| `/demos/map` | Colorado air quality interactive map |
| `/demos/dashboard` | Real-time environmental metrics dashboard |
| `/demos/explorer` | Data query and exploration tool |
| `/contact` | Contact form + direct links |

## Open Considerations

- **Domain**: Need to decide on domain name if not already owned
- **Analytics**: Consider privacy-friendly analytics (Plausible, Umami) if desired
- **PDF Resume**: Generate from same data as web version, or maintain separately?
- **Accessibility**: Ensure all interactive elements are keyboard navigable, proper ARIA labels
- **SEO**: Meta tags, Open Graph images for sharing

## Success Criteria

1. Portfolio loads fast (<2s initial load)
2. All three demos function with fallback data (no external dependencies for basic operation)
3. Contact form successfully delivers messages
4. Site works well on mobile (responsive)
5. Technical aesthetic is evident but not overwhelming
6. Timeline clearly communicates 20+ years of progressive experience

# Portfolio Redesign: Resume-Focused Landing Page

## Overview

Simplify the portfolio from a demo-heavy showcase to a clean, professional resume landing page. The goal is to serve hiring managers and potential consulting clients who need to quickly assess qualifications.

**Key principles:**
- Traditional, elegant resume aesthetic
- Single scrollable page with all content
- No interactive maps or animated backgrounds
- Easy to read and scan

## Target Audience

1. **Hiring managers/recruiters** - Evaluating for roles
2. **Potential clients** - Evaluating for consulting/freelance work

## Key Takeaways for Visitors

- Deep, senior-level experience (20+ years, leadership roles)
- Bridges technical and business (consulting, translating complex problems into solutions)

## Page Structure

### Navigation (Header)

Simplified links:
- Resume (home)
- Contact

Remove all demo links from navigation.

### Landing Page Content (`/`)

Single-page resume with sections in order:

#### 1. Name & Title Block
- **Name**: "Ry Blaisdell" as prominent h1
- **Title**: "Technical Director & GIS/Software Leader"
- **Summary**: 2-3 sentences emphasizing senior experience and ability to bridge technical and business domains

#### 2. Experience Section
Section header: "Experience" with subtle bottom border.

Each position displays:
- Company name and job title (prominent)
- Date range and location (secondary text)
- Accomplishments as bullet points

**Positions (chronological, most recent first):**

1. **Technical Director, EV Digital** @ TRC Companies
   - 2022–Present | Remote
   - Accomplishments from career.json

2. **Sr. Digital Solutions Architect** @ TRC Companies
   - 2020–2022 | Remote
   - Accomplishments from career.json

3. **Professional Services Engineer** @ Fulcrum
   - 2018–2020 | Remote
   - Accomplishments from career.json

4. **GIS Manager** @ TRC Companies
   - 2012–2018 | Austin, TX
   - Accomplishments from career.json

5. **GIS/IT Manager** @ PASA
   - 2006–2012 | College Station, TX
   - Accomplishments from career.json

#### 3. Skills Section
Section header: "Skills"

Inline format by category:
```
GIS/Spatial: ArcGIS, PostGIS, MapLibre
Cloud/Infrastructure: AWS, Linux Administration
Data Platforms: PostgreSQL, SQL Server, ETL/Data Pipelines
App Delivery: React, TypeScript, Node.js, Python
Leadership: System Architecture, Technical Leadership, Consulting
```

#### 4. Education Section
Section header: "Education"

- **B.S. Environmental Geoscience**
- Texas A&M University, 2010

#### 5. Contact Section
Section header: "Contact"

Links displayed inline or as simple list:
- Email (linked)
- LinkedIn (linked)
- GitHub (linked)

## Styling

- **Max-width**: ~800px centered (standard resume width)
- **Typography**: Clean hierarchy - h1 for name, h2 for sections, semibold for company/title, regular for content
- **Colors**: Keep existing dark theme
- **Section separators**: Subtle borders or spacing between sections
- **No animations**: Remove animated grid background from hero
- **No cards**: Simple text-based layout

## Routes

### Keep
| Route | Description |
|-------|-------------|
| `/` | Resume landing page (all content) |
| `/contact` | Contact page with form |
| `/admin` | Admin dashboard |

### Remove
| Route | Description |
|-------|-------------|
| `/resume` | Merged into landing page |
| `/demos/map` | Air quality map demo |
| `/demos/dashboard` | Dashboard demo |
| `/demos/explorer` | Data explorer demo |

## Files to Modify

### Delete
- `src/pages/Resume.tsx`
- `src/features/resume/MapTimeline.tsx`
- `src/features/resume/SkillsMatrix.tsx`
- `src/features/landing/Hero.tsx`
- `src/features/landing/StatsBar.tsx`
- `src/features/landing/DemoPreviewCards.tsx`
- `src/features/demos/` (entire directory)
- `src/data/air-quality/` (entire directory)

### Modify
- `src/pages/Landing.tsx` - Replace with resume layout
- `src/components/layout/Header.tsx` - Remove demo navigation
- `src/App.tsx` - Remove demo routes

### Create
- `src/features/resume/ResumeContent.tsx` - Main resume component (or inline in Landing.tsx)

## Data Sources

Continue using existing data files:
- `src/data/career.json` - Experience content
- `src/data/skills.json` - Skills by category

Add education data (hardcode or add to data file).

## Implementation Notes

1. Start by simplifying Landing.tsx to render resume content directly
2. Remove demo routes from App.tsx
3. Update Header.tsx navigation
4. Delete unused components and files
5. Clean up any unused dependencies (consider removing maplibre-gl if no longer needed)

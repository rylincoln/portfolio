# Air Quality Map UX Improvements - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the air quality map demo into a polished, production-quality experience that showcases technical skills, data visualization expertise, and attention to UX detail.

**Architecture:** Hybrid responsive layout with station list sidebar on desktop, bottom sheet on mobile, and map popups for quick preview. Real-time data with graceful fallbacks.

**Tech Stack:** React, MapLibre GL JS, TanStack Query, Tailwind CSS, shadcn/ui, nuqs (URL state)

---

## 1. Information Hierarchy & First Impressions

### 1.1 Onboarding Hint
- Add a subtle overlay card on first visit: "Explore real-time air quality across Colorado - Click any station"
- Auto-dismiss after 3 seconds or on first map interaction
- Store dismissal in localStorage to not show again

### 1.2 Marker Visual Hierarchy
Scale marker size by AQI severity:
- Good (0-50): 14px diameter
- Moderate (51-100): 18px diameter
- Unhealthy for Sensitive (101-150): 20px diameter
- Unhealthy+ (151+): 22px diameter

### 1.3 Marker Animations
- Pulsing animation on markers with AQI > 50 (Moderate or worse)
- CSS keyframe animation, subtle opacity pulse every 2 seconds
- Hover state: scale(1.15) transition

### 1.4 Improved Page Header
Replace plain header with:
```
Interactive Map Demo                    [Live] 23 stations
Real-time air quality from EPA monitoring stations in Colorado
```
- Live badge with green dot indicator
- Station count as quick stat

---

## 2. Desktop Layout (≥1024px)

### 2.1 Sidebar Structure
Top to bottom:
1. **Status card** - Live indicator, last updated, refresh button
2. **Selected station card** (when selected) - Full details, dismissible
3. **Search input** - Filter stations by name
4. **AQI filter chips** - Filter by category (All, Good, Moderate, Unhealthy+)
5. **Station list** - Scrollable, sorted by AQI descending (worst first)

### 2.2 Station List Item
Each row displays:
```
[color dot] Station Name                 AQI [badge]
            Location                     Category
```
- Clicking highlights marker on map and flies to it
- Selected item has accent border matching AQI color
- Hover state with subtle background

### 2.3 Legend
Move legend into a collapsible section or tooltip to save vertical space.

---

## 3. Mobile Layout (<1024px)

### 3.1 Full-Width Map
- Map takes 100% viewport height minus header (calc(100vh - 64px))
- Navigation controls repositioned to not conflict with UI

### 3.2 Floating Summary Pill
- Fixed position at top of map: "Live • 23 stations"
- Tapping opens bottom sheet
- Semi-transparent background with blur

### 3.3 Bottom Sheet Drawer
Three snap points:
- **Collapsed**: Just handle visible (48px)
- **Partial**: Station list visible (~40% screen height)
- **Expanded**: Full station details (~85% screen height)

Implementation: CSS transitions with touch gesture handling, or use a library like `vaul` (drawer primitive).

### 3.4 Mobile Popup
- Tapping marker shows compact MapLibre popup
- Popup contains: Name, AQI, "View details" button
- "View details" expands bottom sheet to full

---

## 4. Map Popups

### 4.1 Popup Content
```
┌─────────────────────────────┐
│ Station Name            [×] │
│ ┌─────┐                     │
│ │ 42  │  Good               │
│ └─────┘                     │
│ View details →              │
└─────────────────────────────┘
```
- Large AQI number with colored background
- Category label
- Link to full details

### 4.2 Popup Styling
- Dark theme matching map (bg-slate-900, border-slate-700)
- Rounded corners (8px)
- Subtle shadow
- Arrow pointing to marker
- Max-width: 200px

---

## 5. Visual Connection & Selection State

### 5.1 Selected Marker
- White ring/glow effect (box-shadow or additional element)
- Slightly elevated z-index
- Scale to 1.1x

### 5.2 Selected Sidebar Item
- Left border accent (4px) in AQI category color
- Subtle background tint
- Smooth scroll into view if off-screen

### 5.3 Deselection
- Click anywhere on map (not a marker)
- Click × on selected station card
- Press Escape key

---

## 6. Summary Statistics Bar

### 6.1 Stats Display
Horizontal bar below page header:
```
[🟢 12 Good] [🟡 8 Moderate] [🔴 3 Unhealthy+]  Best: Fort Collins (9) | Worst: I-25 Globeville (46)
```

### 6.2 Interactive Stats
- Clicking a category filters the map and list
- Active filter shown with filled background
- "Clear filters" appears when filtered

### 6.3 Responsive Behavior
- Desktop: Full horizontal bar
- Mobile: Condensed into the floating pill or bottom sheet header

---

## 7. Loading & Error States

### 7.1 Initial Loading
- Map loads immediately with placeholder bounds
- Skeleton pulse animation on sidebar cards
- "Fetching live air quality data..." message

### 7.2 Error/Fallback State
- Clear message: "Live data unavailable - showing demo data"
- Yellow/amber indicator instead of green "Live"
- Retry button prominent

### 7.3 Refresh Loading
- Refresh icon spins while fetching
- Existing data remains visible (optimistic UI)
- Toast notification on success: "Data updated"

---

## 8. Micro-interactions & Polish

### 8.1 Transitions
- All state changes: 200ms ease-out
- Map fly-to: 1000ms with easing
- Bottom sheet: 300ms spring easing

### 8.2 Keyboard Navigation
- Tab through interactive elements
- Arrow keys navigate station list
- Enter selects focused station
- Escape closes popups/deselects

### 8.3 URL State (nuqs)
- `?station={id}` - Selected station
- `?filter={category}` - Active filter
- Shareable links that restore exact view

### 8.4 Hover Tooltips (Desktop)
- Markers show station name on hover (native title or custom tooltip)
- Delay: 500ms to avoid flicker

---

## 9. Component Structure

```
src/features/demos/map/
├── AirQualityMap.tsx          # Main component, layout orchestration
├── components/
│   ├── MapView.tsx            # MapLibre map instance
│   ├── StationMarker.tsx      # Custom marker with size/animation
│   ├── StationPopup.tsx       # MapLibre popup content
│   ├── StationList.tsx        # Scrollable station list
│   ├── StationListItem.tsx    # Individual list row
│   ├── StationDetail.tsx      # Full station details card
│   ├── StatsBar.tsx           # Summary statistics
│   ├── MobileBottomSheet.tsx  # Mobile drawer component
│   ├── OnboardingHint.tsx     # First-visit tooltip
│   └── Legend.tsx             # AQI color legend
├── hooks/
│   ├── useStations.ts         # Data fetching logic
│   └── useMapInteraction.ts   # Selection, filtering state
└── utils/
    └── aqi.ts                 # AQI color, size, category helpers
```

---

## 10. Implementation Priority

**Phase 1 - Core UX (High Impact)**
1. Station list in sidebar with click-to-select
2. Map popups on marker click
3. Selected state visual connection
4. URL state for selected station

**Phase 2 - Polish**
5. Marker size by AQI severity
6. Summary stats bar
7. Search and filter functionality
8. Keyboard navigation

**Phase 3 - Mobile**
9. Responsive layout breakpoint
10. Bottom sheet drawer
11. Floating summary pill
12. Mobile-optimized popups

**Phase 4 - Delight**
13. Onboarding hint
14. Marker pulse animations
15. Loading skeletons
16. Hover tooltips

---

## Design Decisions & Trade-offs

1. **Bottom sheet vs modal on mobile**: Bottom sheet chosen for more native feel and partial-view capability

2. **Popup + sidebar vs popup-only**: Hybrid approach lets users get quick info (popup) or deep dive (sidebar) based on intent

3. **Sorting by AQI vs alphabetical**: AQI descending surfaces the most interesting/concerning data first, but alphabetical might be added as an option

4. **Dark map theme**: Matches the overall dark UI, makes colored markers pop, feels more "technical/professional"

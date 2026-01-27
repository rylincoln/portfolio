# Resume Page Design Refinement

## Goal

Improve the resume page with professional design aesthetics focusing on:
- Visual hierarchy and typography
- Professional polish
- Differentiation that reflects 20+ years of technical leadership

## Aesthetic Direction

**Technical sophistication** - Clean but with subtle nods to technical background. Monospace accents, precise spacing. Says "I build systems."

---

## Design Specifications

### Typography & Header

**Name block:**
- Name: 5xl on desktop, bold, `tracking-tight`
- Title: lighter weight, slightly smaller than name
- Summary: generous `leading-relaxed` for readability

**Monospace accents:**
- Dates and locations use `font-mono` in smaller size
- Creates visual distinction between content and metadata
- Example: `2022–Present · Remote` in monospace

**Spacing:**
- 6rem (`space-y-24`) between major sections
- 2rem between items within sections
- Page padding: `py-16` or `py-20` for commanding presence

---

### Section Headers

**Left-border accent treatment:**
- 2px left border using primary accent color
- Padding-left to indent header text from border
- Remove current bottom border
- Mimics code editor gutter - subtle but distinctive

```html
<h2 class="text-2xl font-semibold pl-4 border-l-2 border-primary">
  Experience
</h2>
```

---

### Experience Entries

**Three-line structure per position:**
1. Job title - bold/semibold
2. Company name - normal weight
3. Date · Location - monospace, muted, smaller

```
Technical Director, EV Digital
TRC Companies, Inc.
2022–Present · Remote

• Lead architecture and delivery...
• Drive cross-functional delivery...
```

**Spacing:**
- `space-y-10` or `space-y-12` between positions
- Accomplishments aligned with text block
- No visible separators - whitespace only

---

### Skills Display

**Tags instead of comma-separated lists:**
- Each skill as a small bordered tag
- Monospace font inside tags
- Subtle border, slight background tint
- `rounded-sm` corners

**Layout:**
- Category labels: monospace, smaller, muted
- Tags flow inline with `flex-wrap`
- `gap-2` between tags
- `gap-6` between categories

```html
<div class="space-y-6">
  <div>
    <span class="font-mono text-sm text-muted-foreground">GIS/Spatial</span>
    <div class="flex flex-wrap gap-2 mt-2">
      <span class="font-mono text-sm px-2 py-1 border border-border rounded-sm bg-secondary/30">
        ArcGIS
      </span>
      ...
    </div>
  </div>
</div>
```

---

### Education

- Same left-border header
- Degree: semibold
- University, year: monospace, muted

---

### Contact

**Horizontal layout with monospace labels:**
- Format: `label` value
- Label in monospace muted, value in primary color
- Hover: subtle underline
- Remove internal "Contact Form" link (redundant with nav)

```html
<div class="flex flex-wrap gap-x-8 gap-y-2">
  <span>
    <span class="font-mono text-sm text-muted-foreground">email </span>
    <a href="mailto:..." class="text-primary hover:underline">ry@rlblais.org</a>
  </span>
  ...
</div>
```

---

## What We're Not Adding

- No decorative backgrounds or patterns
- No cards or containers around sections
- No icons
- No new colors beyond existing palette
- No animations (keeping it static)

---

## Files to Modify

- `src/pages/Landing.tsx` - Apply all design changes
- `src/index.css` - Minor adjustments if needed for contrast

## Implementation Notes

Single-file change to Landing.tsx. All styling via Tailwind classes.

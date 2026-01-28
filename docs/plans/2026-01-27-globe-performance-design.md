# Globe Background Performance Optimization

## Overview

Rewrite the GlobeBackground component from SVG to Canvas 2D for dramatically improved runtime performance, especially on mobile devices.

## Problem

The current implementation rebuilds the entire SVG DOM every frame:
- `svg.selectAll('*').remove()` deletes ~200+ elements
- Re-appends all elements (circle, paths, countries, graticules) 60x/second
- Mouse tracking uses React state, causing component re-renders
- No consideration for reduced motion, tab visibility, or mobile constraints

## Solution

### 1. Canvas Rendering

Replace SVG with Canvas 2D. D3 geo supports Canvas natively via `path.context(ctx)`.

**Before (SVG):**
```tsx
svg.selectAll('*').remove()
svg.append('path').datum(countries).attr('d', path)
```

**After (Canvas):**
```tsx
ctx.clearRect(0, 0, width, height)
ctx.beginPath()
path(countries)
ctx.stroke()
```

Visual output remains identical: orthographic projection, graticule lines, country outlines, pulsing focus marker.

**Glow effect:** Replace SVG `<feGaussianBlur>` with `ctx.shadowBlur` or layered circles with decreasing opacity.

### 2. Animation Loop Optimization

**Adaptive frame rate:**
- 60fps on desktop, 30fps on mobile
- Track delta time, skip frames if below threshold

```tsx
const targetFPS = isMobile ? 30 : 60
const frameInterval = 1000 / targetFPS

function animate(timestamp: number) {
  const delta = timestamp - lastFrameTime.current
  if (delta >= frameInterval) {
    lastFrameTime.current = timestamp - (delta % frameInterval)
    renderGlobe()
  }
  animationRef.current = requestAnimationFrame(animate)
}
```

**Idle detection:**
- Track if rotation delta is below threshold for N frames
- Cancel `requestAnimationFrame` when at rest
- Resume on next mouse move or focus change

### 3. Mouse Event Handling

**Refs instead of state:**
```tsx
// No re-renders
const mousePosRef = useRef({ x: 0.5, y: 0.5 })
window.addEventListener('mousemove', (e) => {
  mousePosRef.current = { x: e.clientX / window.innerWidth, ... }
}, { passive: true })
```

**Throttling:**
- Throttle mouse updates to 16ms (~60fps cap)
- Simple timestamp check, no external dependencies

**Passive listeners:**
- Add `{ passive: true }` to `mousemove` and `resize`
- Debounce resize events (150ms)

### 4. Visibility API

Pause animation when browser tab is hidden:

```tsx
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(animationRef.current)
    } else {
      lastFrameTime.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)
  return () => document.removeEventListener('visibilitychange', handleVisibility)
}, [])
```

### 5. Reduced Motion Support

Respect `prefers-reduced-motion` media query:

```tsx
const prefersReducedMotion = useRef(
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
)
```

When enabled:
- No continuous mouse-following rotation
- Globe stays at fixed default position
- Location focus snaps instantly (no animation)
- Pulse marker uses opacity fade only (no scale)

Listen for preference changes to update without page reload.

### 6. Mobile Optimizations

**Detection:**
```tsx
const isMobile = useRef(
  window.matchMedia('(max-width: 768px)').matches ||
  navigator.maxTouchPoints > 0
)
```

**Optimizations:**
- 30fps cap (vs 60fps desktop)
- Coarser graticule: `step([30, 30])` instead of `step([15, 15])`
- Skip country fill rendering (outlines only)
- Smaller glow radius on focus marker
- Touch event support (`touchmove`)

## Component Structure

```
GlobeBackground (canvas version)
├── useEffect: fetch world atlas once
├── useEffect: setup event listeners (mouse, resize, visibility)
├── useEffect: setup animation loop
├── useRef: canvas, mouse position, rotation, animation frame, dimensions
├── useCallback: renderGlobe (draws to canvas context)
└── Single <canvas> element + vignette overlay div
```

## Dependencies

No new dependencies. All optimizations use:
- Native browser APIs (Canvas 2D, Visibility API, matchMedia)
- Existing D3 capabilities (`path.context()`)

## Files to Modify

- `src/components/ui/globe-background.tsx` - Full rewrite

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| DOM operations/sec | ~12,000 | 0 |
| React re-renders | Every mouse move | None during animation |
| Mobile usability | Poor (high CPU) | Good (30fps, simplified) |
| Battery drain | High | Low (pauses when hidden) |
| Accessibility | None | Respects reduced motion |

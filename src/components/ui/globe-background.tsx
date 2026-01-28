import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { GeoPermissibleObjects } from 'd3'
import { useGlobeFocus } from '@/contexts/globe-focus'

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Thresholds and speeds
const MOUSE_THROTTLE_MS = 16 // ~60fps cap for mouse events
const RESIZE_DEBOUNCE_MS = 150
const AUTO_ROTATION_SPEED = 0.02 // degrees per frame for idle rotation

export function GlobeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldDataRef = useRef<Topology | null>(null)
  const animationRef = useRef<number>(0)
  const lastFrameTimeRef = useRef(0)
  const mousePosRef = useRef({ x: 0.5, y: 0.5 })
  const lastMouseUpdateRef = useRef(0)
  const rotationRef = useRef({ x: 0, y: -20 })
  const targetRotationRef = useRef({ x: 0, y: -20 })
  const pulsePhaseRef = useRef(0)
  const isRunningRef = useRef(false)
  const dimensionsRef = useRef({ width: 0, height: 0 })
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { focus } = useGlobeFocus()
  const focusRef = useRef(focus)
  focusRef.current = focus

  // Detect capabilities once
  const isMobileRef = useRef(
    typeof window !== 'undefined' && (
      window.matchMedia('(max-width: 768px)').matches ||
      navigator.maxTouchPoints > 0
    )
  )
  const prefersReducedMotionRef = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const targetFPS = isMobileRef.current ? 30 : 60
  const frameInterval = 1000 / targetFPS

  // Render globe to canvas
  const renderGlobe = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const worldData = worldDataRef.current
    if (!canvas || !ctx || !worldData) return

    const { width, height } = dimensionsRef.current
    const scale = Math.min(width, height) * 0.45
    const focus = focusRef.current

    // Smooth interpolation toward target rotation
    const current = rotationRef.current
    const target = targetRotationRef.current

    if (prefersReducedMotionRef.current && !focus.coordinates) {
      // Snap to target when reduced motion is preferred
      rotationRef.current = { ...target }
    } else if (focus.coordinates) {
      // Animate toward focus location
      const ease = 0.06
      rotationRef.current = {
        x: current.x + (target.x - current.x) * ease,
        y: current.y + (target.y - current.y) * ease,
      }
    } else {
      // Auto-rotation with mouse influence
      // Slowly rotate and ease toward mouse-influenced target
      const ease = 0.03
      rotationRef.current = {
        x: current.x + (target.x - current.x) * ease + AUTO_ROTATION_SPEED,
        y: current.y + (target.y - current.y) * ease,
      }

      // Also update target to follow the auto-rotation baseline
      // This prevents snapping back when mouse moves
      targetRotationRef.current = {
        x: target.x + AUTO_ROTATION_SPEED,
        y: target.y,
      }
    }

    // Create projection
    const projection = d3.geoOrthographic()
      .scale(scale)
      .translate([width / 2, height / 2])
      .rotate([rotationRef.current.x, rotationRef.current.y, 0])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(ctx)

    // Get countries from topojson
    const countries = topojson.feature(
      worldData,
      worldData.objects.countries as GeometryCollection
    )

    // Graticule - coarser on mobile
    const graticuleStep = isMobileRef.current ? 30 : 15
    const graticule = d3.geoGraticule().step([graticuleStep, graticuleStep])

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Globe outline (ocean)
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, scale, 0, Math.PI * 2)
    ctx.strokeStyle = 'hsl(199 89% 48%)'
    ctx.lineWidth = focus.coordinates ? 1.5 : 1
    ctx.globalAlpha = focus.coordinates ? 0.25 : 0.15
    ctx.stroke()

    // Graticule lines
    ctx.beginPath()
    path(graticule() as GeoPermissibleObjects)
    ctx.strokeStyle = 'hsl(199 89% 48%)'
    ctx.lineWidth = 0.3
    ctx.globalAlpha = 0.08
    ctx.stroke()

    // Country outlines
    ctx.beginPath()
    path(countries as GeoPermissibleObjects)
    ctx.strokeStyle = 'hsl(199 89% 48%)'
    ctx.lineWidth = 0.5
    ctx.globalAlpha = focus.coordinates ? 0.18 : 0.12
    ctx.stroke()

    // Country fills - skip on mobile for performance
    if (!isMobileRef.current && 'features' in countries) {
      ctx.fillStyle = 'hsl(199 89% 48%)'
      ctx.globalAlpha = focus.coordinates ? 0.04 : 0.02
      for (const feature of countries.features) {
        ctx.beginPath()
        path(feature as GeoPermissibleObjects)
        ctx.fill()
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1

    // Draw pulsing marker at focused location
    if (focus.coordinates) {
      const projected = projection(focus.coordinates)

      if (projected) {
        const [px, py] = projected

        // Check if point is on visible side of globe
        const distance = d3.geoDistance(
          focus.coordinates,
          [-rotationRef.current.x, -rotationRef.current.y]
        )
        const isVisible = distance < Math.PI / 2

        if (isVisible) {
          // Update pulse phase (skip animation if reduced motion)
          if (!prefersReducedMotionRef.current) {
            pulsePhaseRef.current = (pulsePhaseRef.current + 0.05) % (Math.PI * 2)
          }
          const pulseScale = prefersReducedMotionRef.current ? 1 : 1 + Math.sin(pulsePhaseRef.current) * 0.3
          const pulseOpacity = 0.6 + (prefersReducedMotionRef.current ? 0 : Math.sin(pulsePhaseRef.current) * 0.2)

          // Glow radius - smaller on mobile
          const glowRadius = isMobileRef.current ? 2 : 3

          // Outer pulse ring
          ctx.beginPath()
          ctx.arc(px, py, 20 * pulseScale, 0, Math.PI * 2)
          ctx.strokeStyle = 'hsl(38 92% 50%)'
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.3 * (1 - (pulseScale - 1) / 0.3)
          ctx.shadowColor = 'hsl(38 92% 50%)'
          ctx.shadowBlur = glowRadius * 2
          ctx.stroke()

          // Middle ring
          ctx.beginPath()
          ctx.arc(px, py, 12 * pulseScale, 0, Math.PI * 2)
          ctx.strokeStyle = 'hsl(38 92% 50%)'
          ctx.lineWidth = 1.5
          ctx.globalAlpha = 0.5 * pulseOpacity
          ctx.shadowBlur = glowRadius * 2
          ctx.stroke()

          // Inner solid dot
          ctx.beginPath()
          ctx.arc(px, py, 6, 0, Math.PI * 2)
          ctx.fillStyle = 'hsl(38 92% 50%)'
          ctx.globalAlpha = pulseOpacity
          ctx.shadowBlur = glowRadius
          ctx.fill()

          // Center bright point
          ctx.beginPath()
          ctx.arc(px, py, 2, 0, Math.PI * 2)
          ctx.fillStyle = 'white'
          ctx.globalAlpha = 0.9
          ctx.shadowBlur = 0
          ctx.fill()

          // Reset shadow
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        }
      }
    }
  }, [])

  // Animation loop with adaptive frame rate
  const animateRef = useRef<(timestamp: number) => void>()

  animateRef.current = (timestamp: number) => {
    const delta = timestamp - lastFrameTimeRef.current

    if (delta >= frameInterval) {
      lastFrameTimeRef.current = timestamp - (delta % frameInterval)
      renderGlobe()
    }

    animationRef.current = requestAnimationFrame(animateRef.current!)
  }

  // Start animation loop
  const startAnimation = useCallback(() => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    lastFrameTimeRef.current = performance.now()
    if (animateRef.current) {
      animationRef.current = requestAnimationFrame(animateRef.current)
    }
  }, [])

  // Update target rotation based on mouse or focus
  const updateTargetRotation = useCallback(() => {
    const focus = focusRef.current
    if (focus.coordinates) {
      const [lon, lat] = focus.coordinates
      targetRotationRef.current = { x: -lon, y: -lat }
    } else if (!prefersReducedMotionRef.current) {
      const mouse = mousePosRef.current
      targetRotationRef.current = {
        x: (mouse.x - 0.5) * 60,
        y: -20 + (mouse.y - 0.5) * 30,
      }
    }
    startAnimation()
  }, [startAnimation])

  // Update dimensions and re-render
  const updateDimensions = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = window.devicePixelRatio || 1

    // Setting canvas.width/height resets the context, so we must re-scale
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Reset transform before scaling (canvas.width assignment already resets, but be explicit)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    dimensionsRef.current = { width, height }
    renderGlobe()
  }, [renderGlobe])

  // Fetch world data
  useEffect(() => {
    fetch(WORLD_ATLAS_URL)
      .then(res => res.json())
      .then(data => {
        worldDataRef.current = data
        updateDimensions()
        startAnimation()
      })
      .catch(console.error)
  }, [startAnimation, updateDimensions])

  // Setup event listeners
  useEffect(() => {
    // Mouse move handler (throttled, uses ref not state)
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastMouseUpdateRef.current < MOUSE_THROTTLE_MS) return
      lastMouseUpdateRef.current = now

      mousePosRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
      updateTargetRotation()
    }

    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      const now = performance.now()
      if (now - lastMouseUpdateRef.current < MOUSE_THROTTLE_MS) return
      lastMouseUpdateRef.current = now

      const touch = e.touches[0]
      if (touch) {
        mousePosRef.current = {
          x: touch.clientX / window.innerWidth,
          y: touch.clientY / window.innerHeight,
        }
        updateTargetRotation()
      }
    }

    // Resize handler (debounced)
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = setTimeout(updateDimensions, RESIZE_DEBOUNCE_MS)
    }

    // Visibility handler
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationRef.current)
        isRunningRef.current = false
      } else {
        startAnimation()
      }
    }

    // Reduced motion preference change
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches
      if (e.matches) {
        // Snap to default position
        targetRotationRef.current = { x: 0, y: -20 }
      }
      updateTargetRotation()
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)
    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
      motionQuery.removeEventListener('change', handleMotionChange)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [updateTargetRotation, updateDimensions, startAnimation])

  // React to focus changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus triggers the effect, value read from ref
  useEffect(() => {
    updateTargetRotation()
  }, [focus, updateTargetRotation])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current)
      isRunningRef.current = false
    }
  }, [])

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.6 }}
      />
      {/* Soft vignette to fade edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, hsl(222 47% 11%) 100%)`,
        }}
      />
    </div>
  )
}

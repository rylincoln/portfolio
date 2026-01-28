import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { GeoPermissibleObjects } from "d3";
import { useGlobeFocus } from "@/contexts/globe-focus";

const WORLD_ATLAS_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Thresholds and speeds
const MOUSE_THROTTLE_MS = 16; // ~60fps cap for mouse events
const RESIZE_DEBOUNCE_MS = 250;
const AUTO_ROTATION_SPEED = 0.01; // degrees per frame for idle rotation
const TRANSITION_DURATION = 1200; // ms for location transitions
const ZOOM_AMOUNT = 0.85; // 55% zoom when focused on a location

// Easing function
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function GlobeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldDataRef = useRef<Topology | null>(null);
  const animationRef = useRef<number>(0);
  const lastFrameTimeRef = useRef(0);
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const lastMouseUpdateRef = useRef(0);
  const rotationRef = useRef({ x: 0, y: -20 });
  const targetRotationRef = useRef({ x: 0, y: -20 });
  const pulsePhaseRef = useRef(0);
  const isRunningRef = useRef(false);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transition state refs
  const transitionStartRef = useRef<number | null>(null);
  const transitionFromRef = useRef<{ x: number; y: number } | null>(null);
  const transitionToRef = useRef<{ x: number; y: number } | null>(null);
  const previousCoordsRef = useRef<[number, number] | null>(null);
  const currentCoordsRef = useRef<[number, number] | null>(null);
  const zoomRef = useRef(1);

  // Capability refs (set once in effect)
  const isMobileRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const frameIntervalRef = useRef(1000 / 60);

  const { focus } = useGlobeFocus();

  // Sync focus to ref in effect (not during render)
  useEffect(() => {
    // Use context values directly
    previousCoordsRef.current = focus.previousCoordinates;
    currentCoordsRef.current = focus.coordinates;

    if (focus.coordinates && focus.transitionStart) {
      // Start transition from current visual rotation
      transitionStartRef.current = performance.now();
      transitionFromRef.current = { ...rotationRef.current };
      const [lon, lat] = focus.coordinates;
      transitionToRef.current = { x: -lon, y: -lat };
    }
    // When focus clears, don't reset transition refs - keep globe where it is
    // This prevents jerky movement when moving between items
  }, [focus]);

  // Detect capabilities once on mount
  useEffect(() => {
    isMobileRef.current =
      window.matchMedia("(max-width: 768px)").matches ||
      navigator.maxTouchPoints > 0;
    prefersReducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    frameIntervalRef.current = isMobileRef.current ? 1000 / 30 : 1000 / 60;
  }, []);

  // Render globe to canvas
  const renderGlobe = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const worldData = worldDataRef.current;
    if (!canvas || !ctx || !worldData) return;

    const { width, height } = dimensionsRef.current;
    const baseScale = Math.min(width, height) * 0.45;
    const currentCoords = currentCoordsRef.current;
    const previousCoords = previousCoordsRef.current;

    // Calculate transition progress
    let transitionProgress = 1;
    if (
      transitionStartRef.current &&
      transitionFromRef.current &&
      transitionToRef.current
    ) {
      const elapsed = timestamp - transitionStartRef.current;
      transitionProgress = Math.min(1, elapsed / TRANSITION_DURATION);
    }

    const easedProgress = easeOutCubic(transitionProgress);

    // Calculate zoom - stay zoomed while focused, with smooth transitions
    const targetZoom = currentCoords ? 1 + ZOOM_AMOUNT : 1;
    // Faster zoom in, slower zoom out
    const zoomSpeed = currentCoords ? 0.08 : 0.04;
    zoomRef.current += (targetZoom - zoomRef.current) * zoomSpeed;
    const scale = baseScale * zoomRef.current;

    // Update rotation
    if (
      transitionFromRef.current &&
      transitionToRef.current &&
      transitionProgress < 1
    ) {
      // Interpolate rotation during transition
      rotationRef.current = {
        x:
          transitionFromRef.current.x +
          (transitionToRef.current.x - transitionFromRef.current.x) *
            easedProgress,
        y:
          transitionFromRef.current.y +
          (transitionToRef.current.y - transitionFromRef.current.y) *
            easedProgress,
      };
      targetRotationRef.current = { ...rotationRef.current };
    } else if (currentCoords) {
      // Snap to target when transition complete
      const [lon, lat] = currentCoords;
      rotationRef.current = { x: -lon, y: -lat };
      targetRotationRef.current = { x: -lon, y: -lat };
    } else if (transitionToRef.current) {
      // Focus just cleared - stay at last focused position, don't jerk back
      // Just hold position, no auto-rotation yet
    } else if (!prefersReducedMotionRef.current) {
      // Auto-rotation with mouse influence (only when never focused)
      const ease = 0.03;
      const current = rotationRef.current;
      const target = targetRotationRef.current;
      rotationRef.current = {
        x: current.x + (target.x - current.x) * ease + AUTO_ROTATION_SPEED,
        y: current.y + (target.y - current.y) * ease,
      };
      targetRotationRef.current = {
        x: target.x + AUTO_ROTATION_SPEED,
        y: target.y,
      };
    }

    // Create projection
    const projection = d3
      .geoOrthographic()
      .scale(scale)
      .translate([width / 2, height / 2])
      .rotate([rotationRef.current.x, rotationRef.current.y, 0])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(ctx);

    // Get countries from topojson
    const countries = topojson.feature(
      worldData,
      worldData.objects.countries as GeometryCollection,
    );

    // Graticule - coarser on mobile
    const graticuleStep = isMobileRef.current ? 30 : 15;
    const graticule = d3.geoGraticule().step([graticuleStep, graticuleStep]);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Globe outline (ocean)
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, scale, 0, Math.PI * 2);
    ctx.strokeStyle = "hsl(199 89% 48%)";
    ctx.lineWidth = currentCoords ? 1.5 : 1;
    ctx.globalAlpha = currentCoords ? 0.25 : 0.15;
    ctx.stroke();

    // Graticule lines
    ctx.beginPath();
    path(graticule() as GeoPermissibleObjects);
    ctx.strokeStyle = "hsl(199 89% 48%)";
    ctx.lineWidth = 0.3;
    ctx.globalAlpha = 0.08;
    ctx.stroke();

    // Country outlines
    ctx.beginPath();
    path(countries as GeoPermissibleObjects);
    ctx.strokeStyle = "hsl(199 89% 48%)";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = currentCoords ? 0.18 : 0.12;
    ctx.stroke();

    // Country fills - skip on mobile for performance
    if (!isMobileRef.current && "features" in countries) {
      ctx.fillStyle = "hsl(199 89% 48%)";
      ctx.globalAlpha = currentCoords ? 0.04 : 0.02;
      for (const feature of countries.features) {
        ctx.beginPath();
        path(feature as GeoPermissibleObjects);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // Draw trail particles during transition
    if (
      previousCoords &&
      currentCoords &&
      transitionProgress < 1 &&
      !prefersReducedMotionRef.current
    ) {
      const interpolate = d3.geoInterpolate(previousCoords, currentCoords);
      const numParticles = 12;

      // Draw faint arc line first
      ctx.beginPath();
      ctx.strokeStyle = "hsl(38 92% 50%)";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.15 * (1 - transitionProgress);
      ctx.setLineDash([4, 6]);
      for (let t = 0; t <= 1; t += 0.02) {
        const point = interpolate(t);
        const projected = projection(point);
        if (projected) {
          const distance = d3.geoDistance(point, [
            -rotationRef.current.x,
            -rotationRef.current.y,
          ]);
          if (distance < Math.PI / 2) {
            if (t === 0) {
              ctx.moveTo(projected[0], projected[1]);
            } else {
              ctx.lineTo(projected[0], projected[1]);
            }
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw particles
      for (let i = 0; i < numParticles; i++) {
        // Stagger particles along the path - spread them out more
        const particleOffset = i / numParticles;
        const particleProgress = easedProgress - particleOffset * 0.6;

        if (particleProgress > 0 && particleProgress < 1) {
          const point = interpolate(
            Math.min(1, Math.max(0, particleProgress * 1.3)),
          );
          const projected = projection(point);

          if (projected) {
            const [px, py] = projected;

            // Check visibility
            const distance = d3.geoDistance(point, [
              -rotationRef.current.x,
              -rotationRef.current.y,
            ]);
            const isVisible = distance < Math.PI / 2;

            if (isVisible) {
              // Leading particles brighter and larger
              const leadFactor = 1 - particleOffset;
              const opacity = 0.4 + leadFactor * 0.6;
              const size = 3 + leadFactor * 3;

              ctx.beginPath();
              ctx.arc(px, py, size, 0, Math.PI * 2);
              ctx.fillStyle = "hsl(38 92% 50%)";
              ctx.globalAlpha = opacity;
              ctx.shadowColor = "hsl(38 92% 60%)";
              ctx.shadowBlur = 8;
              ctx.fill();
            }
          }
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Draw pulsing marker at focused location
    if (currentCoords) {
      const projected = projection(currentCoords);

      if (projected) {
        const [px, py] = projected;

        // Check if point is on visible side of globe
        const distance = d3.geoDistance(currentCoords, [
          -rotationRef.current.x,
          -rotationRef.current.y,
        ]);
        const isVisible = distance < Math.PI / 2;

        if (isVisible) {
          // Update pulse phase (skip animation if reduced motion)
          if (!prefersReducedMotionRef.current) {
            pulsePhaseRef.current =
              (pulsePhaseRef.current + 0.05) % (Math.PI * 2);
          }
          const pulseScale = prefersReducedMotionRef.current
            ? 1
            : 1 + Math.sin(pulsePhaseRef.current) * 0.3;
          const pulseOpacity =
            0.6 +
            (prefersReducedMotionRef.current
              ? 0
              : Math.sin(pulsePhaseRef.current) * 0.2);

          // Fade in marker during transition
          const markerOpacity = transitionProgress < 1 ? easedProgress : 1;

          // Glow radius - smaller on mobile
          const glowRadius = isMobileRef.current ? 2 : 3;

          // Outer pulse ring
          ctx.beginPath();
          ctx.arc(px, py, 20 * pulseScale, 0, Math.PI * 2);
          ctx.strokeStyle = "hsl(38 92% 50%)";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.3 * (1 - (pulseScale - 1) / 0.3) * markerOpacity;
          ctx.shadowColor = "hsl(38 92% 50%)";
          ctx.shadowBlur = glowRadius * 2;
          ctx.stroke();

          // Middle ring
          ctx.beginPath();
          ctx.arc(px, py, 12 * pulseScale, 0, Math.PI * 2);
          ctx.strokeStyle = "hsl(38 92% 50%)";
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5 * pulseOpacity * markerOpacity;
          ctx.shadowBlur = glowRadius * 2;
          ctx.stroke();

          // Inner solid dot
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fillStyle = "hsl(38 92% 50%)";
          ctx.globalAlpha = pulseOpacity * markerOpacity;
          ctx.shadowBlur = glowRadius;
          ctx.fill();

          // Center bright point
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.globalAlpha = 0.9 * markerOpacity;
          ctx.shadowBlur = 0;
          ctx.fill();

          // Reset shadow
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
    }
  }, []);

  // Animation loop ref for self-reference
  const animateRef = useRef<((timestamp: number) => void) | null>(null);

  // Update animate function
  useEffect(() => {
    animateRef.current = (timestamp: number) => {
      const delta = timestamp - lastFrameTimeRef.current;

      if (delta >= frameIntervalRef.current) {
        lastFrameTimeRef.current =
          timestamp - (delta % frameIntervalRef.current);
        renderGlobe(timestamp);
      }

      if (animateRef.current) {
        animationRef.current = requestAnimationFrame(animateRef.current);
      }
    };
  }, [renderGlobe]);

  // Start animation loop
  const startAnimation = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    lastFrameTimeRef.current = performance.now();
    if (animateRef.current) {
      animationRef.current = requestAnimationFrame(animateRef.current);
    }
  }, []);

  // Update target rotation based on mouse
  const updateTargetRotation = useCallback(() => {
    const currentCoords = currentCoordsRef.current;
    if (currentCoords) {
      // Focus controls rotation, not mouse
      return;
    }
    if (!prefersReducedMotionRef.current) {
      const mouse = mousePosRef.current;
      targetRotationRef.current = {
        x: (mouse.x - 0.5) * 60,
        y: -20 + (mouse.y - 0.5) * 30,
      };
    }
    startAnimation();
  }, [startAnimation]);

  // Update dimensions and re-render
  const updateDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    dimensionsRef.current = { width, height };
    renderGlobe(performance.now());
  }, [renderGlobe]);

  // Fetch world data
  useEffect(() => {
    fetch(WORLD_ATLAS_URL)
      .then((res) => res.json())
      .then((data) => {
        worldDataRef.current = data;
        updateDimensions();
        startAnimation();
      })
      .catch(console.error);
  }, [startAnimation, updateDimensions]);

  // Setup event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseUpdateRef.current < MOUSE_THROTTLE_MS) return;
      lastMouseUpdateRef.current = now;

      mousePosRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      updateTargetRotation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const now = performance.now();
      if (now - lastMouseUpdateRef.current < MOUSE_THROTTLE_MS) return;
      lastMouseUpdateRef.current = now;

      const touch = e.touches[0];
      if (touch) {
        mousePosRef.current = {
          x: touch.clientX / window.innerWidth,
          y: touch.clientY / window.innerHeight,
        };
        updateTargetRotation();
      }
    };

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(
        updateDimensions,
        RESIZE_DEBOUNCE_MS,
      );
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationRef.current);
        isRunningRef.current = false;
      } else {
        startAnimation();
      }
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
      if (e.matches) {
        targetRotationRef.current = { x: 0, y: -20 };
      }
      updateTargetRotation();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionChange);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [updateTargetRotation, updateDimensions, startAnimation]);

  // React to focus changes - start animation when focus updates
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus triggers effect
  useEffect(() => {
    startAnimation();
  }, [focus, startAnimation]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      isRunningRef.current = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
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
  );
}

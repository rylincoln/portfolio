import { useEffect, useState } from 'react'

export function TopoBackground() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      setMousePos({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Calculate parallax offsets based on mouse position
  const offsetX = (mousePos.x - 0.5) * 30
  const offsetY = (mousePos.y - 0.5) * 30

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
      aria-hidden="true"
    >
      {/* Primary contour layer */}
      <svg
        className="absolute w-full h-full transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          opacity: 0.07,
        }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="topo-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="hsl(199 89% 48%)"
              strokeWidth="0.5"
              opacity="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo-grid)" />

        {/* Topographic contour lines */}
        <g fill="none" stroke="hsl(199 89% 48%)" strokeWidth="1.5">
          {/* Contour ring 1 - large, right side */}
          <ellipse cx="750" cy="550" rx="350" ry="280" opacity="0.5" />
          <ellipse cx="750" cy="550" rx="290" ry="230" opacity="0.4" />
          <ellipse cx="750" cy="550" rx="230" ry="180" opacity="0.35" />
          <ellipse cx="750" cy="550" rx="170" ry="130" opacity="0.3" />
          <ellipse cx="750" cy="550" rx="110" ry="80" opacity="0.25" />

          {/* Contour ring 2 - upper left */}
          <ellipse cx="150" cy="180" rx="220" ry="160" opacity="0.4" />
          <ellipse cx="150" cy="180" rx="160" ry="115" opacity="0.35" />
          <ellipse cx="150" cy="180" rx="100" ry="70" opacity="0.3" />

          {/* Contour ring 3 - lower left */}
          <ellipse cx="80" cy="850" rx="180" ry="140" opacity="0.35" />
          <ellipse cx="80" cy="850" rx="120" ry="90" opacity="0.3" />
          <ellipse cx="80" cy="850" rx="60" ry="45" opacity="0.25" />
        </g>
      </svg>

      {/* Secondary layer with opposite parallax for depth */}
      <svg
        className="absolute w-full h-full transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${-offsetX * 0.6}px, ${-offsetY * 0.6}px)`,
          opacity: 0.05,
        }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="none" stroke="hsl(215 20% 65%)" strokeWidth="1">
          {/* Additional contours for depth */}
          <ellipse cx="450" cy="350" rx="280" ry="200" opacity="0.6" />
          <ellipse cx="450" cy="350" rx="220" ry="155" opacity="0.5" />
          <ellipse cx="450" cy="350" rx="160" ry="110" opacity="0.4" />

          <ellipse cx="900" cy="120" rx="150" ry="100" opacity="0.5" />
          <ellipse cx="900" cy="120" rx="100" ry="65" opacity="0.4" />
        </g>
      </svg>

      {/* Coordinate markers - dots that move faster */}
      <svg
        className="absolute w-full h-full transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${offsetX * 1.8}px, ${offsetY * 1.8}px)`,
          opacity: 0.12,
        }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="hsl(199 89% 48%)">
          <circle cx="120" cy="280" r="4" opacity="0.6" />
          <circle cx="280" cy="120" r="3" opacity="0.5" />
          <circle cx="420" cy="220" r="3.5" opacity="0.55" />
          <circle cx="580" cy="80" r="3" opacity="0.5" />
          <circle cx="720" cy="320" r="4" opacity="0.6" />
          <circle cx="880" cy="480" r="3" opacity="0.5" />
          <circle cx="180" cy="580" r="3.5" opacity="0.55" />
          <circle cx="380" cy="680" r="3" opacity="0.5" />
          <circle cx="520" cy="820" r="4" opacity="0.6" />
          <circle cx="680" cy="720" r="3" opacity="0.5" />
          <circle cx="860" cy="780" r="3.5" opacity="0.55" />
          <circle cx="80" cy="420" r="3" opacity="0.5" />
          <circle cx="950" cy="350" r="3" opacity="0.5" />
          <circle cx="320" cy="450" r="2.5" opacity="0.45" />
          <circle cx="620" cy="550" r="2.5" opacity="0.45" />
        </g>
      </svg>

      {/* Soft vignette at edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, hsl(222 47% 11% / 0.8) 100%)`,
        }}
      />
    </div>
  )
}

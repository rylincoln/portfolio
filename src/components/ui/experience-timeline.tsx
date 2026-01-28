import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

type TimelineProps = {
  positions: number // Number of positions to show dots for
}

export function ExperienceTimeline({ positions }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || positions === 0) return

    const svg = d3.select(svgRef.current)
    const height = svgRef.current.parentElement?.offsetHeight || 600

    svg.attr('height', height)

    // Clear previous content
    svg.selectAll('*').remove()

    // Create gradient for the line
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'timeline-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'hsl(199 89% 48%)')
      .attr('stop-opacity', 0.4)

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'hsl(199 89% 48%)')
      .attr('stop-opacity', 0.1)

    // Draw the main timeline line
    svg.append('line')
      .attr('x1', 8)
      .attr('y1', 20)
      .attr('x2', 8)
      .attr('y2', height - 20)
      .attr('stroke', 'url(#timeline-gradient)')
      .attr('stroke-width', 1)

    // Calculate dot positions (evenly distributed)
    const dotSpacing = (height - 40) / Math.max(positions - 1, 1)
    const dots = Array.from({ length: positions }, (_, i) => ({
      y: 20 + i * dotSpacing,
      delay: i * 150,
    }))

    // Add animated dots at each position
    dots.forEach((dot, i) => {
      // Outer pulse ring
      svg.append('circle')
        .attr('cx', 8)
        .attr('cy', dot.y)
        .attr('r', 3)
        .attr('fill', 'none')
        .attr('stroke', 'hsl(199 89% 48%)')
        .attr('stroke-width', 1)
        .attr('opacity', 0)
        .transition()
        .delay(dot.delay)
        .duration(600)
        .attr('opacity', 0.3)
        .on('end', function repeat() {
          d3.select(this)
            .attr('r', 3)
            .attr('opacity', 0.3)
            .transition()
            .duration(2000)
            .delay(i * 400)
            .attr('r', 10)
            .attr('opacity', 0)
            .on('end', repeat)
        })

      // Inner solid dot
      svg.append('circle')
        .attr('cx', 8)
        .attr('cy', dot.y)
        .attr('r', 0)
        .attr('fill', 'hsl(199 89% 48%)')
        .attr('opacity', 0.6)
        .transition()
        .delay(dot.delay)
        .duration(400)
        .ease(d3.easeElasticOut.amplitude(1).period(0.4))
        .attr('r', 4)
    })

  }, [positions])

  return (
    <svg
      ref={svgRef}
      className="absolute left-0 top-0 w-4 h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  )
}

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { cn } from '@/lib/utils'

export function SectionConnector({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)

    // Clear previous content
    svg.selectAll('*').remove()

    // Create a subtle flowing line with dots
    const width = 60
    const height = 24

    svg.attr('width', width).attr('height', height)

    // Center line
    svg.append('line')
      .attr('x1', 0)
      .attr('y1', height / 2)
      .attr('x2', width)
      .attr('y2', height / 2)
      .attr('stroke', 'hsl(199 89% 48%)')
      .attr('stroke-width', 1)
      .attr('opacity', 0.15)

    // Animated traveling dot
    const dot = svg.append('circle')
      .attr('cx', 0)
      .attr('cy', height / 2)
      .attr('r', 2)
      .attr('fill', 'hsl(199 89% 48%)')
      .attr('opacity', 0.4)

    function animateDot() {
      dot
        .attr('cx', 0)
        .attr('opacity', 0)
        .transition()
        .duration(300)
        .attr('opacity', 0.4)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('cx', width)
        .transition()
        .duration(300)
        .attr('opacity', 0)
        .on('end', () => {
          setTimeout(animateDot, 1000)
        })
    }

    // Start animation after a delay
    setTimeout(animateDot, 500)

    // Static dots at ends
    svg.append('circle')
      .attr('cx', 4)
      .attr('cy', height / 2)
      .attr('r', 2)
      .attr('fill', 'hsl(199 89% 48%)')
      .attr('opacity', 0.3)

    svg.append('circle')
      .attr('cx', width - 4)
      .attr('cy', height / 2)
      .attr('r', 2)
      .attr('fill', 'hsl(199 89% 48%)')
      .attr('opacity', 0.3)

  }, [])

  return (
    <div className={cn("flex justify-center my-2", className)}>
      <svg ref={svgRef} className="pointer-events-none" />
    </div>
  )
}

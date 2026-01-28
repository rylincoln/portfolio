import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

type SkillsChartProps = {
  categories: { name: string; count: number }[]
}

export function SkillsChart({ categories }: SkillsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || categories.length === 0) return

    const svg = d3.select(svgRef.current)
    const width = 120
    const height = categories.length * 24

    svg.attr('width', width).attr('height', height)

    // Clear previous content
    svg.selectAll('*').remove()

    const maxCount = Math.max(...categories.map(c => c.count))
    const barScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, width - 8])

    // Draw bars for each category
    categories.forEach((category, i) => {
      const y = i * 24 + 4

      // Background bar
      svg.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', width - 8)
        .attr('height', 16)
        .attr('rx', 2)
        .attr('fill', 'hsl(217 33% 17%)')
        .attr('opacity', 0.5)

      // Animated fill bar
      svg.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', 0)
        .attr('height', 16)
        .attr('rx', 2)
        .attr('fill', 'hsl(199 89% 48%)')
        .attr('opacity', 0.2)
        .transition()
        .delay(i * 100 + 300)
        .duration(800)
        .ease(d3.easeQuadOut)
        .attr('width', barScale(category.count))

      // Subtle end marker
      svg.append('circle')
        .attr('cx', barScale(category.count) + 4)
        .attr('cy', y + 8)
        .attr('r', 0)
        .attr('fill', 'hsl(199 89% 48%)')
        .attr('opacity', 0.5)
        .transition()
        .delay(i * 100 + 900)
        .duration(300)
        .attr('r', 3)
    })

  }, [categories])

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  )
}

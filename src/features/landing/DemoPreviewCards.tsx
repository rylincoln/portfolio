import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Map, Activity, Table } from 'lucide-react'

const demos = [
  {
    title: 'Interactive Map',
    description: 'Colorado air quality monitoring stations with real-time data visualization on an interactive MapLibre map.',
    href: '/demos/map',
    icon: Map,
  },
  {
    title: 'Live Dashboard',
    description: 'Real-time environmental metrics dashboard with auto-refreshing data, sparklines, and status indicators.',
    href: '/demos/dashboard',
    icon: Activity,
  },
  {
    title: 'Data Explorer',
    description: 'Query and filter air quality station data with sortable tables, advanced filters, and CSV export.',
    href: '/demos/explorer',
    icon: Table,
  },
]

export default function DemoPreviewCards() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold">Interactive Demos</h2>
          <p className="mt-2 text-muted-foreground">
            Proof of skills, not just descriptions
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {demos.map((demo) => (
            <Link key={demo.href} to={demo.href}>
              <Card className="h-full transition-colors hover:bg-secondary/50 hover:border-primary/50">
                <CardHeader>
                  <demo.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{demo.title}</CardTitle>
                  <CardDescription>{demo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 rounded-md bg-secondary/50 flex items-center justify-center text-muted-foreground text-sm">
                    Preview
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

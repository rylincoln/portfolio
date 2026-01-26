import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AreaChart, SparkAreaChart } from '@tremor/react'

interface MetricData {
  name: string
  value: number
  unit: string
  status: 'good' | 'moderate' | 'unhealthy'
  trend: number[]
  history: { time: string; value: number }[]
}

const initialMetrics: MetricData[] = [
  {
    name: 'PM2.5',
    value: 12.4,
    unit: 'µg/m³',
    status: 'moderate',
    trend: [8, 10, 9, 12, 11, 13, 12],
    history: [],
  },
  {
    name: 'Ozone',
    value: 0.045,
    unit: 'ppm',
    status: 'good',
    trend: [0.04, 0.042, 0.038, 0.045, 0.043, 0.046, 0.045],
    history: [],
  },
  {
    name: 'NO₂',
    value: 18.2,
    unit: 'ppb',
    status: 'good',
    trend: [15, 17, 16, 19, 18, 20, 18],
    history: [],
  },
  {
    name: 'CO',
    value: 0.8,
    unit: 'ppm',
    status: 'good',
    trend: [0.6, 0.7, 0.65, 0.8, 0.75, 0.85, 0.8],
    history: [],
  },
]

const statusColors = {
  good: 'bg-green-500/20 text-green-400',
  moderate: 'bg-yellow-500/20 text-yellow-400',
  unhealthy: 'bg-red-500/20 text-red-400',
}

function generateHistory(): { time: string; value: number }[] {
  const now = new Date()
  const history = []
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    history.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: Math.random() * 20 + 5,
    })
  }
  return history
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricData[]>(() =>
    initialMetrics.map(m => ({ ...m, history: generateHistory() }))
  )
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev =>
        prev.map(m => ({
          ...m,
          value: m.value + (Math.random() - 0.5) * m.value * 0.1,
          trend: [...m.trend.slice(1), m.value + (Math.random() - 0.5) * m.value * 0.1],
          history: [
            ...m.history.slice(1),
            {
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              value: m.value + (Math.random() - 0.5) * m.value * 0.1,
            },
          ],
        }))
      )
      setLastUpdate(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Durango Monitoring Station</CardTitle>
              <CardDescription>Real-time environmental metrics (simulated)</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Badge className={statusColors[metric.status]}>
                  {metric.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof metric.value === 'number' && metric.value < 1
                  ? metric.value.toFixed(3)
                  : metric.value.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {metric.unit}
                </span>
              </div>
              <div className="h-12 mt-2">
                <SparkAreaChart
                  data={metric.trend.map((v, i) => ({ index: i, value: v }))}
                  index="index"
                  categories={['value']}
                  colors={[metric.status === 'good' ? 'emerald' : metric.status === 'moderate' ? 'yellow' : 'red']}
                  className="h-12"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PM2.5 - Last 24 Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart
            className="h-72"
            data={metrics[0].history}
            index="time"
            categories={['value']}
            colors={['cyan']}
            yAxisWidth={40}
          />
        </CardContent>
      </Card>
    </div>
  )
}

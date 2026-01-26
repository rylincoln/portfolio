import MetricsDashboard from '@/features/demos/dashboard/MetricsDashboard'

export default function DashboardDemo() {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Live Dashboard Demo</h1>
        <p className="text-muted-foreground mt-2">
          Real-time environmental metrics with auto-refresh (simulated data)
        </p>
      </div>
      <MetricsDashboard />
    </div>
  )
}

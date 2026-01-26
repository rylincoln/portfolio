import AirQualityMap from '@/features/demos/map/AirQualityMap'

export default function MapDemo() {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Interactive Map Demo</h1>
        <p className="text-muted-foreground mt-2">
          Colorado air quality monitoring stations with MapLibre GL JS
        </p>
      </div>
      <AirQualityMap />
    </div>
  )
}

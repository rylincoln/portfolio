import DataExplorer from '@/features/demos/explorer/DataExplorer'

export default function ExplorerDemo() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Explorer Demo</h1>
        <p className="text-muted-foreground mt-2">
          Query and filter air quality station data with search, sort, and export
        </p>
      </div>
      <DataExplorer />
    </div>
  )
}

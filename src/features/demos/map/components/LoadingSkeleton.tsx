import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar skeleton */}
      <div className="bg-card border rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 w-24 rounded-full bg-muted animate-pulse"
            />
          ))}
          <div className="flex-1" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Map skeleton */}
        <div className="lg:col-span-2 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading map...</p>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Header card skeleton */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Station list skeleton */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="h-8 w-full bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
                    <div>
                      <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function MobileLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar skeleton */}
      <div className="bg-card border rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-16 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Map skeleton */}
      <div className="relative h-[calc(100vh-200px)] min-h-[400px] rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Fetching live air quality data...</p>
        </div>
      </div>
    </div>
  )
}

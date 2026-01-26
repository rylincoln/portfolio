const stats = [
  { label: 'Years Experience', value: '20+' },
  { label: 'Production Platforms', value: '5+' },
  { label: 'Full-Stack Delivery', value: '100%' },
]

export default function StatsBar() {
  return (
    <section className="border-y border-border/40 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

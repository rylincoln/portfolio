import { Outlet } from 'react-router-dom'
import Header from './Header'
import { GlobeBackground } from '@/components/ui/globe-background'
import { GlobeFocusProvider } from '@/contexts/globe-focus'

export default function Layout() {
  return (
    <GlobeFocusProvider>
      <div className="relative min-h-screen flex flex-col overflow-x-hidden">
        <GlobeBackground />
      <Header />
      <main className="flex-1 relative">
        <Outlet />
      </main>
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Built by Ry Blaisdell
          </p>
        </div>
      </footer>
      </div>
    </GlobeFocusProvider>
  )
}

import { Link, useLocation } from 'react-router-dom'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

const demos = [
  { title: 'Interactive Map', href: '/demos/map', description: 'Colorado air quality visualization' },
  { title: 'Live Dashboard', href: '/demos/dashboard', description: 'Real-time environmental metrics' },
  { title: 'Data Explorer', href: '/demos/explorer', description: 'Query and filter station data' },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-lg">Ry Blaisdell</span>
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/resume">
                <NavigationMenuLink
                  className={cn(
                    'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                    location.pathname === '/resume' && 'bg-accent/50'
                  )}
                >
                  Resume
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Demos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  {demos.map((demo) => (
                    <li key={demo.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          to={demo.href}
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            location.pathname === demo.href && 'bg-accent/50'
                          )}
                        >
                          <div className="text-sm font-medium leading-none">{demo.title}</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {demo.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/contact">
                <NavigationMenuLink
                  className={cn(
                    'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                    location.pathname === '/contact' && 'bg-accent/50'
                  )}
                >
                  Contact
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}

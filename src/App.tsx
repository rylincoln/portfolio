import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center gap-4">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  )
}

export default App

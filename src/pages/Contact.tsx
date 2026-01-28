import { SectionConnector } from '@/components/ui/section-connector'
import ContactForm from '@/features/contact/ContactForm'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold pl-4 border-l-2 border-primary mb-8">
      {children}
    </h2>
  )
}

export default function Contact() {
  return (
    <div className="container max-w-3xl py-16 md:py-20 px-6">
      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Contact
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light">
          Let's connect. Whether you have an opportunity to discuss or just want to say hello.
        </p>
      </header>

      <SectionConnector />

      <section className="mb-16">
        <SectionHeader>Send a Message</SectionHeader>
        <ContactForm />
      </section>

      <SectionConnector />

      <section>
        <SectionHeader>Direct Contact</SectionHeader>
        <div className="space-y-2">
          <a
            href="https://www.linkedin.com/in/ry-blaisdell-342977281/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <span className="text-muted-foreground font-mono">→</span>
            <span className="font-medium group-hover:text-primary transition-colors">linkedin</span>
            <span className="font-mono text-sm text-muted-foreground">/in/ry-blaisdell</span>
          </a>
          <a
            href="https://github.com/rylincoln"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <span className="text-muted-foreground font-mono">→</span>
            <span className="font-medium group-hover:text-primary transition-colors">github</span>
            <span className="font-mono text-sm text-muted-foreground">/rylincoln</span>
          </a>
        </div>
      </section>
    </div>
  )
}

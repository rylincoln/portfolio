import ContactForm from '@/features/contact/ContactForm'

export default function Contact() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="text-muted-foreground mt-2">
          Let's connect. Whether you have an opportunity to discuss or just want to say hello.
        </p>
      </div>
      <ContactForm />
    </div>
  )
}

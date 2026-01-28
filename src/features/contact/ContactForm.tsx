import { useState, useRef, useEffect } from 'react'
import { TerminalInput } from './TerminalInput'
import { TerminalTextarea } from './TerminalTextarea'
import { TerminalButton } from './TerminalButton'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'
type ActiveField = 'name' | 'email' | 'message' | null

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeField, setActiveField] = useState<ActiveField>('name')
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Focus first field on mount
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const validateField = (field: ActiveField): boolean => {
    if (!formRef.current) return false
    const formData = new FormData(formRef.current)
    const value = formData.get(field as string) as string

    if (!value?.trim()) {
      setFieldErrors(prev => ({ ...prev, [field as string]: true }))
      setTimeout(() => setFieldErrors(prev => ({ ...prev, [field as string]: false })), 400)
      return false
    }

    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldErrors(prev => ({ ...prev, email: true }))
      setTimeout(() => setFieldErrors(prev => ({ ...prev, email: false })), 400)
      return false
    }

    return true
  }

  const advanceField = () => {
    if (activeField === 'name') {
      if (validateField('name')) {
        setActiveField('email')
        emailRef.current?.focus()
      }
    } else if (activeField === 'email') {
      if (validateField('email')) {
        setActiveField('message')
        messageRef.current?.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: ActiveField) => {
    if (e.key === 'Enter' && field !== 'message') {
      e.preventDefault()
      advanceField()
    }
    if (e.key === 'Enter' && field === 'message' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const handleFocus = (field: ActiveField) => {
    setActiveField(field)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateField('name') || !validateField('email') || !validateField('message')) {
      return
    }

    setStatus('submitting')
    setErrorMessage('')
    setActiveField(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setStatus('success')
      form.reset()
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong'
      )
      setActiveField('name')
      nameRef.current?.focus()
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setActiveField('name')
    setErrorMessage('')
    nameRef.current?.focus()
  }

  if (status === 'success') {
    return (
      <div className="bg-secondary/30 rounded-lg p-8 font-mono text-sm space-y-4">
        <div className="flex items-center gap-2 text-green-400">
          <span>✓</span>
          <span>message sent successfully</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{'>'}</span>
          <span>awaiting response...</span>
          <span className="animate-cursor-blink">█</span>
        </div>
        <button
          onClick={handleReset}
          className="text-primary hover:underline underline-offset-4 mt-4"
        >
          [send another]
        </button>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-secondary/30 rounded-lg p-6 space-y-4"
    >
      <TerminalInput
        ref={nameRef}
        name="name"
        label="name"
        placeholder="your name"
        isActive={activeField === 'name'}
        hasError={fieldErrors.name}
        onFocus={() => handleFocus('name')}
        onKeyDown={(e) => handleKeyDown(e, 'name')}
        disabled={status === 'submitting'}
        required
      />

      <TerminalInput
        ref={emailRef}
        name="email"
        type="email"
        label="email"
        placeholder="you@example.com"
        isActive={activeField === 'email'}
        hasError={fieldErrors.email}
        onFocus={() => handleFocus('email')}
        onKeyDown={(e) => handleKeyDown(e, 'email')}
        disabled={status === 'submitting'}
        required
      />

      <TerminalTextarea
        ref={messageRef}
        name="message"
        label="message"
        placeholder="what's on your mind? (Cmd+Enter to send)"
        isActive={activeField === 'message'}
        hasError={fieldErrors.message}
        onFocus={() => handleFocus('message')}
        onKeyDown={(e) => handleKeyDown(e, 'message')}
        disabled={status === 'submitting'}
        required
      />

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
          <span>✗</span>
          <span>transmission failed: {errorMessage}</span>
        </div>
      )}

      <div className="pt-2">
        <TerminalButton type="submit" isLoading={status === 'submitting'}>
          send
        </TerminalButton>
      </div>
    </form>
  )
}

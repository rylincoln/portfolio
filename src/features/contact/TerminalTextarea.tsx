import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface TerminalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  isActive: boolean
  hasError?: boolean
}

export const TerminalTextarea = forwardRef<HTMLTextAreaElement, TerminalTextareaProps>(
  ({ label, isActive, hasError, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className={cn('flex gap-3', hasError && 'animate-shake')}>
        <label
          htmlFor={inputId}
          className={cn(
            'font-mono text-sm flex items-center gap-0.5 min-w-[100px] pt-2.5 transition-colors duration-150',
            isActive ? 'text-primary' : 'text-muted-foreground',
            hasError && 'text-red-400'
          )}
        >
          <span className="text-muted-foreground">{'>'}</span>
          <span className="ml-1">{label}_</span>
          {isActive && (
            <span className="animate-cursor-blink text-primary">█</span>
          )}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={hasError || undefined}
          className={cn(
            'flex-1 min-h-[120px] px-3 py-2 font-mono text-sm',
            'bg-secondary/50 rounded-md border-0 resize-none',
            'placeholder:text-muted-foreground/50',
            'focus-ring-fade focus:outline-none',
            'focus:ring-2 focus:ring-primary/30 focus:shadow-[0_0_10px_rgba(var(--primary),0.1)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
TerminalTextarea.displayName = 'TerminalTextarea'

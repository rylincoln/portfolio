import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TerminalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  isActive: boolean
  hasError?: boolean
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ label, isActive, hasError, className, ...props }, ref) => {
    return (
      <div className={cn('flex items-center gap-3', hasError && 'animate-shake')}>
        <label
          className={cn(
            'font-mono text-sm flex items-center gap-0.5 min-w-[100px] transition-colors duration-150',
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
        <input
          ref={ref}
          className={cn(
            'flex-1 h-10 px-3 py-2 font-mono text-sm',
            'bg-secondary/50 rounded-md border-0',
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
TerminalInput.displayName = 'TerminalInput'

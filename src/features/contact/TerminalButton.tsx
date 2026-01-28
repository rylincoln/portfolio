import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
}

export const TerminalButton = forwardRef<HTMLButtonElement, TerminalButtonProps>(
  ({ children, isLoading, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'font-mono text-sm px-4 py-2',
          'border border-border rounded-md',
          'bg-transparent hover:bg-secondary/50',
          'transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isLoading && 'animate-pulse-subtle',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span>[transmitting...]</span>
        ) : (
          <span>[↵ {children}]</span>
        )}
      </button>
    )
  }
)
TerminalButton.displayName = 'TerminalButton'

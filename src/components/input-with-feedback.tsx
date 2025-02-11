import { cn } from '@/lib/utils'
import { Loader2Icon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Input } from './ui/input'

type InputWithFeedbackProps = ComponentProps<'input'> & {
  errorMessage?: string
  isError?: boolean
  isLoading?: boolean
  helperText?: string
}

export function InputWithFeedback({
  errorMessage,
  helperText,
  isError,
  isLoading,
  className,
  ...props
}: InputWithFeedbackProps) {
  return (
    <div className="relative w-full">
      <Input
        className={cn('w-full', className, {
          'border-red-500': isError,
        })}
        {...props}
      />
      {isError && (
        <p className="absolute -bottom-6 text-xs text-red-500">
          {errorMessage}
        </p>
      )}

      {!isError && helperText && (
        <p className="text-muted-foreground absolute -bottom-6 text-xs">
          {helperText}
        </p>
      )}

      {isLoading && (
        <Loader2Icon className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 animate-spin" />
      )}
    </div>
  )
}

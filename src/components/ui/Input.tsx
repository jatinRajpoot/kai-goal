import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, label, id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
        
        return (
            <div className="w-full">
                {label && (
                    <label 
                        htmlFor={inputId}
                        className="block text-sm font-medium text-muted-foreground mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    ref={ref}
                    className={cn(
                        'flex min-h-[44px] w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
                        error 
                            ? 'border-destructive focus-visible:ring-destructive text-destructive' 
                            : 'border-input',
                        className
                    )}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...props}
                />
                {error && (
                    <p 
                        id={`${inputId}-error`}
                        className="mt-1.5 text-sm text-destructive flex items-center gap-1"
                        role="alert"
                    >
                        <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';

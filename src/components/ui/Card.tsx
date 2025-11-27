import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';

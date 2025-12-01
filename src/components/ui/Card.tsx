import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl border border-border/60 bg-white text-card-foreground shadow-sm',
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';

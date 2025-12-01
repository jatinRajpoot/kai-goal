import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-3xl border-none bg-card text-card-foreground shadow-[0_2px_10px_rgba(0,0,0,0.03)]',
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';

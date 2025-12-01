import React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-3xl border border-gray-100 dark:border-gray-800/50 bg-card text-card-foreground shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';

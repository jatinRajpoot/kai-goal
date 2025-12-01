'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-16 px-6 text-center',
                className
            )}
        >
            {Icon && (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Icon className="h-8 w-8 text-muted-foreground/60" />
                </div>
            )}
            <h3 className="text-xl font-medium text-foreground mb-2">{title}</h3>
            {description && (
                <p className="text-muted-foreground text-center max-w-sm mb-8 leading-relaxed">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

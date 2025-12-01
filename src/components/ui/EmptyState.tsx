'use client';

import React, { ReactNode } from 'react';
import { Card } from './Card';
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
        <Card
            className={cn(
                'flex flex-col items-center justify-center py-16 px-8 bg-white dark:bg-card',
                className
            )}
        >
            {Icon && (
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-5 shadow-inner">
                    <Icon className="h-8 w-8 text-muted-foreground/70" strokeWidth={1.5} />
                </div>
            )}
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground text-center max-w-xs mb-6 leading-relaxed">
                    {description}
                </p>
            )}
            {action && <div className="mt-1">{action}</div>}
        </Card>
    );
}

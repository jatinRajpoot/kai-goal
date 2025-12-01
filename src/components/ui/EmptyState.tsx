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
                'flex flex-col items-center justify-center py-12 px-6',
                className
            )}
        >
            {Icon && (
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
            )}
            <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </Card>
    );
}

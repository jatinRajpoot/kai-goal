'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-1 -ml-2 text-muted-foreground hover:text-foreground"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-foreground">
                        Welcome back, <span className="text-muted-foreground">{user?.name || 'User'}</span>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Let&apos;s make today productive.</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium text-sm border border-border cursor-pointer hover:bg-secondary/80 transition-colors">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
            </div>
        </header>
    );
}

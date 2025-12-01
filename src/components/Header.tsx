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
        <header className="flex h-20 items-center justify-between px-6 md:px-10 sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-black/5 transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Let&apos;s make today productive</span>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}
                    </h1>
                </div>
            </div>

            {/* Right side header items if needed */}
        </header>
    );
}

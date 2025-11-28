'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    HomeIcon,
    TargetIcon,
    CheckSquareIcon,
    ActivityIcon,
    FolderIcon,
    InboxIcon,
    LogOutIcon,
    SettingsIcon,
    X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Goals', href: '/goals', icon: TargetIcon },
    { name: 'Tasks', href: '/tasks', icon: CheckSquareIcon },
    { name: 'Habits', href: '/habits', icon: ActivityIcon },
    { name: 'Resources', href: '/resources', icon: FolderIcon },
    { name: 'Inbox', href: '/inbox', icon: InboxIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-background transition-transform duration-300 md:translate-x-0 md:static md:h-screen md:bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
                    <span className="text-xl font-semibold tracking-tight text-foreground">Kai</span>
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => onClose?.()}
                                className={cn(
                                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
                                    isActive
                                        ? 'bg-secondary text-primary'
                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                )}
                            >
                                <item.icon className={cn('mr-3 h-4 w-4 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-border p-4">
                    <button
                        onClick={() => logout()}
                        className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOutIcon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}

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
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside 
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-background transition-transform duration-300 md:translate-x-0 md:static md:h-screen md:bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Main navigation"
            >
                <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
                    <span className="text-xl font-semibold tracking-tight text-foreground">Kai</span>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        aria-label="Close navigation menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" role="navigation">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => onClose?.()}
                                className={cn(
                                    'group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px]',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <item.icon 
                                    className={cn(
                                        'mr-3 h-5 w-5 transition-colors flex-shrink-0', 
                                        isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                    )} 
                                />
                                <span className="truncate">{item.name}</span>
                                {isActive && (
                                    <span className="ml-auto h-2 w-2 rounded-full bg-primary-foreground/50" aria-hidden="true" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-border p-4">
                    <button
                        onClick={() => logout()}
                        className="group flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 cursor-pointer hover:bg-destructive/10 hover:text-destructive min-h-[44px]"
                    >
                        <LogOutIcon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors flex-shrink-0" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}

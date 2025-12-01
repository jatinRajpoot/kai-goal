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
    const { logout, user } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside 
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col transition-transform duration-300 md:translate-x-0 md:static md:h-screen bg-transparent p-4",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Main navigation"
            >
                <div className="flex h-full flex-col bg-white/70 dark:bg-card/70 backdrop-blur-xl rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-white/50 dark:border-gray-800/50">
                <div className="flex h-16 items-center justify-between px-6 mb-2">
                    <span className="text-xl font-bold tracking-tight text-foreground">Kai</span>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        aria-label="Close navigation menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 overflow-y-auto" role="navigation">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => onClose?.()}
                                className={cn(
                                    'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px]',
                                    isActive
                                        ? 'bg-white dark:bg-gray-800 text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-foreground'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <item.icon 
                                    className={cn(
                                        'mr-3 h-5 w-5 transition-colors flex-shrink-0', 
                                        isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                    )} 
                                />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile Section at bottom */}
                <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-foreground font-medium text-sm shadow-inner">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 min-h-[44px]"
                    >
                        <LogOutIcon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-red-500 transition-colors flex-shrink-0" />
                        Logout
                    </button>
                </div>
                </div>
            </aside>
        </>
    );
}

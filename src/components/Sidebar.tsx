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
import { motion } from 'framer-motion';

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
                    "fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-muted/80 backdrop-blur-xl border-r border-border/50 transition-transform duration-300 md:translate-x-0 md:static md:h-screen",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Main navigation"
            >
                <div className="flex h-20 items-center justify-between px-6">
                    <span className="text-xl font-bold tracking-tight text-foreground">Kai</span>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-black/5 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        aria-label="Close navigation menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-2 overflow-y-auto" role="navigation">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => onClose?.()}
                                className={cn(
                                    'group relative flex items-center rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px]',
                                    isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute inset-0 rounded-full bg-white shadow-sm border border-black/5"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <item.icon 
                                    className={cn(
                                        'mr-3 h-5 w-5 transition-colors relative z-10',
                                        isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                    )} 
                                />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto border-t border-border/50">
                     <div className="flex items-center gap-3 mb-4 px-2">
                         <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center text-foreground font-medium text-xs shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                        </div>
                     </div>

                    <button
                        onClick={() => logout()}
                        className="group flex w-full items-center rounded-full px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 cursor-pointer hover:bg-destructive/5 hover:text-destructive min-h-[44px]"
                    >
                        <LogOutIcon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors flex-shrink-0" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}

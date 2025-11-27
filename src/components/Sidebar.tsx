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
    LogOutIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Goals', href: '/goals', icon: TargetIcon },
    { name: 'Tasks', href: '/tasks', icon: CheckSquareIcon },
    { name: 'Habits', href: '/habits', icon: ActivityIcon },
    { name: 'Resources', href: '/resources', icon: FolderIcon },
    { name: 'Inbox', href: '/inbox', icon: InboxIcon },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex h-screen w-64 flex-col border-r border-border bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
            <div className="flex h-16 items-center px-6 border-b border-border/50">
                <span className="text-xl font-semibold tracking-tight text-foreground">Kai</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
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
    );
}

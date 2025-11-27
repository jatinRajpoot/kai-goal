'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user && pathname !== '/login' && pathname !== '/signup') {
            router.push('/login');
        }
    }, [user, loading, router, pathname]);

    // Use effect for redirection if user is already logged in
    useEffect(() => {
        if (user && (pathname === '/login' || pathname === '/signup')) {
            router.push('/');
        }
    }, [user, pathname, router]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    // If on login/signup page, don't show sidebar/header layout (handled in layout, but here we just pass children)
    // Actually, layout wraps everything. We might need to conditionally render Sidebar/Header in layout based on path,
    // or have a separate layout for auth pages.
    // For now, let's just return children. If user is null and we are on login, it's fine.

    if (!user && (pathname === '/login' || pathname === '/signup')) {
        return <>{children}</>;
    }

    // If user is logged in and trying to access auth pages, return null while redirecting
    if (user && (pathname === '/login' || pathname === '/signup')) {
        return null;
    }

    return <>{children}</>;
};

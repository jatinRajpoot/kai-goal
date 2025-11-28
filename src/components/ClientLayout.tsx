'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            {isAuthPage ? (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    {children}
                </div>
            ) : (
                <div className="flex h-screen bg-background">
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Header onMenuClick={() => setIsSidebarOpen(true)} />
                        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
                            {children}
                        </main>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}

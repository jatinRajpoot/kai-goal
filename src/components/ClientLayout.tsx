'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <ErrorBoundary>
                {isAuthPage ? (
                    <div className="min-h-screen bg-background flex items-center justify-center p-4">
                        <div className="w-full max-w-md">
                           {children}
                        </div>
                    </div>
                ) : (
                    <div className="flex h-screen bg-background overflow-hidden">
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onClose={() => setIsSidebarOpen(false)}
                        />
                        <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-background relative z-0">
                            <Header onMenuClick={() => setIsSidebarOpen(true)} />
                            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 scroll-smooth">
                                <ErrorBoundary>
                                    <div className="max-w-6xl mx-auto w-full animate-fade-in pb-10">
                                        {children}
                                    </div>
                                </ErrorBoundary>
                            </main>
                        </div>
                    </div>
                )}
            </ErrorBoundary>
        </ProtectedRoute>
    );
}

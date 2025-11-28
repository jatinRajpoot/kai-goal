'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast Types
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    // Convenience methods
    success: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => string;
    error: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => string;
    info: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => string;
    warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => string;
    loading: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { ...toast, id };
        
        setToasts((prev) => [...prev, newToast]);

        // Auto-remove toast after duration (unless it's a loading toast)
        if (toast.type !== 'loading') {
            const duration = toast.duration ?? 4000;
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, [removeToast]);

    const success = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
        return addToast({ message, type: 'success', ...options });
    }, [addToast]);

    const error = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
        return addToast({ message, type: 'error', duration: 6000, ...options });
    }, [addToast]);

    const info = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
        return addToast({ message, type: 'info', ...options });
    }, [addToast]);

    const warning = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
        return addToast({ message, type: 'warning', duration: 5000, ...options });
    }, [addToast]);

    const loading = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
        return addToast({ message, type: 'loading', ...options });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning, loading }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div 
            className="fixed bottom-0 right-0 z-[100] p-4 space-y-2 max-w-md w-full pointer-events-none"
            aria-live="polite"
            aria-label="Notifications"
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
                ))}
            </AnimatePresence>
        </div>
    );
}

// Individual Toast Item
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        loading: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
    };

    const backgrounds = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        loading: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm',
                backgrounds[toast.type]
            )}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">
                {icons[toast.type]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                    {toast.message}
                </p>
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="mt-2 text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer transition-colors"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            {toast.type !== 'loading' && (
                <button
                    onClick={() => onRemove(toast.id)}
                    className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -m-1"
                    aria-label="Dismiss notification"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </motion.div>
    );
}

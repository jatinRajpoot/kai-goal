'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const iconColors = {
        danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div 
                ref={dialogRef}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-full flex-shrink-0", iconColors[variant])}>
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 
                                id="dialog-title" 
                                className="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl border-t border-gray-100 dark:border-gray-800">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

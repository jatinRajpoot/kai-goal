import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

        const variants = {
            primary: 'bg-[#111] text-white shadow-md hover:shadow-lg hover:bg-[#222] hover:scale-[1.02] active:scale-[0.98]',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-accent shadow-sm',
            outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-foreground shadow-sm',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            danger: 'bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/90',
        };

        // Mobile-friendly touch targets (minimum 44px height)
        const sizes = {
            sm: 'min-h-[44px] h-auto px-3 py-2 text-xs md:min-h-[32px] md:h-8 md:py-0',
            md: 'min-h-[44px] h-auto px-5 py-2.5 text-sm',
            lg: 'min-h-[48px] h-auto px-8 py-3 text-base',
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </motion.button>
        );
    }
);
Button.displayName = 'Button';

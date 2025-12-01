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
        const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.96]';

        const variants = {
            primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent',
            outline: 'border border-border bg-transparent hover:bg-secondary hover:text-foreground',
            ghost: 'hover:bg-secondary hover:text-foreground',
            danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        };

        // Mobile-friendly touch targets (minimum 44px height)
        const sizes = {
            sm: 'min-h-[36px] h-9 px-4 text-xs',
            md: 'min-h-[44px] h-11 px-6 text-sm',
            lg: 'min-h-[48px] h-12 px-8 text-base',
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.96 }}
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

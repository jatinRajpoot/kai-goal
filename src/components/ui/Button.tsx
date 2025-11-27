import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

        const variants = {
            primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2 text-sm',
            lg: 'h-12 px-8 text-base',
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);
Button.displayName = 'Button';

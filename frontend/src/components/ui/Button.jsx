import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    const variants = {
        primary: 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg shadow-primary/25',
        secondary: 'bg-surface-light hover:bg-white/10 text-white border border-white/10',
        ghost: 'hover:bg-white/5 text-gray-300 hover:text-white',
        outline: 'border border-primary/50 text-primary hover:bg-primary/10',
    };

    const sizes = {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10',
    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
});

Button.displayName = "Button";

export { Button };

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function ProgressBar({ progress, className }) {
    return (
        <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-light", className)}>
            <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
        </div>
    );
}

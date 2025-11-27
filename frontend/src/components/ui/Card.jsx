import React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "glass rounded-xl p-6 shadow-xl",
            className
        )}
        {...props}
    >
        {children}
    </div>
));
Card.displayName = "Card";

export { Card };

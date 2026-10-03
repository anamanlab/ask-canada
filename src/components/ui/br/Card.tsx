/**
 * Brasil Design System - Card component
 * Based on https://designsystem.gov.br/componentes/cartao/
 * Clean, accessible card with consistent spacing and elevation.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface BrCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const BASE_STYLES = 'rounded-xl transition-shadow duration-200';

const VARIANT_STYLES = {
  default: 'bg-white border border-gray-200',
  outlined: 'bg-white border-2 border-[#009C3B]',
  elevated: 'bg-white shadow-lg border-none',
};

const PADDING_STYLES = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const HOVER_STYLES = 'hover:shadow-xl';

export const BrCard = forwardRef<HTMLDivElement, BrCardProps>(
  ({ variant = 'default', padding = 'md', hoverable = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          BASE_STYLES,
          VARIANT_STYLES[variant],
          PADDING_STYLES[padding],
          hoverable && HOVER_STYLES,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BrCard.displayName = 'BrCard';

/** Card header with optional action */
export interface BrCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const BrCardHeader = forwardRef<HTMLDivElement, BrCardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex items-start justify-between gap-4 mb-4', className)}
        {...props}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
        {children}
      </div>
    );
  }
);

BrCardHeader.displayName = 'BrCardHeader';

/** Card content */
export const BrCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('', className)} {...props}>
        {children}
      </div>
    );
  }
);

BrCardContent.displayName = 'BrCardContent';

/** Card footer */
export const BrCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex items-center gap-3 mt-4 pt-4 border-t border-gray-100', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BrCardFooter.displayName = 'BrCardFooter';
/**
 * Brasil Design System - Badge/Tag component
 * Based on https://designsystem.gov.br/componentes/etiqueta/
 * For status indicators, categories, counts.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type BrBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BrBadgeSize = 'sm' | 'md' | 'lg';

export interface BrBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BrBadgeVariant;
  size?: BrBadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const BASE_STYLES = 'inline-flex items-center font-medium rounded-full';

const VARIANT_STYLES: Record<BrBadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-[#E8F5E9] text-[#007A2E]',
  warning: 'bg-[#FFF8E1] text-[#F57F17]',
  danger: 'bg-[#FDEDEC] text-[#B71C1C]',
  info: 'bg-[#E3F2FD] text-[#0D47A1]',
  neutral: 'bg-[#F5F5F5] text-[#424242]',
};

const SIZE_STYLES: Record<BrBadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const DOT_STYLES: Record<BrBadgeVariant, string> = {
  default: 'bg-gray-400',
  success: 'bg-[#009C3B]',
  warning: 'bg-[#F57F17]',
  danger: 'bg-[#D62828]',
  info: 'bg-[#1976D2]',
  neutral: 'bg-gray-500',
};

export const BrBadge = forwardRef<HTMLSpanElement, BrBadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, removable = false, onRemove, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(BASE_STYLES, VARIANT_STYLES[variant], SIZE_STYLES[size], className)}
        {...props}
      >
        {dot && <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_STYLES[variant])} aria-hidden="true" />}
        <span>{children}</span>
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={clsx('ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors', {
              'text-gray-500': variant === 'default' || variant === 'neutral',
              'text-[#007A2E]': variant === 'success',
              'text-[#F57F17]': variant === 'warning',
              'text-[#B71C1C]': variant === 'danger',
              'text-[#0D47A1]': variant === 'info',
            })}
            aria-label={`Remover ${children}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

BrBadge.displayName = 'BrBadge';
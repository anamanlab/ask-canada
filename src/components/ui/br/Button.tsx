/**
 * Brasil Design System - Button component
 * Based on https://designsystem.gov.br/componentes/botao/
 * Uses the official government green (#009C3B) and follows accessibility guidelines.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

export type BrButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
export type BrButtonSize = 'sm' | 'md' | 'lg';

export interface BrButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrButtonVariant;
  size?: BrButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
}

const BASE_STYLES = 'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANT_STYLES: Record<BrButtonVariant, string> = {
  primary: 'bg-[#009C3B] text-white hover:bg-[#007A2E] focus:ring-[#009C3B] active:bg-[#006626]',
  secondary: 'bg-white text-[#009C3B] border-2 border-[#009C3B] hover:bg-[#F0F9F3] focus:ring-[#009C3B] active:bg-[#E0F2E7]',
  tertiary: 'bg-transparent text-[#009C3B] hover:bg-[#F0F9F3] focus:ring-[#009C3B] active:bg-[#E0F2E7]',
  danger: 'bg-[#D62828] text-white hover:bg-[#B71C1C] focus:ring-[#D62828] active:bg-[#9A1616]',
  ghost: 'bg-transparent text-[#009C3B] hover:bg-[#F0F9F3] focus:ring-[#009C3B]',
};

const SIZE_STYLES: Record<BrButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[36px]',
  md: 'px-4 py-2 text-base gap-2 min-h-[44px]',
  lg: 'px-6 py-3 text-lg gap-2.5 min-h-[52px]',
};

export const BrButton = forwardRef<HTMLButtonElement, BrButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, loading = false, icon, iconPosition = 'start', className, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={clsx(
          BASE_STYLES,
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : iconPosition === 'start' && icon ? (
          <span aria-hidden="true">{icon}</span>
        ) : null}
        <span>{children}</span>
        {iconPosition === 'end' && icon && !loading && <span aria-hidden="true">{icon}</span>}
      </button>
    );
  }
);

BrButton.displayName = 'BrButton';
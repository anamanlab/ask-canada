/**
 * Brasil Design System - Alert component
 * Based on https://designsystem.gov.br/componentes/alerta/
 * For important messages, warnings, success states.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

export type BrAlertVariant = 'info' | 'success' | 'warning' | 'danger';
export type BrAlertSize = 'sm' | 'md' | 'lg';

export interface BrAlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BrAlertVariant;
  size?: BrAlertSize;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  children: ReactNode;
}

const BASE_STYLES = 'rounded-lg border flex gap-3';

const VARIANT_STYLES: Record<BrAlertVariant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-[#E8F5E9] border-[#A5D6A7] text-[#1B5E20]',
  warning: 'bg-[#FFF8E1] border-[#FFE082] text-[#F57F17]',
  danger: 'bg-[#FDEDEC] border-[#EF9A9A] text-[#B71C1C]',
};

const SIZE_STYLES: Record<BrAlertSize, string> = {
  sm: 'p-3 text-sm',
  md: 'p-4 text-base',
  lg: 'p-5 text-lg',
};

const ICONS: Record<BrAlertVariant, ReactNode> = {
  info: (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  danger: (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

const DISMISS_ICON = (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const BrAlert = forwardRef<HTMLDivElement, BrAlertProps>(
  ({ variant = 'info', size = 'md', title, dismissible = false, onDismiss, icon, children, className, role = 'alert', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(BASE_STYLES, VARIANT_STYLES[variant], SIZE_STYLES[size], className)}
        role={role}
        {...props}
      >
        {icon ?? ICONS[variant]}
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors text-current opacity-70 hover:opacity-100"
            aria-label="Fechar alerta"
          >
            {DISMISS_ICON}
          </button>
        )}
      </div>
    );
  }
);

BrAlert.displayName = 'BrAlert';
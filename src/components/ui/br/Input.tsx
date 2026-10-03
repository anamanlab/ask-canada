/**
 * Brasil Design System - Input component
 * Based on https://designsystem.gov.br/componentes/campo-de-texto/
 * Accessible form input with label, hint, error states.
 */
import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface BrInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

const INPUT_BASE = 'w-full px-4 py-2.5 text-base bg-white border rounded-lg transition-colors duration-150';
const INPUT_FOCUS = 'focus:outline-none focus:ring-2 focus:ring-[#009C3B] focus:border-transparent';
const INPUT_DISABLED = 'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';
const INPUT_ERROR = 'border-[#D62828] focus:ring-[#D62828]';
const INPUT_DEFAULT = 'border-gray-300 hover:border-gray-400';

export const BrInput = forwardRef<HTMLInputElement, BrInputProps>(
  ({ label, hint, error, fullWidth = true, className, id, required, disabled, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const inputId = id || `br-input-${Math.random().toString(36).slice(2, 9)}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

    return (
      <div className={clsx(fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className={clsx('block text-sm font-medium text-gray-900 mb-1.5', label && 'cursor-text')}
          >
            {label}
            {required && <span className="text-[#D62828] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(INPUT_BASE, INPUT_FOCUS, INPUT_DISABLED, error ? INPUT_ERROR : INPUT_DEFAULT, className)}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-[#D62828]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

BrInput.displayName = 'BrInput';

/** Textarea variant */
export const BrTextarea = forwardRef<HTMLTextAreaElement, BrInputProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ label, hint, error, fullWidth = true, className, id, required, disabled, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const inputId = id || `br-textarea-${Math.random().toString(36).slice(2, 9)}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

    return (
      <div className={clsx(fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className={clsx('block text-sm font-medium text-gray-900 mb-1.5', label && 'cursor-text')}
          >
            {label}
            {required && <span className="text-[#D62828] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(INPUT_BASE, INPUT_FOCUS, INPUT_DISABLED, error ? INPUT_ERROR : INPUT_DEFAULT, 'min-h-[100px] resize-y', className)}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-[#D62828]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

BrTextarea.displayName = 'BrTextarea';

/** Label component for standalone use */
interface BrLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const BrLabel = forwardRef<HTMLLabelElement, BrLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx('block text-sm font-medium text-gray-900 mb-1.5', className)}
        {...props}
      >
        {children}
        {required && <span className="text-[#D62828] ml-1" aria-hidden="true">*</span>}
      </label>
    );
  }
);

BrLabel.displayName = 'BrLabel';
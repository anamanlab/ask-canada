/**
 * Button implementation, shared by the widget kit ('@/components/ui/Button', merges `className` with
 * tailwind-merge) and the plain build for pages and site chrome ('@/components/ui/plain/Button').
 */
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import type { ClassJoiner } from '@/lib/cx';
import { useT } from '@/lib/i18n/provider';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'quiet' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-chip font-medium no-underline transition-[transform,background-color,box-shadow,color,border-color] duration-200 ease-spring disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper shadow-md hover:-translate-y-px',
  accent:
    'bg-maple text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_6px_16px_-4px_color-mix(in_srgb,var(--maple)_55%,transparent)] hover:bg-maple-ink hover:-translate-y-px',
  secondary: 'border border-hair-2 bg-transparent text-ink hover:bg-paper-2',
  quiet: 'bg-transparent text-ink hover:bg-hair',
  glass: 'glass border border-hair text-ink shadow-sm hover:-translate-y-px hover:shadow-md',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-11 px-5 text-[15px]',
  lg: 'min-h-12 px-6 text-[15.5px]',
};

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconEnd?: LucideIcon;
  children?: ReactNode;
};

/** Build the three button components around a class joiner. Call once at module scope. */
export function createButtons(cn: ClassJoiner) {
  function Button({
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconEnd: IconEnd,
    loading,
    className,
    children,
    type = 'button',
    ...rest
  }: Common & ComponentProps<'button'> & { loading?: boolean }) {
    return (
      <button type={type} className={cn(base, variants[variant], sizes[size], className)} aria-busy={loading || undefined} {...rest}>
        {loading ? <LoaderCircle className="size-[17px] animate-spin" aria-hidden /> : Icon ? <Icon className="size-[17px]" aria-hidden strokeWidth={1.8} /> : null}
        {children}
        {IconEnd ? <IconEnd className="size-4 flip-rtl" aria-hidden strokeWidth={1.8} /> : null}
      </button>
    );
  }

  function LinkButton({
    variant = 'primary',
    size = 'lg',
    icon: Icon,
    iconEnd,
    external,
    className,
    children,
    ...rest
  }: Common & AnchorHTMLAttributes<HTMLAnchorElement> & { external?: boolean }) {
    const t = useT();
    const End = iconEnd ?? (external ? ArrowUpRight : undefined);
    return (
      <a
        className={cn(base, variants[variant], sizes[size], className)}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {Icon ? <Icon className="size-[17px]" aria-hidden strokeWidth={1.8} /> : null}
        {children}
        {End ? <End className="size-4 flip-rtl" aria-hidden strokeWidth={1.9} /> : null}
        {external ? <span className="sr-only"> {t('a11y.newTab')}</span> : null}
      </a>
    );
  }

  function IconButton({
    label,
    icon: Icon,
    size = 'md',
    active,
    className,
    type = 'button',
    ...rest
  }: ComponentProps<'button'> & { label: string; icon: LucideIcon; size?: 'sm' | 'md'; active?: boolean }) {
    return (
      <button
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          'inline-grid shrink-0 place-items-center rounded-full transition-colors duration-200 hover:bg-hair hover:text-ink disabled:opacity-40',
          size === 'md' ? 'size-11' : 'size-10',
          active ? 'bg-hair text-ink' : 'text-ink-2',
          className,
        )}
        {...rest}
      >
        <Icon className={size === 'md' ? 'size-5' : 'size-[18px]'} aria-hidden strokeWidth={1.7} />
      </button>
    );
  }

  return { Button, LinkButton, IconButton };
}

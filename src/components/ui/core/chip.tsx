/**
 * Chip implementation, shared by the widget kit ('@/components/ui/Chip', merges `className` with
 * tailwind-merge) and the plain build for the landing ('@/components/ui/plain/Chip').
 */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ClassJoiner } from '@/lib/cx';

type Base = { icon?: LucideIcon; iconClassName?: string; selected?: boolean; wrap?: boolean; children: ReactNode; className?: string };

const base =
  'inline-flex min-h-11 items-center gap-2 rounded-chip border px-4 ps-3.5 text-[15px] font-medium text-ink no-underline shadow-sm transition-[transform,box-shadow,background-color,border-color] duration-200 ease-spring hover:-translate-y-0.5 hover:bg-card hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/** Build the chip component around a class joiner. Call once at module scope. */
export function createChip(cn: ClassJoiner) {
  return function Chip({
    icon: Icon,
    iconClassName,
    selected,
    wrap,
    children,
    className,
    ...rest
  }: (Base & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }) | (Base & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' })) {
    const cls = cn(base, selected ? 'border-ink bg-card' : 'glass border-hair', wrap ? 'py-2.5 text-start leading-snug' : 'whitespace-nowrap', className);
    const inner = (
      <>
        {Icon ? <Icon className={cn('size-[18px] shrink-0 text-ink-2', iconClassName)} aria-hidden strokeWidth={1.7} /> : null}
        <span>{children}</span>
      </>
    );
    if (rest.as === 'a') {
      const { as: Tag, ...anchor } = rest;
      return (
        <Tag className={cls} {...anchor}>
          {inner}
        </Tag>
      );
    }
    const { as: Tag = 'button', type = 'button', ...button } = rest;
    return (
      <Tag type={type} aria-pressed={selected} className={cls} {...button}>
        {inner}
      </Tag>
    );
  };
}

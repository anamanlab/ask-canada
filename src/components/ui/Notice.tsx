/**
 * Notice: inline banner for warnings, service disruptions, confirmations and tips.
 * <Notice tone="warn|info|ok|danger" icon={Clock} title="Your current passport stops working when you apply online.">
 *   Travelling before your new one arrives? Apply in person instead.
 * </Notice>
 * Use role="status" for live updates (set `live`).
 *
 * `className` is merged with tailwind-merge. The app shell imports '@/components/ui/plain/Notice' instead.
 */
import { cn } from '@/lib/cn';
import { createNotice } from './core/notice';

export const Notice = createNotice(cn);

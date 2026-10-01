import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'paper', 'paper-2', 'paper-3', 'card', 'card-glass', 'ink', 'ink-2', 'ink-3', 'hair', 'hair-2',
        'maple', 'maple-ink', 'maple-wash', 'pine', 'pine-wash', 'glacier', 'glacier-wash', 'amber', 'amber-wash',
        'aurora-green', 'aurora-teal', 'aurora-violet', 'aurora-rose', 'seg-on',
      ],
      radius: ['chip', 'field', 'tile', 'card', 'panel', 'stage'],
      font: ['serif', 'sans', 'mono'],
    },
  },
});

/** Merge class names; later Tailwind classes win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

'use client';
/**
 * The landing's `<h1>`, registered with the app shell so focus can return to it when the chat closes on a
 * touch device (see `composers.focusLanding`). Renders a plain heading outside the shell.
 *
 * <LandingTitle className="l-hello">Hello, Canada.</LandingTitle>
 */
import type { ReactNode } from 'react';
import { useComposers } from './composers';

export function LandingTitle({ className, children }: { className?: string; children: ReactNode }) {
  const composers = useComposers();
  return (
    <h1 ref={composers?.registerLandingTitle} tabIndex={-1} className={className}>
      {children}
    </h1>
  );
}

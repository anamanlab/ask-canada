'use client';
/**
 * The dock pinned to the bottom of the chat: jump pill, follow-up composer and the fine print. Its fade
 * scrim shows only while part of the thread sits under it.
 */
import { memo, useEffect, useRef, type Ref, type RefObject } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { disclaimerKey } from '@/lib/brand';
import { useLocale } from '@/lib/i18n/provider';
import { Composer, type ComposerHandle } from './Composer';
import type { JumpMode } from './useThreadGeometry';

type Props = {
  scrim: boolean;
  jump: JumpMode;
  onJump: () => void;
  innerRef: RefObject<HTMLDivElement | null>;
  composerRef: Ref<ComposerHandle>;
};

export const ChatDock = memo(function ChatDock({ scrim, jump, onJump, innerRef, composerRef }: Props) {
  const { t } = useLocale();
  const dock = useRef<HTMLDivElement>(null);

  // Scrolling to a target (keyboard focus, "jump", find-in-page) keeps it clear of the docked composer and
  // its fade: the page's scroll padding at the bottom tracks the dock's height + 40px.
  useEffect(() => {
    const el = dock.current;
    if (!el) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty('scroll-padding-bottom', `${Math.round(el.offsetHeight + 40)}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('scroll-padding-bottom');
    };
  }, []);

  return (
    <div ref={dock} className={cn('ac-dock no-print', scrim && 'has-scrim')}>
      <div ref={innerRef} className="ac-dock__inner">
        {jump ? (
          <button key={jump} type="button" className="ac-jump" onClick={onJump}>
            <ArrowDown className="size-4" aria-hidden />
            {jump === 'latest' ? t('chat.jump') : t('chat.continueReading')}
          </button>
        ) : null}
        <Composer
          ref={composerRef}
          id="composer-dock"
          variant="dock"
          placeholders={[t('composer.followUp')]}
          hint={t('composer.sinHint')}
          label={t('composer.followUpLabel')}
        />
        <p className="ac-fine">{t(disclaimerKey)}</p>
      </div>
    </div>
  );
});

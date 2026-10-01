'use client';
/**
 * "Clear this device": removes every plan, checklist, reminder and chat Ask Canada saved in this
 * browser (all `ac:` keys) plus language/theme cookies, after a confirmation dialog (`ClearDeviceDialog`,
 * fetched the first time the button is used).
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/plain/Button';
import { useOnDemand } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';

const loadDialog = () => import('./ClearDeviceDialog').then((m) => m.ClearDeviceDialog);

export function ClearDeviceButton({
  variant = 'secondary',
  className,
  label,
  withIcon,
}: {
  variant?: 'secondary' | 'glass' | 'link';
  className?: string;
  label?: string;
  withIcon?: boolean;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  // The dialog is fetched and mounted on first use, into <body>: nothing to download, render or subscribe to
  // until then, and the footer/menu styles around the trigger don't leak into it.
  const [Dialog, wantDialog] = useOnDemand(loadDialog);
  const [done, setDone] = useState(false);
  const show = () => {
    wantDialog();
    setOpen(true);
  };
  const trigger =
    variant === 'link' ? (
      <button type="button" onPointerEnter={wantDialog} onFocus={wantDialog} onClick={show} className={className}>
        {withIcon ? <Trash2 className="size-4" strokeWidth={1.8} aria-hidden /> : null}
        {label ?? t('device.clear')}
      </button>
    ) : (
      <Button variant={variant} icon={Trash2} onPointerEnter={wantDialog} onFocus={wantDialog} onClick={show} className={className}>
        {label ?? t('device.clear')}
      </Button>
    );
  return (
    <>
      {trigger}
      <span className="sr-only" role="status" aria-live="polite">
        {done ? t('device.cleared') : ''}
      </span>
      {Dialog
        ? createPortal(
            <Dialog
              open={open}
              onClose={() => setOpen(false)}
              onCleared={() => {
                setDone(true);
                setOpen(false);
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}

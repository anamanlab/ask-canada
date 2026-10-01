'use client';
/** The confirmation behind "Clear this device": what is saved in this browser, and the button that removes it. */
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Sheet';
import { clearDevice, useDeviceItems } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';

export function ClearDeviceDialog({ open, onClose, onCleared }: { open: boolean; onClose: () => void; onCleared: () => void }) {
  const { t } = useLocale();
  const items = useDeviceItems();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('device.confirmTitle')}
      description={items.length ? t('device.confirmBody', { count: items.length }) : t('device.confirmEmpty')}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button
            variant="accent"
            icon={Trash2}
            onClick={() => {
              clearDevice();
              onCleared();
            }}
          >
            {t('device.clearConfirm')}
          </Button>
        </>
      }
    >
      {items.length ? (
        <ul className="m-0 grid list-none gap-1.5 p-0 text-[14px]">
          {items.slice(0, 6).map((i) => (
            <li key={i.key} className="flex justify-between gap-3 rounded-[12px] bg-paper-2 px-3 py-2">
              <span className="truncate font-medium">{i.label}</span>
              {i.detail ? <span className="shrink-0 text-ink-3">{i.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Dialog>
  );
}

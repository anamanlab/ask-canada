'use client';
/** Conversations saved on this device: reopen, delete one, or clear them all. Starter questions fill a short list. */
import { memo, useState } from 'react';
import { CornerDownRight, MessageSquare, MessagesSquare, Trash2 } from 'lucide-react';
import { pack } from '@/countries/active';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog, Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';
import { removeItem, useDeviceItems, type SavedItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useChatCommands } from './actions';

/** "Today, 11:18 p.m." / "Yesterday, 9:02 a.m." / "Sep 12, 2026" (recent chats read relatively). */
function useRelativeTime() {
  const { t, fmt } = useLocale();
  return (ms: number) => {
    const d = new Date(ms);
    const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((day(new Date()) - day(d)) / 86400000);
    const time = fmt.date(d, { hour: 'numeric', minute: '2-digit' });
    if (diff === 0) return t('history.today', { time });
    if (diff === 1) return t('history.yesterday', { time });
    return fmt.date(d, { dateStyle: 'medium' });
  };
}

type Props = { open: boolean; onClose: () => void; onOpen: (item: SavedItem) => void; currentKey?: string };

export const HistorySheet = memo(function HistorySheet({ open, onClose, onOpen, currentKey }: Props) {
  const { t } = useLocale();
  const when = useRelativeTime();
  const { send } = useChatCommands();
  const chats = useDeviceItems().filter((i) => i.kind === 'chat');
  const [confirm, setConfirm] = useState(false);
  // Starter questions fill the sheet (and give it a next step) while the list is short. Skip any already asked.
  const asked = new Set(chats.map((c) => c.label.trim().toLowerCase()));
  const starters = pack.services
    .filter((s) => s.featured && !asked.has(t(`services.${s.id}.starter`).trim().toLowerCase()))
    .slice(0, 3);
  const tryAsking = (
    <>
      <p className="eyebrow mb-3 mt-8">{t('history.tryAsking')}</p>
      <ul className="m-0 grid list-none gap-2 p-0">
        {starters.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="ac-fu w-full"
              onClick={() => {
                onClose();
                send(t(`services.${s.id}.starter`));
              }}
            >
              <CornerDownRight className="size-4 shrink-0 text-maple flip-rtl" aria-hidden />
              <span>{t(`services.${s.id}.starter`)}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={t('history.title')}
        description={t('history.description')}
        footer={
          chats.length ? (
            <button type="button" className="ac-textbtn" onClick={() => setConfirm(true)}>
              <Trash2 className="size-4" aria-hidden strokeWidth={1.8} />
              {t('history.clearAll')}
            </button>
          ) : undefined
        }
      >
        {chats.length ? (
          <ul className="ac-hist">
            {chats.map((c) => {
              const current = c.key === currentKey;
              return (
                <li key={c.key} className={cn('ac-hist__row', current && 'is-current')}>
                  <button type="button" onClick={() => onOpen(c)} className="ac-hist__open" aria-current={current ? 'page' : undefined}>
                    <MessageSquare className="size-[18px] shrink-0 text-ink-3" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink" dir="auto">
                        {c.label}
                      </span>
                      <span className="block text-[12.5px] text-ink-3">
                        {current ? <span className="ac-hist__now">{t('history.current')} · </span> : null}
                        {when(c.updatedAt)}
                      </span>
                    </span>
                  </button>
                  <IconButton className="shrink-0" label={t('history.delete', { title: c.label })} icon={Trash2} size="sm" onClick={() => removeItem(c.key)} />
                </li>
              );
            })}
          </ul>
        ) : null}
        {chats.length > 0 && chats.length <= 3 && starters.length ? <div className="ac-hist-try">{tryAsking}</div> : null}
        {chats.length ? null : (
          <div className="ac-hist-empty">
            <span className="ac-hist-empty__art" aria-hidden>
              <MessagesSquare className="size-7" strokeWidth={1.5} />
            </span>
            <p className="ac-hist-empty__t">{t('history.emptyTitle')}</p>
            <p className="ac-hist-empty__p">{t('history.emptyBody')}</p>
            {tryAsking}
          </div>
        )}
      </Sheet>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('history.clearTitle')}
        description={t('history.clearBody', { count: chats.length })}
        footer={
          <>
            <Button variant="quiet" onClick={() => setConfirm(false)}>
              {t('action.cancel')}
            </Button>
            <Button
              variant="accent"
              icon={Trash2}
              onClick={() => {
                chats.forEach((c) => removeItem(c.key));
                setConfirm(false);
              }}
            >
              {t('history.clearConfirm')}
            </Button>
          </>
        }
      />
    </>
  );
});

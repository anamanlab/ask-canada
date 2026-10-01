/**
 * A component fetched the first time it is wanted, so what a page keeps closed at load (menus, pickers,
 * confirm dialogs) stays out of its first download.
 *
 *   const loadMenu = () => import('./MenuSheet').then((m) => m.MenuSheet);   // module scope
 *   const [Menu, wantMenu] = useOnDemand(loadMenu);
 *   <button onPointerEnter={wantMenu} onFocus={wantMenu} onClick={() => { wantMenu(); setOpen(true); }} />
 *   {Menu ? <Menu open={open} onClose={…} /> : null}
 *
 * `want()` on pointer-enter and focus starts the download on intent, before the click lands. The component
 * is `null` until it arrives; state set meanwhile (`open`) is simply there when it mounts. A download that
 * fails (offline) is logged and tried again on the next `want()`.
 */
import { useRef, useState, type ComponentType } from 'react';

export function useOnDemand<P>(load: () => Promise<ComponentType<P>>): readonly [ComponentType<P> | null, () => void] {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null);
  const loading = useRef(false);
  const want = () => {
    if (loading.current) return;
    loading.current = true;
    load().then(
      (Loaded) => setComponent(() => Loaded),
      (error: unknown) => {
        loading.current = false;
        console.error('[on-demand] a component could not be loaded', error);
      },
    );
  };
  return [Component, want];
}

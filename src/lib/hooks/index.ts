/**
 * Shared client hooks for browser state that lives outside React. Use these instead of ad-hoc `useEffect` +
 * `matchMedia` / `MutationObserver` / `ResizeObserver` / `window` listeners in components. Each module
 * documents its API at the top.
 *
 *   useMediaQuery(query), prefersReducedMotion(), isFinePointer()          ./media
 *   prefersDark()                                                          ./media
 *   useResolvedTheme(), useThemePref()                                     ./media
 *   useReducedMotion()                                                     from 'motion/react' (animation)
 *   useToday(serverToday), useNow(serverNow), localTodayISO()              ./clock
 *   useDir(), dirOf(el)                                                    ./dir
 *   useRovingFocus({ count, index, onMove })                               ./roving-focus
 *   useSlidingThumb(index, getItem, count)                                 ./thumb
 *   useElementSize(), useScrollEdges()                                     ./element-size, ./scroll-edges
 *   useWindowScrolled(px, active)                                          ./window-scroll
 *   useSettled(value, ms)                                                  ./settled
 *   lockScroll(), useScrollLock(active), isScrollLocked()                  ./scroll-lock
 *   useOnDemand(load)                                                      ./on-demand
 */
export { useMediaQuery, useResolvedTheme, useThemePref, prefersReducedMotion, isFinePointer, prefersDark, type ThemePref } from './media';
export { useToday, useNow, localTodayISO } from './clock';
export { useDir, dirOf, type Dir } from './dir';
export { useRovingFocus } from './roving-focus';
export { useSlidingThumb } from './thumb';
export { useElementSize, type Size } from './element-size';
export { useScrollEdges } from './scroll-edges';
export { useWindowScrolled } from './window-scroll';
export { useSettled } from './settled';
export { lockScroll, useScrollLock, isScrollLocked } from './scroll-lock';
export { useOnDemand } from './on-demand';

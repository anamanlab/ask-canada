'use client';
/**
 * Lab: one fixture's widget, under the header the page rendered on the server.
 *
 * Fixtures are evaluated here, in the browser, because some read the page language or pin a clock when their
 * module loads. Each widget mounts only as it nears the viewport, so a page of map fixtures doesn't fetch
 * every tile (or run every widget) up front; until then a skeleton holds its place.
 *
 * A mounted widget is rarely the height of its skeleton, so the fixtures on screen at load would push the
 * ones after them down. The first fixture therefore shows alone until that first batch has mounted, and the
 * rest of the list appears below it already in place (`LabFixtureList`, `LabSection`). Fixtures mounted later
 * are still below the viewport when they swap.
 *
 * Fixtures of one widget are about the same height, and several times taller than a skeleton. Every mounted
 * widget is measured, and the ones still waiting reserve the average of those heights, so the page is close to
 * its final length as soon as the first batch is in and the scrollbar doesn't run away while scrolling.
 */
import { Suspense, createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { fixtures } from '@/countries/active.fixtures';
import { widgets } from '@/countries/active.widgets';
import { LoadingWidget, ToolPart } from '@/components/chat/ToolPart';
import { findWidget, type Fixture } from '@/lib/widgets/types';

/** How far below the fold a widget starts mounting, so it is usually ready by the time it scrolls in. */
const MOUNT_MARGIN = '800px 0px';
/** The reserved height follows the measured average only when it moves by more than this (px). */
const RESERVE_STEP = 24;

type FirstBatch = {
  /** The fixtures on screen at load have mounted: the sections after the first can show. */
  settled: boolean;
  /** A fixture started loading its widget. */
  begin: () => void;
  /** That widget is mounted (or failed to load). */
  done: () => void;
  /** The height an unmounted fixture reserves: the average of the mounted ones (none measured yet: its skeleton's). */
  reserve: number | undefined;
  /** A mounted widget's height, reported on mount and whenever it changes. */
  measured: (index: number, height: number) => void;
};

const FirstBatchContext = createContext<FirstBatch>({
  settled: true,
  begin: () => {},
  done: () => {},
  reserve: undefined,
  measured: () => {},
});

/** Wraps the page's fixture sections and tracks when the first batch of widgets has mounted. */
export function LabFixtureList({ children }: { children: ReactNode }) {
  const [settled, setSettled] = useState(false);
  const [reserve, setReserve] = useState<number>();
  const pending = useRef(0);
  const heights = useRef(new Map<number, number>());
  const [batch] = useState(() => ({
    begin: () => {
      pending.current += 1;
    },
    done: () => {
      pending.current -= 1;
      if (pending.current === 0) setSettled(true);
    },
    measured: (index: number, height: number) => {
      if (height === 0) return;
      heights.current.set(index, height);
      let sum = 0;
      for (const h of heights.current.values()) sum += h;
      const mean = Math.round(sum / heights.current.size);
      setReserve((was) => (was !== undefined && Math.abs(was - mean) <= RESERVE_STEP ? was : mean));
    },
  }));
  return <FirstBatchContext value={{ settled, reserve, ...batch }}>{children}</FirstBatchContext>;
}

/** One fixture's section. After the first, it takes its space but stays unseen until the first batch has mounted. */
export function LabSection({ index, label, children }: { index: number; label: string; children: ReactNode }) {
  const { settled } = use(FirstBatchContext);
  return (
    <section className={index > 0 && !settled ? 'invisible mt-14' : 'mt-14'} aria-label={label}>
      {children}
    </section>
  );
}

const fixtureModules = new Map<string, Promise<Fixture[]>>();
const widgetModules = new Map<string, Promise<unknown>>();

function loadFixtures(id: string): Promise<Fixture[]> {
  let list = fixtureModules.get(id);
  if (!list) {
    list = (fixtures[id]?.() ?? Promise.resolve({ default: [] })).then((m) => m.default).catch(() => []);
    fixtureModules.set(id, list);
  }
  return list;
}

/** The widget's code, fetched alongside its fixtures so ToolPart finds it loaded and mounts the widget at once. */
function loadWidget(toolName: string): Promise<unknown> {
  const entry = findWidget(widgets, toolName);
  if (!entry) return Promise.resolve(null);
  let mod = widgetModules.get(entry.id);
  if (!mod) {
    mod = entry.load().catch(() => null);
    widgetModules.set(entry.id, mod);
  }
  return mod;
}

function FixtureWidget({ id, index, toolName }: { id: string; index: number; toolName: string }) {
  // Both requests start before either suspends.
  const list = loadFixtures(id);
  const widget = loadWidget(toolName);
  const part = use(list)[index]?.part;
  use(widget);
  const { done, measured } = use(FirstBatchContext);
  // ToolPart resolves the (already loaded) widget module a moment after it mounts: report once that has painted.
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(done);
    });
    return () => cancelAnimationFrame(frame);
  }, [done]);
  const measure = (el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(() => measured(index, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  };
  return part ? (
    <div ref={measure}>
      <ToolPart part={part} />
    </div>
  ) : null;
}

/**
 * The skeleton ToolPart shows while a widget's code loads (with the pack's declared header when there is one),
 * in a box as tall as the mounted fixtures have turned out to be.
 */
function Placeholder({ toolName }: { toolName: string }) {
  const { reserve } = use(FirstBatchContext);
  return (
    <div className="ac-widget" style={{ minHeight: reserve }}>
      <LoadingWidget toolName={toolName} />
    </div>
  );
}

export function LabFixture({ id, index, toolName }: { id: string; index: number; toolName: string }) {
  const [near, setNear] = useState(false);
  const { begin } = use(FirstBatchContext);
  const watch = (el: HTMLDivElement | null) => {
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        begin();
        setNear(true);
      },
      { rootMargin: MOUNT_MARGIN },
    );
    io.observe(el);
    return () => io.disconnect();
  };
  return (
    <div ref={watch}>
      {near ? (
        <Suspense fallback={<Placeholder toolName={toolName} />}>
          <FixtureWidget id={id} index={index} toolName={toolName} />
        </Suspense>
      ) : (
        <Placeholder toolName={toolName} />
      )}
    </div>
  );
}

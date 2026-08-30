'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * نوار پیشرفتِ رفتن از صفحه‌ای به صفحهٔ دیگر.
 *
 * The complaint it answers, in the words it was reported in: «می‌زنیم روی لینک،
 * انگار اقدامی انجام نمی‌شود؛ چند لحظه بعد صفحه عوض می‌شود». That gap is real
 * and unavoidable — these pages are server-rendered, so a tap starts a request
 * and the screen cannot change until it comes back. What was missing was any
 * sign that the tap registered at all, and the reflex of somebody who gets no
 * sign is to tap again.
 *
 * Why this and not a router-events listener: the App Router has none. What it
 * does do is call `history.pushState` when a navigation commits, so:
 *
 *   شروع  — the moment an internal link is clicked (capture phase, before
 *           React sees it), which is the instant the person expects something.
 *   پایان — when the URL actually changes, which is when the new page is on
 *           screen. `usePathname()` covers the ordinary case; the patched
 *           `pushState` covers the one it cannot see — a navigation that only
 *           changes the query string, like «۵ شهریور» on a venue's calendar,
 *           which is exactly the slow kind.
 *
 * The bar creeps toward 90% and never reaches it on its own: a progress bar
 * that finishes before the page does teaches people to distrust it. Only the
 * arrival completes it.
 */

/** Nothing is shown for a navigation this fast — a flash is worse than nothing. */
const SHOW_AFTER_MS = 120;

/** Never leave it running: a stuck bar is a broken-looking page. */
const GIVE_UP_MS = 15000;

export default function RouteProgress() {
  const pathname = usePathname();
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);

  const timers = useRef<{ show?: any; creep?: any; hide?: any; giveUp?: any }>({});
  const running = useRef(false);

  useEffect(() => {
    const clear = () => {
      Object.values(timers.current).forEach((t) => t && clearTimeout(t));
      if (timers.current.creep) clearInterval(timers.current.creep);
      timers.current = {};
    };

    const done = () => {
      if (!running.current) return;
      running.current = false;
      clear();
      setValue(100);
      // Long enough to be seen arriving, short enough not to be in the way.
      timers.current.hide = setTimeout(() => { setVisible(false); setValue(0); }, 220);
    };

    const start = () => {
      if (running.current) return;
      running.current = true;
      clear();
      setValue(0);

      timers.current.show = setTimeout(() => {
        setVisible(true);
        setValue(12);
        /**
         * Fast at first and slower as it goes — the shape of a wait whose
         * length nobody knows. A linear bar that reaches the end and stops is
         * a bar that has lied.
         */
        timers.current.creep = setInterval(() => {
          setValue((v) => (v >= 90 ? v : v + Math.max(0.6, (90 - v) / 14)));
        }, 180);
      }, SHOW_AFTER_MS);

      timers.current.giveUp = setTimeout(done, GIVE_UP_MS);
    };

    /**
     * A click that will navigate — and only that.
     *
     * New tabs, downloads, external hosts, `mailto:`, modifier-clicks and
     * same-page anchors all leave this page where it is, and starting a bar for
     * them would be a bar that never ends.
     */
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      let url: URL;
      try { url = new URL(anchor.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      // The same address is not a navigation; the App Router does nothing.
      if (url.pathname + url.search === window.location.pathname + window.location.search) return;

      start();
    };

    /**
     * The App Router pushes state when a navigation commits, so this is the
     * arrival — including for the query-only ones `usePathname` never sees.
     */
    const { pushState, replaceState } = window.history;
    const patch = (fn: typeof pushState) =>
      function patched(this: History, ...args: Parameters<typeof pushState>) {
        const result = fn.apply(this, args);
        // After the browser has painted the new page, not before.
        requestAnimationFrame(() => requestAnimationFrame(done));
        return result;
      };

    window.history.pushState = patch(pushState);
    window.history.replaceState = patch(replaceState);

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', start);
    // A back/forward that resolves from cache still has to end the bar.
    window.addEventListener('pageshow', done);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', start);
      window.removeEventListener('pageshow', done);
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
      clear();
    };
  }, []);

  /** The ordinary case: a new path rendered. */
  useEffect(() => {
    if (!running.current) return;
    running.current = false;
    setValue(100);
    const timer = setTimeout(() => { setVisible(false); setValue(0); }, 220);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', insetInlineStart: 0, insetInlineEnd: 0, top: 0,
        height: 3, zIndex: 2147483647, pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${value}%`,
          background: 'linear-gradient(90deg, var(--pm-green, #12805c), var(--pm-amber, #e3ad55))',
          boxShadow: '0 0 10px color-mix(in srgb, var(--pm-green, #12805c) 60%, transparent)',
          // The width eases; the completion does not have to wait for it.
          transition: value === 100 ? 'width 0.18s ease' : 'width 0.3s ease',
          borderStartEndRadius: 3,
          borderEndEndRadius: 3,
        }}
      />
    </div>
  );
}

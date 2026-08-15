'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Bell, X, Inbox, MessageSquare, CheckCircle2, Wallet, Info,
  CalendarCheck, FileText, Megaphone,
} from 'lucide-react';

import Link from 'next/link';

import { C, S, alpha } from '@/components/ui/tokens';

/**
 * The in-app notification centre: a bell, a list, and a card that slides in the
 * moment something happens.
 *
 * This exists because web push alone was never going to answer «چرا نوتیف
 * نمی‌ره». Push needs a permission the person may have declined, a service
 * worker, and a browser the OS has not frozen — and it does nothing at all for
 * somebody who has the app open, which is precisely when they expect to be
 * told. The stream below has none of those conditions: it is an HTTP response
 * that stays open, and an event reaches the screen in about a second.
 *
 * Push still runs alongside it, for the phone in a pocket. This is the channel
 * that always works.
 */

const STREAM_PATH = '/api/notifications/stream';
const LIST_PATH = '/api/notifications';
const READ_PATH = '/api/notifications/read';

interface Note {
  _id: string;
  kind:
    | 'message' | 'request_new' | 'request_accepted' | 'request_status' | 'wallet'
    | 'report' | 'letter' | 'booking';
  title: string;
  body: string;
  url: string;
  readAt: string | null;
  createdAt: string;
}

const KIND: Record<Note['kind'], { icon: React.ReactNode; color: string }> = {
  message: { icon: <MessageSquare className="h-4 w-4" />, color: 'var(--pm-status-info)' },
  request_new: { icon: <Inbox className="h-4 w-4" />, color: 'var(--pm-green)' },
  request_accepted: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'var(--pm-green)' },
  request_status: { icon: <Info className="h-4 w-4" />, color: 'var(--pm-amber)' },
  wallet: { icon: <Wallet className="h-4 w-4" />, color: 'var(--pm-status-ok)' },
  // خدمات شهر, in the catalogue's own colours.
  report: { icon: <Megaphone className="h-4 w-4" />, color: '#c2790b' },
  letter: { icon: <FileText className="h-4 w-4" />, color: '#2563eb' },
  booking: { icon: <CalendarCheck className="h-4 w-4" />, color: '#7c4dcc' },
};

function when(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'همین حالا';
  if (m < 60) return `${new Intl.NumberFormat('fa-IR').format(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${new Intl.NumberFormat('fa-IR').format(h)} ساعت پیش`;
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return '';
  }
}

export default function NotificationCenter() {
  const [items, setItems] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  /** The one that just arrived, shown as a card for a few seconds. */
  const [toast, setToast] = useState<Note | null>(null);

  const router = useRouter();
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  /**
   * Read after mounting, never during render.
   *
   * `Cookies.get()` returns nothing on the server and the token on the client,
   * so using it inline made the first client render disagree with the HTML that
   * was sent — a hydration mismatch on every screen carrying the header. State
   * plus an effect keeps both passes identical.
   */
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(Boolean(Cookies.get('auth_token'))); }, []);

  const refresh = useCallback(() => {
    fetch(LIST_PATH, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setItems(d.items || []);
        setUnread(d.unread || 0);
      })
      .catch(() => {
        // The bell is not worth an error message.
      });
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    refresh();
  }, [signedIn, refresh]);

  /* ── the live stream ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!signedIn || typeof window === 'undefined' || !('EventSource' in window)) return;

    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let attempt = 0;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      // Same origin, so the auth cookie rides along on its own — EventSource
      // cannot set an Authorization header, which is why the API accepts the
      // cookie too.
      source = new EventSource(STREAM_PATH, { withCredentials: true });

      source.addEventListener('open', () => { attempt = 0; });

      source.addEventListener('notification', (e) => {
        try {
          const note: Note = JSON.parse((e as MessageEvent).data);
          setItems((prev) => [note, ...prev].slice(0, 40));
          setUnread((n) => n + 1);

          setToast(note);
          clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 6000);
        } catch {
          // A malformed frame is not a reason to drop the stream.
        }
      });

      source.addEventListener('error', () => {
        source?.close();
        if (stopped) return;
        // Back off rather than hammer: a dropped stream is usually the network
        // coming and going on a phone.
        attempt += 1;
        retry = setTimeout(connect, Math.min(30000, 2000 * attempt));
      });
    };

    connect();

    return () => {
      stopped = true;
      clearTimeout(retry);
      clearTimeout(toastTimer.current);
      source?.close();
    };
  }, [signedIn]);

  const openList = () => {
    setOpen(true);
    setToast(null);
    if (unread > 0) {
      fetch(READ_PATH, { method: 'POST', credentials: 'include' })
        .then(() => setUnread(0))
        .catch(() => setUnread(0));
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    }
    refresh();
  };

  const go = (note: Note) => {
    setOpen(false);
    setToast(null);
    if (note.url) router.push(note.url);
  };

  if (!signedIn) return null;

  return (
    <>
      {/* ── the bell ── */}
      <button
        type="button"
        onClick={openList}
        aria-label={unread > 0 ? `اعلان‌ها، ${unread} مورد خوانده‌نشده` : 'اعلان‌ها'}
        style={{
          position: 'relative', width: 38, height: 38, borderRadius: 13, flexShrink: 0,
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)',
          color: 'var(--pm-on-hero)',
        }}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            className="tnum"
            style={{
              position: 'absolute', top: -4, insetInlineEnd: -4,
              minWidth: 18, height: 18, paddingInline: 4, borderRadius: 999,
              display: 'grid', placeItems: 'center',
              background: C.statusDanger, color: C.onAccent,
              fontSize: 10, fontWeight: 800,
            }}
          >
            {new Intl.NumberFormat('fa-IR').format(Math.min(unread, 99))}
          </span>
        )}
      </button>

      {/* ── the card that slides in on arrival ── */}
      {toast && (
        <button
          type="button"
          onClick={() => go(toast)}
          className="pm-fade-up"
          dir="rtl"
          style={{
            position: 'fixed', zIndex: 1000002, cursor: 'pointer', textAlign: 'start',
            insetInlineStart: S.s4, insetInlineEnd: S.s4,
            top: `calc(${S.s3}px + env(safe-area-inset-top))`,
            maxWidth: 520, marginInline: 'auto',
            display: 'flex', alignItems: 'flex-start', gap: S.s3,
            background: C.surface, border: `1px solid ${alpha(KIND[toast.kind]?.color || C.green, 34)}`,
            borderRadius: S.r3, boxShadow: C.shadowSheet, padding: S.s3, fontFamily: 'inherit',
          }}
        >
          <span
            style={{
              width: 38, height: 38, borderRadius: 13, flexShrink: 0, display: 'grid', placeItems: 'center',
              background: alpha(KIND[toast.kind]?.color || C.green, 12),
              color: KIND[toast.kind]?.color || C.green,
            }}
          >
            {KIND[toast.kind]?.icon || <Bell className="h-4 w-4" />}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>{toast.title}</span>
            <span style={{ display: 'block', marginTop: 3, fontSize: S.xs, color: C.muted, lineHeight: 1.75 }}>{toast.body}</span>
          </span>
          <X
            className="h-4 w-4"
            style={{ color: C.subtle, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); setToast(null); }}
          />
        </button>
      )}

      {/* ── the list ── */}
      {open && (
        <div
          dir="rtl"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000001,
            background: 'rgba(9,20,16,0.55)', backdropFilter: 'blur(2px)',
            display: 'grid', placeItems: 'start center', padding: S.s4,
            paddingTop: `calc(${S.s6}px + env(safe-area-inset-top))`,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, maxHeight: '78vh', overflowY: 'auto',
              background: C.surface, borderRadius: S.r4, boxShadow: C.shadowSheet, color: C.text,
            }}
          >
            <div
              style={{
                position: 'sticky', top: 0, zIndex: 1,
                display: 'flex', alignItems: 'center', gap: S.s3,
                padding: S.s4, borderBottom: `1px solid ${C.border}`, background: C.surface,
              }}
            >
              <Bell className="h-5 w-5" style={{ color: C.green }} />
              <p style={{ margin: 0, flex: 1, fontSize: S.md, fontWeight: 800, color: C.textStrong }}>اعلان‌ها</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن"
                style={{ background: 'transparent', border: 'none', color: C.subtle, cursor: 'pointer', padding: 4 }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <p style={{ margin: 0, padding: `${S.s7}px ${S.s4}px`, textAlign: 'center', fontSize: S.sm, color: C.muted }}>
                هنوز اعلانی ندارید.
              </p>
            ) : (
              <div>
                {items.map((n) => {
                  const meta = KIND[n.kind] || { icon: <Bell className="h-4 w-4" />, color: C.green };
                  return (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => go(n)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'flex-start', gap: S.s3,
                        padding: S.s4, textAlign: 'start', cursor: 'pointer', fontFamily: 'inherit',
                        background: n.readAt ? 'transparent' : alpha(meta.color, 6),
                        border: 'none', borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <span
                        style={{
                          width: 36, height: 36, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center',
                          background: alpha(meta.color, 12), color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>{n.title}</span>
                        <span style={{ display: 'block', marginTop: 3, fontSize: S.xs, color: C.muted, lineHeight: 1.8 }}>{n.body}</span>
                        <span style={{ display: 'block', marginTop: 5, fontSize: 10, color: C.subtle }}>{when(n.createdAt)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* The dropdown holds the newest few; the page holds all of them,
                with filters and the full text of one. */}
            <div style={{ padding: S.s3, borderTop: `1px solid ${C.border}`, background: C.surface }}>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  padding: '11px', borderRadius: S.r2,
                  background: alpha(C.green, 10), color: C.green,
                  border: `1px solid ${alpha(C.green, 22)}`,
                  fontSize: S.sm, fontWeight: 800,
                }}
              >
                مشاهدهٔ همهٔ اعلان‌ها
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

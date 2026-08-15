'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { BellRing, X } from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { API } from '@/services/const';
import { C, S, alpha } from '@/components/ui/tokens';

/**
 * Signs this device up for push, and gets out of the way.
 *
 * A collector who is not subscribed simply never hears about a new job, which
 * is the one thing this app exists to tell them — so the prompt is not buried
 * in settings. It is still not fired on page load: a permission dialog that
 * appears before the person has seen the app is the fastest way to get denied
 * permanently, and a denial cannot be re-asked from script. So the browser
 * dialog only opens after a deliberate tap on our own card.
 *
 * The card shows once. Dismissing it or granting permission both remember,
 * because re-asking every visit is what makes people block a site.
 */

const DISMISS_KEY = 'pm-push-dismissed';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** A stable id per browser, so re-subscribing updates a row instead of adding one. */
function deviceId(): string {
  let id = localStorage.getItem('pm-device-id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('pm-device-id', id);
  }
  return id;
}

async function subscribe(): Promise<boolean> {
  const key = process.env.NEXT_PUBLIC_VAPID_KEY;
  if (!key || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const registration = await navigator.serviceWorker.ready;

  // Reuse the existing subscription when there is one: asking for a second
  // with a different key throws, and the endpoint we already have is the one
  // the server stored.
  const existing = await registration.pushManager.getSubscription();
  const sub =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    }));

  const token = Cookies.get('auth_token');
  if (!token) return false;

  await axiosService({
    url: API.SAVE_SUBSCRIPTION,
    method: 'post',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      type: 'webpush',
      deviceInfo: { platform: 'web', deviceId: deviceId(), browser: navigator.userAgent.slice(0, 120) },
      data: sub.toJSON(),
    },
  });

  return true;
}

export default function PushRegister() {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Nothing to subscribe before there is an account to attach it to — this
    // also keeps the card off the login screen, which shares the root layout.
    if (!Cookies.get('auth_token')) return;

    let cancelled = false;

    (async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        return; // No worker, no push. The rest of the app is unaffected.
      }

      if (cancelled || !('PushManager' in window)) return;

      // Already granted: re-send the subscription silently. Endpoints expire and
      // the server drops them on 410, so this is what keeps a returning
      // collector reachable.
      if (Notification.permission === 'granted') {
        subscribe().catch(() => {});
        return;
      }

      if (Notification.permission === 'denied') return;
      if (localStorage.getItem(DISMISS_KEY)) return;

      setAsk(true);
    })();

    return () => { cancelled = true; };
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') await subscribe();
    } catch {
      // Ignore — the collector can still use the app, they just get no push.
    } finally {
      localStorage.setItem(DISMISS_KEY, '1');
      setBusy(false);
      setAsk(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setAsk(false);
  };

  if (!ask) return null;

  return (
    <div
      dir="rtl"
      className="pm-fade-up"
      style={{
        position: 'fixed',
        insetInlineStart: S.s4,
        insetInlineEnd: S.s4,
        bottom: `calc(104px + env(safe-area-inset-bottom))`,
        zIndex: 900,
        maxWidth: 520,
        marginInline: 'auto',
        background: C.surface,
        border: `1px solid ${alpha(C.green, 30)}`,
        borderRadius: S.r3,
        boxShadow: C.shadowLift,
        padding: S.s4,
        display: 'flex',
        alignItems: 'flex-start',
        gap: S.s3,
      }}
    >
      <span
        style={{
          width: 40, height: 40, borderRadius: 14, flexShrink: 0, display: 'grid', placeItems: 'center',
          background: alpha(C.green, 12), border: `1px solid ${alpha(C.green, 22)}`, color: C.green,
        }}
      >
        <BellRing className="h-4 w-4" />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>
          از درخواست‌های تازه باخبر شوید
        </p>
        <p style={{ margin: '5px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.85 }}>
          به‌محض ثبت درخواست در شهر شما، حتی وقتی برنامه بسته است، اعلان می‌گیرید.
        </p>
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          style={{
            marginTop: S.s3, padding: '10px 18px', borderRadius: S.r1, border: 'none',
            background: C.green, color: C.onAccent, fontFamily: 'inherit',
            fontSize: S.xs, fontWeight: 800, cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'در حال فعال‌سازی…' : 'فعال کردن اعلان'}
        </button>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="بعداً"
        style={{ background: 'transparent', border: 'none', color: C.subtle, cursor: 'pointer', padding: 4 }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

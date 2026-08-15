'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { MessagesSquare } from 'lucide-react';

import { C } from '@/components/ui/tokens';

/**
 * The way into پیام‌ها, with the count of what is waiting there.
 *
 * Next to the bell, and not the same thing as it: the bell says something
 * happened, this says somebody is waiting for an answer. A collector who
 * dismissed the notification card had no way back to the conversation.
 */
export default function MessagesBell() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  // After mounting, not during render: a cookie read inline makes the first
  // client render disagree with the server's HTML, which React reports as a
  // hydration error and recovers from by throwing the tree away.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(Boolean(Cookies.get('auth_token'))); }, []);

  useEffect(() => {
    if (!signedIn) return;
    fetch('/api/chat/unread', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUnread(d?.unread || 0))
      .catch(() => {
        // A badge is not worth an error message.
      });
  }, [signedIn, pathname]);

  if (!signedIn) return null;

  return (
    <Link
      href="/messages"
      aria-label={unread > 0 ? `پیام‌ها، ${unread} پیام خوانده‌نشده` : 'پیام‌ها'}
      style={{
        position: 'relative', width: 38, height: 38, borderRadius: 13, flexShrink: 0,
        display: 'grid', placeItems: 'center', textDecoration: 'none',
        background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)',
        color: 'var(--pm-on-hero)',
      }}
    >
      <MessagesSquare className="h-5 w-5" />
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
    </Link>
  );
}

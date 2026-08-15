'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  ArrowLeftCircle, Bell, CheckCheck, CheckCircle2, Inbox, Info, Loader2, MessageSquare,
} from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { C, S, alpha, fa } from '@/components/ui/tokens';
import { Btn, Card, EmptyState, Hero, IconBadge, Modal, Screen, Shimmer } from '@/components/ui/kit';
import { jalaliDateTime, relative } from '@/lib/when';

/**
 * اعلان‌ها — the whole inbox, not the last few.
 *
 * The bell in the header is a glance: it holds the newest handful and empties
 * its badge when you open it. That is the wrong tool for «چه چیزی برای آن
 * درخواست هفتهٔ پیش آمد؟», which needs a list you can page through and filter,
 * and an item you can open and read in full. Tapping one goes where it is
 * about — a notification that cannot be followed to its subject is just a
 * sentence.
 */

type Kind = 'message' | 'request_new' | 'request_accepted' | 'request_status';

interface Note {
  _id: string;
  kind: Kind;
  title: string;
  body: string;
  url: string;
  readAt: string | null;
  createdAt: string;
}

const KIND: Record<Kind, { label: string; icon: React.ReactNode; color: string }> = {
  message: { label: 'پیام‌ها', icon: <MessageSquare className="h-4 w-4" />, color: C.statusInfo },
  request_new: { label: 'کار تازه', icon: <Inbox className="h-4 w-4" />, color: C.green },
  request_accepted: { label: 'پذیرش کار', icon: <CheckCircle2 className="h-4 w-4" />, color: C.green },
  request_status: { label: 'وضعیت درخواست', icon: <Info className="h-4 w-4" />, color: C.amber },
};

const FALLBACK = { label: 'اعلان', icon: <Bell className="h-4 w-4" />, color: C.green };

/** What the button at the bottom of an open notification should say. */
function destination(url: string): string {
  if (!url || url === '/') return 'رفتن به صفحهٔ اصلی';
  if (url.startsWith('/messages')) return 'باز کردن گفتگو';
  if (url.startsWith('/requests')) return 'مشاهدهٔ کار';
  if (url.startsWith('/new-requests')) return 'مشاهدهٔ کارهای آزاد';
  if (url.startsWith('/history')) return 'مشاهدهٔ سوابق';
  if (url.startsWith('/profile')) return 'مشاهدهٔ پروفایل';
  return 'مشاهدهٔ جزئیات';
}

const PAGE = 20;

export default function NotificationsPage() {
  const router = useRouter();

  const [items, setItems] = useState<Note[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [kind, setKind] = useState<'all' | Kind>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Note | null>(null);

  const token = () => Cookies.get('auth_token');

  const load = useCallback((nextPage: number, replace: boolean) => {
    setBusy(true);
    axiosService({
      url: '/api/notifications',
      method: 'get',
      token: token(),
      params: { page: nextPage, pageSize: PAGE, kind, unreadOnly },
    })
      .then((res: any) => {
        const data = res?.data || {};
        setItems((current) => (replace ? data.items || [] : [...current, ...(data.items || [])]));
        setCounts(data.counts || {});
        setUnread(data.unread || 0);
        setTotal(data.total || 0);
        setPage(nextPage);
      })
      .catch(() => undefined)
      .finally(() => { setBusy(false); setLoading(false); });
  }, [kind, unreadOnly]);

  useEffect(() => { load(0, true); }, [load]);

  /** Opening one reads it — the badge should not survive having been looked at. */
  const openNote = (note: Note) => {
    setOpen(note);
    if (note.readAt) return;

    axiosService({ url: '/api/notifications/read', method: 'post', token: token(), body: { id: note._id } })
      .then((res: any) => setUnread(res?.data?.unread ?? Math.max(0, unread - 1)))
      .catch(() => undefined);

    const now = new Date().toISOString();
    setItems((current) => current.map((n) => (n._id === note._id ? { ...n, readAt: now } : n)));
    setOpen({ ...note, readAt: now });
  };

  const readAll = () => {
    setBusy(true);
    axiosService({ url: '/api/notifications/read', method: 'post', token: token(), body: {} })
      .then(() => load(0, true))
      .catch(() => setBusy(false));
  };

  const go = (note: Note) => {
    setOpen(null);
    router.push(note.url || '/');
  };

  const filters: { value: 'all' | Kind; label: string }[] = [
    { value: 'all', label: `همه (${fa(counts.all || 0)})` },
    ...(Object.keys(KIND) as Kind[])
      .filter((k) => counts[k])
      .map((k) => ({ value: k, label: `${KIND[k].label} (${fa(counts[k])})` })),
  ];

  return (
    <>
      <Screen>
        <Hero
          icon={<Bell className="h-6 w-6" />}
          title="اعلان‌ها"
          sub="هر خبری دربارهٔ کارها، درخواست‌های تازهٔ شهر و پیام‌های شهروندان."
          aside={
            <div style={{ textAlign: 'start' }}>
              <p style={{ margin: 0, fontSize: S.xs, color: C.onHeroMuted, fontWeight: 600 }}>خوانده‌نشده</p>
              <p className="tnum" style={{ margin: '6px 0 0', fontSize: S.xl, fontWeight: 800 }}>
                {loading ? '…' : fa(unread)}
              </p>
            </div>
          }
        />

        {/* filters — by subject, and by "only what I have not read" */}
        <div style={{ display: 'flex', gap: S.s2, overflowX: 'auto', paddingBottom: 4, marginBottom: S.s3 }}>
          {filters.map((f) => {
            const on = f.value === kind;
            const color = f.value === 'all' ? C.green : KIND[f.value].color;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setKind(f.value)}
                style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: S.rPill, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: S.xs, fontWeight: 800, whiteSpace: 'nowrap',
                  background: on ? color : alpha(color, 10),
                  color: on ? C.onAccent : color,
                  border: `1px solid ${on ? color : alpha(color, 24)}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: S.s2, alignItems: 'center', marginBottom: S.s3, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setUnreadOnly((v) => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: S.rPill,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: S.xs, fontWeight: 800,
              background: unreadOnly ? alpha(C.statusInfo, 14) : C.surface,
              color: unreadOnly ? C.statusInfo : C.muted,
              border: `1px solid ${unreadOnly ? alpha(C.statusInfo, 30) : C.border}`,
            }}
          >
            فقط خوانده‌نشده‌ها
          </button>

          {unread > 0 && (
            <button
              type="button"
              onClick={readAll}
              disabled={busy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: S.rPill,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: S.xs, fontWeight: 800,
                background: alpha(C.green, 10), color: C.green, border: `1px solid ${alpha(C.green, 22)}`,
                marginInlineStart: 'auto',
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              خواندن همه
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.s2 }}>
            {[0, 1, 2, 3].map((i) => <Shimmer key={i} height={78} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={unreadOnly || kind !== 'all' ? 'با این فیلتر اعلانی نیست' : 'هنوز اعلانی ندارید'}
            sub={
              unreadOnly || kind !== 'all'
                ? 'فیلتر را تغییر دهید تا بقیهٔ اعلان‌ها را ببینید.'
                : 'وقتی کار تازه‌ای در شهر ثبت شود یا شهروندی پیام بدهد، این‌جا خبردار می‌شوید.'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.s2 }}>
            {items.map((note, i) => {
              const meta = KIND[note.kind] || FALLBACK;
              const isNew = !note.readAt;

              return (
                <div key={note._id} className="pm-fade-up" style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}>
                  <Card onClick={() => openNote(note)} style={isNew ? { borderColor: alpha(meta.color, 34) } : undefined}>
                    <div style={{ padding: `${S.s3}px ${S.s4}px`, display: 'flex', alignItems: 'flex-start', gap: S.s3 }}>
                      <IconBadge color={meta.color} size={38}>{meta.icon}</IconBadge>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: S.s2 }}>
                          <p
                            style={{
                              margin: 0, flex: 1, minWidth: 0, fontSize: S.sm, color: C.textStrong,
                              fontWeight: isNew ? 800 : 700,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                          >
                            {note.title}
                          </p>
                          {isNew && (
                            <span
                              aria-label="خوانده‌نشده"
                              style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }}
                            />
                          )}
                        </div>
                        <p
                          style={{
                            margin: '4px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.8,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        >
                          {note.body}
                        </p>
                        <p style={{ margin: '5px 0 0', fontSize: 10, color: C.subtle }}>{relative(note.createdAt)}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}

            {items.length < total && (
              <Btn variant="soft" full onClick={() => load(page + 1, false)} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                اعلان‌های بیشتر
              </Btn>
            )}
          </div>
        )}
      </Screen>

      {/* ── one notification, read in full ── */}
      {open && (
        <Modal onClose={() => setOpen(null)}>
          <div style={{ padding: S.s5, display: 'flex', flexDirection: 'column', gap: S.s4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: S.s3 }}>
              <IconBadge color={(KIND[open.kind] || FALLBACK).color} size={46}>
                {(KIND[open.kind] || FALLBACK).icon}
              </IconBadge>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: S.md, fontWeight: 800, color: C.textStrong }}>{open.title}</p>
                <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted }}>
                  {(KIND[open.kind] || FALLBACK).label} — {jalaliDateTime(open.createdAt)}
                </p>
              </div>
            </div>

            <p
              style={{
                margin: 0, padding: S.s4, borderRadius: S.r2,
                background: C.surface2, border: `1px solid ${C.border}`,
                fontSize: S.sm, color: C.text, lineHeight: 2,
              }}
            >
              {open.body || 'بدون توضیح بیشتر.'}
            </p>

            <div style={{ display: 'flex', gap: S.s2 }}>
              <Btn full onClick={() => go(open)}>
                <ArrowLeftCircle className="h-4 w-4" />
                {destination(open.url)}
              </Btn>
              <Btn variant="ghost" onClick={() => setOpen(null)}>بستن</Btn>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { ClipboardList, MapPin, MessagesSquare, PhoneCall, User } from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { C, S, STATUS_THEME, alpha, fa, type RequestStatus } from '@/components/ui/tokens';
import { Card, EmptyState, Hero, IconBadge, Screen, Segmented, Shimmer } from '@/components/ui/kit';
import RequestChat from '@/components/views/Chat/request-chat';
import { relative } from '@/lib/when';

/**
 * پیام‌ها — every conversation with a citizen, in one place.
 *
 * The collector's side of the same inbox the citizen app has, and it matters
 * more here: somebody driving between pickups has several jobs open at once and
 * cannot be opening request cards one by one to find out who asked something.
 * The thread carries the job it belongs to, so «کدام آدرس بود؟» is answered on
 * the same row as the question.
 */

interface Thread {
  request: {
    _id: string;
    status: RequestStatus;
    date: string;
    address: string;
    timeSlot?: { date: string; time: string };
    totalPrice: number;
  };
  contact: { name: string; phone: string; role: 'collector' | 'citizen' } | null;
  lastMessage: { text: string; at: string; mine: boolean } | null;
  messages: number;
  unread: number;
}

type Filter = 'all' | 'unread';

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openThread, setOpenThread] = useState<string | null>(null);

  const load = useCallback(() => {
    axiosService({ url: '/api/chat/threads', method: 'get', token: Cookies.get('auth_token') })
      .then((res: any) => { setThreads(res?.data?.threads || []); setError(''); })
      .catch(() => setError('دریافت گفتگوها انجام نشد.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  /**
   * `/messages?request=<id>` opens that thread straight away — this is where a
   * message notification lands, and it should land *inside* the conversation
   * rather than next to it. Read from the address bar rather than through
   * `useSearchParams`, which would force the whole page behind a Suspense
   * boundary for one string.
   */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('request');
    if (wanted) setOpenThread(wanted);
  }, []);

  const closeChat = () => {
    setOpenThread(null);
    // The thread was just read; the badges have to catch up.
    load();
    if (window.location.search) window.history.replaceState({}, '', '/messages');
  };

  const shown = useMemo(
    () => (filter === 'unread' ? threads.filter((t) => t.unread > 0) : threads),
    [threads, filter],
  );

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <>
      <Screen>
        <Hero
          icon={<MessagesSquare className="h-6 w-6" />}
          title="پیام‌ها"
          sub="گفتگوی شما با شهروندانی که کارشان را پذیرفته‌اید."
          aside={
            <div style={{ textAlign: 'start' }}>
              <p style={{ margin: 0, fontSize: S.xs, color: C.onHeroMuted, fontWeight: 600 }}>پیام خوانده‌نشده</p>
              <p className="tnum" style={{ margin: '6px 0 0', fontSize: S.xl, fontWeight: 800 }}>
                {loading ? '…' : fa(totalUnread)}
              </p>
            </div>
          }
        />

        {threads.length > 0 && (
          <div style={{ marginBottom: S.s3 }}>
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `همه (${fa(threads.length)})` },
                { value: 'unread', label: `خوانده‌نشده (${fa(threads.filter((t) => t.unread > 0).length)})` },
              ]}
            />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.s2 }}>
            {[0, 1, 2].map((i) => <Shimmer key={i} height={96} />)}
          </div>
        ) : error ? (
          <EmptyState icon={<MessagesSquare className="h-6 w-6" />} title="گفتگوها بارگذاری نشد" sub={error} />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="h-6 w-6" />}
            title={filter === 'unread' ? 'پیام خوانده‌نشده‌ای ندارید' : 'هنوز گفتگویی ندارید'}
            sub={
              filter === 'unread'
                ? 'همهٔ پیام‌ها را خوانده‌اید.'
                : 'به‌محض اینکه کاری را بپذیرید، می‌توانید با شهروند آن گفتگو کنید.'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.s2 }}>
            {shown.map((thread, i) => {
              const status = STATUS_THEME[thread.request.status];
              const unread = thread.unread > 0;

              return (
                <div key={thread.request._id} className="pm-fade-up" style={{ animationDelay: `${Math.min(i, 6) * 35}ms` }}>
                  <Card accent={unread ? C.statusInfo : undefined}>
                    <div style={{ padding: S.s4, display: 'flex', flexDirection: 'column', gap: S.s3 }}>
                      {/* who, and what was last said */}
                      <button
                        type="button"
                        onClick={() => setOpenThread(thread.request._id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: S.s3, textAlign: 'start',
                          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <IconBadge color={unread ? C.statusInfo : C.green} size={44}>
                          <User className="h-5 w-5" />
                        </IconBadge>

                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: S.s2 }}>
                            <span style={{ flex: 1, minWidth: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>
                              {thread.contact?.name || 'شهروند'}
                            </span>
                            {thread.lastMessage && (
                              <span style={{ fontSize: 10, color: C.subtle, whiteSpace: 'nowrap' }}>
                                {relative(thread.lastMessage.at)}
                              </span>
                            )}
                          </span>

                          <span
                            style={{
                              display: 'block', marginTop: 5, fontSize: S.sm, lineHeight: 1.8,
                              color: unread ? C.textStrong : C.muted,
                              fontWeight: unread ? 700 : 500,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                          >
                            {thread.lastMessage
                              ? `${thread.lastMessage.mine ? 'شما: ' : ''}${thread.lastMessage.text}`
                              : 'هنوز پیامی رد و بدل نشده — می‌توانید اولین پیام را بفرستید.'}
                          </span>
                        </span>

                        {unread && (
                          <span
                            className="tnum"
                            aria-label={`${thread.unread} پیام خوانده‌نشده`}
                            style={{
                              minWidth: 22, height: 22, paddingInline: 6, borderRadius: 999, flexShrink: 0,
                              display: 'grid', placeItems: 'center',
                              background: C.statusDanger, color: C.onAccent, fontSize: 11, fontWeight: 800,
                            }}
                          >
                            {fa(thread.unread)}
                          </span>
                        )}
                      </button>

                      {/* which pickup this is about */}
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: S.s2, flexWrap: 'wrap',
                          padding: `${S.s2}px ${S.s3}px`, borderRadius: S.r1,
                          background: C.surface2, border: `1px solid ${C.border}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: S.rPill,
                            background: alpha(status.color, 12), color: status.color,
                            border: `1px solid ${alpha(status.color, 24)}`, whiteSpace: 'nowrap',
                          }}
                        >
                          {status.label}
                        </span>
                        <MapPin className="h-3.5 w-3.5" style={{ color: C.subtle, flexShrink: 0 }} />
                        <span
                          style={{
                            flex: 1, minWidth: 0, fontSize: S.xs, color: C.muted,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {thread.request.address || 'بدون آدرس'}
                        </span>
                      </div>

                      {/* the three things there are to do with a conversation */}
                      <div style={{ display: 'flex', gap: S.s2, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setOpenThread(thread.request._id)}
                          style={{
                            flex: '1 1 96px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '10px 8px', borderRadius: S.r1, cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: S.xs, fontWeight: 800,
                            background: alpha(C.statusInfo, 12), color: C.statusInfo,
                            border: `1px solid ${alpha(C.statusInfo, 24)}`,
                          }}
                        >
                          <MessagesSquare className="h-3.5 w-3.5" />
                          {thread.messages ? 'ادامهٔ گفتگو' : 'شروع گفتگو'}
                        </button>

                        <Link href="/requests" style={{ flex: '1 1 96px', textDecoration: 'none' }}>
                          <span
                            style={{
                              display: 'inline-flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 5,
                              padding: '10px 8px', borderRadius: S.r1, fontSize: S.xs, fontWeight: 800,
                              background: C.surface2, color: C.text, border: `1px solid ${C.border}`,
                            }}
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                            مشاهدهٔ کار
                          </span>
                        </Link>

                        {thread.contact?.phone && (
                          <a href={`tel:${thread.contact.phone}`} style={{ flex: '1 1 80px', textDecoration: 'none' }}>
                            <span
                              style={{
                                display: 'inline-flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 5,
                                padding: '10px 8px', borderRadius: S.r1, fontSize: S.xs, fontWeight: 800,
                                background: alpha(C.green, 10), color: C.green, border: `1px solid ${alpha(C.green, 22)}`,
                              }}
                            >
                              <PhoneCall className="h-3.5 w-3.5" />
                              تماس
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </Screen>

      {openThread && <RequestChat requestId={openThread} onClose={closeChat} />}
    </>
  );
}

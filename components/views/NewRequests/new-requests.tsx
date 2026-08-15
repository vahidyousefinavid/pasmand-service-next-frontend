'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Inbox, MapPin, PhoneCall, CalendarClock, Check, Loader2, RefreshCw, Navigation2, X, ShieldAlert,
} from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { toast } from '@/hooks/use-toast';
import { API } from '@/services/const';
import { C, S, alpha } from '@/components/ui/tokens';
import { Screen, Hero, Card, IconBadge, Btn, Chip, Modal, EmptyState, Shimmer, SectionTitle } from '@/components/ui/kit';
import { PasmandRequest, authHeader, faDate, mapsUrl } from '@/lib/requests';

const MapWithNoSSR = dynamic(() => import('@/components/views/Components/map'), {
  ssr: false,
  loading: () => <div style={{ height: 320, display: 'grid', placeItems: 'center', color: C.muted }}>در حال بارگذاری نقشه…</div>,
});

/**
 * The open work in this collector's city.
 *
 * A job board, not a table: the only decision on this screen is take it or
 * leave it, so each card leads with when and where and puts «انجام می‌دهم»
 * where a thumb lands. Everything that is not part of that decision — items,
 * weights, prices — belongs on the next screen, after the job is theirs.
 *
 * The list refreshes on its own because the collector is the second half of a
 * push notification: they get told a request exists, open the app, and the card
 * has to be there. It also refreshes when the tab comes back to the foreground,
 * which is what actually happens after tapping a notification.
 */

const REFRESH_MS = 45000;

export default function NewRequestsPage() {
  const [requests, setRequests] = useState<PasmandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [mapFor, setMapFor] = useState<PasmandRequest | null>(null);

  const load = useCallback((quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    axiosService({
      url: API.GET_PENDING_REQUESTS,
      method: 'post',
      body: { status: 'pending' },
      headers: authHeader(),
    })
      .then((res: any) => {
        setRequests(res?.data?.results || []);
        // The server distinguishes "no work today" from "your account cannot
        // see work yet", and so should the screen.
        setNotice(res?.data?.accessDisabled || res?.data?.noCity ? res.data.message : '');
      })
      .catch((err: any) => {
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: err?.data?.message || 'دریافت درخواست‌ها انجام نشد',
        });
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), REFRESH_MS);
    const onFocus = () => { if (!document.hidden) load(true); };
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  const accept = (id: string) => {
    setAccepting(id);
    axiosService({
      url: API.COLLECT_REQUESTS,
      method: 'put',
      body: { id },
      headers: authHeader(),
    })
      .then(() => {
        toast({ variant: 'success', title: 'پذیرفته شد', description: 'درخواست به «کارهای من» اضافه شد و به شهروند اطلاع داده شد' });
        // Drop it here rather than refetch: the card must not flicker back.
        setRequests((prev) => prev.filter((r) => r._id !== id));
      })
      .catch((err: any) => {
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: err?.data?.message || 'پذیرش انجام نشد',
        });
        // Somebody else probably took it — get the truth from the server.
        load(true);
      })
      .finally(() => setAccepting(null));
  };

  return (
    <Screen>
      <Hero
        icon={<Inbox className="h-6 w-6" />}
        title="درخواست‌های جدید"
        sub="کارهای آزاد شهر شما. هر کدام را بپذیرید به «کارهای من» می‌رود و شهروند بی‌درنگ باخبر می‌شود."
        aside={
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: S.s2,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)',
              color: C.onHero, padding: '12px 18px', borderRadius: S.rPill,
              fontSize: S.sm, fontWeight: 800, whiteSpace: 'nowrap',
            }}
          >
            <span className="tnum">{new Intl.NumberFormat('fa-IR').format(requests.length)}</span>
            کار آزاد
          </span>
        }
      />

      <SectionTitle
        title="در انتظار پذیرش"
        action={
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: S.rPill, padding: '7px 13px',
              fontFamily: 'inherit', fontSize: S.xs, fontWeight: 700, color: C.muted, cursor: 'pointer',
            }}
          >
            <RefreshCw className={refreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            بروزرسانی
          </button>
        }
      />

      {notice && (
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: S.s3, marginBottom: S.s4,
            padding: S.s4, borderRadius: S.r2,
            background: alpha(C.amber, 10), border: `1px solid ${alpha(C.amber, 28)}`,
          }}
        >
          <ShieldAlert className="h-5 w-5" style={{ color: C.amber, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: S.sm, color: C.text, lineHeight: 1.9, fontWeight: 600 }}>{notice}</p>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gap: S.s3 }}>
          <Shimmer height={210} />
          <Shimmer height={210} />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title={notice ? 'فعلاً چیزی برای نمایش نیست' : 'در حال حاضر کار آزادی نیست'}
          sub={notice ? undefined : 'به‌محض ثبت درخواست تازه در شهر شما، اینجا ظاهر می‌شود و اعلان می‌گیرید.'}
        />
      ) : (
        <div style={{ display: 'grid', gap: S.s3 }}>
          {requests.map((r, i) => (
            <Card key={r._id} accent={C.green}>
              <div className="pm-fade-up" style={{ padding: S.s4, display: 'grid', gap: S.s3, animationDelay: `${i * 40}ms` }}>
                {/* when */}
                <div style={{ display: 'flex', alignItems: 'center', gap: S.s3 }}>
                  <IconBadge color={C.green}><CalendarClock className="h-5 w-5" /></IconBadge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>
                      {r.timeSlot?.date || '—'}
                    </p>
                    <p className="tnum" style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted }}>
                      ساعت {r.timeSlot?.time || '—'} · ثبت {faDate(r.date)}
                    </p>
                  </div>
                  <Chip color={C.statusWarn}>در انتظار</Chip>
                </div>

                {/* where */}
                <div
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: S.s2,
                    background: C.bgSubtle, border: `1px solid ${C.border}`,
                    borderRadius: S.r1, padding: S.s3,
                  }}
                >
                  <MapPin className="h-4 w-4" style={{ color: C.green, flexShrink: 0, marginTop: 3 }} />
                  <p style={{ margin: 0, fontSize: S.sm, color: C.text, lineHeight: 1.9 }}>
                    {r.location?.address || 'آدرس ثبت نشده است'}
                  </p>
                </div>

                {r.description && (
                  <p style={{ margin: 0, fontSize: S.xs, color: C.muted, lineHeight: 1.9 }}>
                    یادداشت شهروند: {r.description}
                  </p>
                )}

                {/* What to do about it. Two rows rather than one wrapping row:
                    three buttons do not fit across a 390px phone, and letting
                    them wrap dropped «تماس» onto a line of its own with a gap
                    beside it. The decision gets the full width; the two
                    supporting actions split the row under it. */}
                <div style={{ display: 'grid', gap: S.s2 }}>
                  <Btn full onClick={() => accept(r._id)} disabled={accepting === r._id}>
                    {accepting === r._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    انجام می‌دهم
                  </Btn>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.s2 }}>
                    <Btn variant="soft" color={C.statusInfo} full onClick={() => setMapFor(r)}>
                      <MapPin className="h-4 w-4" />
                      نقشه
                    </Btn>

                    {/* Phone before acceptance is deliberate: a collector often
                        needs one question answered ("is it up three flights?")
                        before committing to the job. */}
                    <a href={`tel:${r.user?.phone}`} style={{ textDecoration: 'none' }}>
                      <Btn variant="soft" color={C.green} full>
                        <PhoneCall className="h-4 w-4" />
                        تماس
                      </Btn>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {mapFor && (
        <Modal onClose={() => setMapFor(null)} wide>
          <div style={{ padding: S.s4, display: 'flex', alignItems: 'center', gap: S.s3, borderBottom: `1px solid ${C.border}` }}>
            <IconBadge color={C.statusInfo}><MapPin className="h-5 w-5" /></IconBadge>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>محل جمع‌آوری</p>
              <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.8 }}>
                {mapFor.location?.address || '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapFor(null)}
              aria-label="بستن"
              style={{ background: 'transparent', border: 'none', color: C.subtle, cursor: 'pointer', padding: 6 }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div style={{ height: 330, position: 'relative' }}>
            <MapWithNoSSR
              center={mapFor.location || { lat: 35.6892, lng: 51.389 }}
              onLocationSelect={() => {}}
              selectedLocation={mapFor.location}
            />
          </div>

          <div style={{ padding: S.s4 }}>
            <a href={mapsUrl(mapFor.location)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
              <Btn full>
                <Navigation2 className="h-4 w-4" />
                مسیریابی در گوگل‌مپ
              </Btn>
            </a>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

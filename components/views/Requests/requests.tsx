'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ClipboardList, MapPin, PhoneCall, MessageSquare, CalendarClock, Scale, Plus, Trash2,
  Navigation2, X, Loader2, Wallet, Banknote, CheckCircle2, RefreshCw,
} from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { toast } from '@/hooks/use-toast';
import { API } from '@/services/const';
import { C, S, alpha } from '@/components/ui/tokens';
import {
  Screen, Hero, Card, IconBadge, Btn, Chip, Modal, EmptyState, Shimmer, Segmented, StepRail, Field,
} from '@/components/ui/kit';
import RequestChat from '@/components/views/Chat/request-chat';
import {
  PasmandRequest, Item, Status, STATUS, STAGES, stageOf, authHeader, faDate, toman, unitName, mapsUrl,
} from '@/lib/requests';

const MapWithNoSSR = dynamic(() => import('@/components/views/Components/map'), {
  ssr: false,
  loading: () => <div style={{ height: 320, display: 'grid', placeItems: 'center', color: C.muted }}>در حال بارگذاری نقشه…</div>,
});

/**
 * The jobs this collector has taken, from acceptance to settlement.
 *
 * Each card carries the whole job: the stage it is standing on, the citizen and
 * two ways to reach them, and — while it is live — the one action that moves it
 * forward. The stage rail is the same component and the same four stages the
 * citizen sees in their own history, so when the two of them are on the phone
 * they are describing the same picture.
 *
 * Settling is a separate sheet because it is a different kind of work: weighing
 * items and agreeing an amount, done standing at somebody's door, with a total
 * that has to be right.
 */

type Filter = 'collecting' | 'completed' | 'canceled';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'collecting', label: 'جاری' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'canceled', label: 'لغو شده' },
];

interface MaterialType {
  _id: string;
  title: string;
  unit: string;
  pricePerUnit: number;
  category?: string;
}

export default function RequestsPage() {
  const [filter, setFilter] = useState<Filter>('collecting');
  const [requests, setRequests] = useState<PasmandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [mapFor, setMapFor] = useState<PasmandRequest | null>(null);
  const [chatFor, setChatFor] = useState<string | null>(null);
  const [settleFor, setSettleFor] = useState<PasmandRequest | null>(null);
  /** Unread message count per request id, for the badge on the chat button. */
  const [unread, setUnread] = useState<Record<string, number>>({});

  const load = useCallback(
    (status: Filter, quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      axiosService({
        url: API.GET_REQUESTS,
        method: 'post',
        body: { status },
        headers: authHeader(),
      })
        .then((res: any) => setRequests(res?.data?.results || []))
        .catch((err: any) =>
          toast({
            variant: 'destructive',
            title: 'ناموفق',
            description: err?.data?.message || 'دریافت کارها انجام نشد',
          }),
        )
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [],
  );

  const loadUnread = useCallback(() => {
    axiosService({ url: API.CHAT_UNREAD, method: 'get', headers: authHeader() })
      .then((res: any) => setUnread(res?.data?.byRequest || {}))
      .catch(() => {
        // A badge that fails to load is not worth a toast.
      });
  }, []);

  useEffect(() => { load(filter); loadUnread(); }, [filter, load, loadUnread]);

  /**
   * A job in progress keeps changing — the citizen writes, the panel may
   * cancel. Push covers the collector who has the app closed; this covers the
   * one who is looking at the screen right now. Only the live filter polls;
   * a finished job never changes again.
   */
  useEffect(() => {
    if (filter !== 'collecting') return;

    const timer = setInterval(() => { load(filter, true); loadUnread(); }, 20000);
    const onVisible = () => { if (!document.hidden) { load(filter, true); loadUnread(); } };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [filter, load, loadUnread]);

  useEffect(() => {
    axiosService({ url: API.MY_MATERIALS, method: 'get', headers: authHeader() })
      .then((res: any) => setMaterialTypes(res?.data || []))
      .catch(() => {
        // The price list only matters inside the settle sheet, which says so
        // itself when it is empty. No toast on a screen the collector may
        // never open.
      });
  }, []);

  const done = (r: PasmandRequest) => {
    setSettleFor(null);
    toast({ variant: 'success', title: 'ثبت شد', description: 'جمع‌آوری تکمیل و به شهروند اطلاع داده شد' });
    load(filter, true);
  };

  return (
    <Screen>
      <Hero
        icon={<ClipboardList className="h-6 w-6" />}
        title="کارهای من"
        sub="درخواست‌هایی که پذیرفته‌اید. پس از توزین در محل، همین‌جا تسویه و تکمیل‌شان کنید."
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
            مورد
          </span>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: S.s3, marginBottom: S.s4 }}>
        <div style={{ flex: 1 }}>
          <Segmented value={filter} onChange={setFilter} options={FILTERS} />
        </div>
        <button
          type="button"
          onClick={() => load(filter, true)}
          aria-label="بروزرسانی"
          style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'grid', placeItems: 'center',
            background: C.surface, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer',
          }}
        >
          <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: S.s3 }}>
          <Shimmer height={280} />
          <Shimmer height={280} />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title={filter === 'collecting' ? 'کار جاری ندارید' : 'موردی در این وضعیت نیست'}
          sub={filter === 'collecting' ? 'از بخش «درخواست‌های جدید» یک کار بردارید تا اینجا بیاید.' : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gap: S.s3 }}>
          {requests.map((r, i) => (
            <RequestCard
              key={r._id}
              request={r}
              index={i}
              unread={unread[r._id] || 0}
              onMap={() => setMapFor(r)}
              onChat={() => { setChatFor(r._id); setUnread((u) => ({ ...u, [r._id]: 0 })); }}
              onSettle={() => setSettleFor(r)}
            />
          ))}
        </div>
      )}

      {mapFor && <MapSheet request={mapFor} onClose={() => setMapFor(null)} />}
      {chatFor && <RequestChat requestId={chatFor} onClose={() => { setChatFor(null); loadUnread(); }} />}
      {settleFor && (
        <SettleSheet
          request={settleFor}
          materialTypes={materialTypes}
          onClose={() => setSettleFor(null)}
          onDone={() => done(settleFor)}
        />
      )}
    </Screen>
  );
}

/* ── one job ──────────────────────────────────────────────────────────────── */

function RequestCard({
  request: r,
  index,
  unread,
  onMap,
  onChat,
  onSettle,
}: {
  request: PasmandRequest;
  index: number;
  unread: number;
  onMap: () => void;
  onChat: () => void;
  onSettle: () => void;
}) {
  const theme = STATUS[r.status] || STATUS.pending;
  const live = r.status === 'collecting';
  const citizen = `${r.user?.first_name || ''} ${r.user?.last_name || ''}`.trim() || 'شهروند';

  return (
    <Card accent={theme.color}>
      <div className="pm-fade-up" style={{ padding: S.s4, display: 'grid', gap: S.s4, animationDelay: `${index * 40}ms` }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: S.s3 }}>
          <IconBadge color={theme.color}><CalendarClock className="h-5 w-5" /></IconBadge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>
              {r.timeSlot?.date || '—'}
            </p>
            <p className="tnum" style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted }}>
              ساعت {r.timeSlot?.time || '—'} · ثبت {faDate(r.date)}
            </p>
          </div>
          <Chip color={theme.color}>{theme.label}</Chip>
        </div>

        {/* the citizen, and the two ways to reach them */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: S.s3,
            background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: S.r1, padding: S.s3,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>{citizen}</p>
            <p className="tnum" dir="ltr" style={{ margin: '3px 0 0', fontSize: S.xs, color: C.muted, textAlign: 'start' }}>
              {r.user?.phone || '—'}
            </p>
          </div>
          <a href={`tel:${r.user?.phone}`} aria-label="تماس تلفنی" style={{ textDecoration: 'none' }}>
            <span
              style={{
                width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center',
                background: alpha(C.green, 12), border: `1px solid ${alpha(C.green, 24)}`, color: C.green,
              }}
            >
              <PhoneCall className="h-4 w-4" />
            </span>
          </a>
          <button
            type="button"
            onClick={onChat}
            aria-label={unread > 0 ? `گفتگو، ${unread} پیام خوانده‌نشده` : 'گفتگو'}
            style={{
              position: 'relative',
              width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', cursor: 'pointer',
              background: alpha(C.statusInfo, 12), border: `1px solid ${alpha(C.statusInfo, 24)}`, color: C.statusInfo,
            }}
          >
            <MessageSquare className="h-4 w-4" />
            {unread > 0 && (
              <span
                className="tnum"
                style={{
                  position: 'absolute', top: -5, insetInlineEnd: -5,
                  minWidth: 19, height: 19, paddingInline: 5, borderRadius: 999,
                  display: 'grid', placeItems: 'center',
                  background: C.statusDanger, color: C.onAccent,
                  fontSize: 10, fontWeight: 800, border: `2px solid ${C.surface}`,
                }}
              >
                {new Intl.NumberFormat('fa-IR').format(unread)}
              </span>
            )}
          </button>
        </div>

        {/* address */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: S.s2 }}>
          <MapPin className="h-4 w-4" style={{ color: C.green, flexShrink: 0, marginTop: 3 }} />
          <p style={{ margin: 0, fontSize: S.sm, color: C.text, lineHeight: 1.9, flex: 1 }}>
            {r.location?.address || 'آدرس ثبت نشده است'}
          </p>
        </div>

        {/* where it stands */}
        <div style={{ padding: `${S.s3}px ${S.s3}px 0`, borderTop: `1px solid ${C.border}` }}>
          <StepRail
            steps={STAGES}
            current={stageOf(r)}
            failed={r.status === 'canceled'}
            color={theme.color}
            compact
          />
        </div>

        {/* what it came to, once it is settled */}
        {r.status === 'completed' && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: S.s3,
              padding: S.s3, borderRadius: S.r1,
              background: alpha(C.statusOk, 9), border: `1px solid ${alpha(C.statusOk, 24)}`,
            }}
          >
            <span style={{ fontSize: S.xs, fontWeight: 700, color: C.text }}>
              مبلغ پرداختی · {r.paymentMethod === 'cash' ? 'نقدی' : 'کیف پول'}
            </span>
            <span className="tnum" style={{ fontSize: S.base, fontWeight: 800, color: C.statusOk }}>
              {toman(r.totalPrice)} تومان
            </span>
          </div>
        )}

        {/* actions — same two-row shape as the job board, so the primary
            action is never squeezed next to a secondary one on a narrow phone */}
        <div style={{ display: 'grid', gap: S.s2 }}>
          {live && (
            <Btn full onClick={onSettle}>
              <Scale className="h-4 w-4" />
              توزین و تسویه
            </Btn>
          )}
          <Btn variant="soft" color={C.statusInfo} full onClick={onMap}>
            <MapPin className="h-4 w-4" />
            نقشه
          </Btn>
        </div>
      </div>
    </Card>
  );
}

/* ── the map sheet ────────────────────────────────────────────────────────── */

function MapSheet({ request, onClose }: { request: PasmandRequest; onClose: () => void }) {
  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: S.s4, display: 'flex', alignItems: 'center', gap: S.s3, borderBottom: `1px solid ${C.border}` }}>
        <IconBadge color={C.statusInfo}><MapPin className="h-5 w-5" /></IconBadge>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>محل جمع‌آوری</p>
          <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.8 }}>
            {request.location?.address || '—'}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="بستن" style={{ background: 'transparent', border: 'none', color: C.subtle, cursor: 'pointer', padding: 6 }}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div style={{ height: 330, position: 'relative' }}>
        <MapWithNoSSR
          center={request.location || { lat: 35.6892, lng: 51.389 }}
          onLocationSelect={() => {}}
          selectedLocation={request.location}
        />
      </div>

      <div style={{ padding: S.s4 }}>
        <a href={mapsUrl(request.location)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
          <Btn full>
            <Navigation2 className="h-4 w-4" />
            مسیریابی در گوگل‌مپ
          </Btn>
        </a>
      </div>
    </Modal>
  );
}

/* ── the settle sheet ─────────────────────────────────────────────────────── */

function SettleSheet({
  request,
  materialTypes,
  onClose,
  onDone,
}: {
  request: PasmandRequest;
  materialTypes: MaterialType[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [items, setItems] = useState<Item[]>(request.items || []);
  const [pick, setPick] = useState('');
  const [qty, setQty] = useState('');
  const [payment, setPayment] = useState<'wallet' | 'cash'>(request.paymentMethod || 'wallet');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = materialTypes.find((m) => m._id === pick);
  const total = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0), 0),
    [items],
  );

  const add = () => {
    setError('');
    if (!selected) return setError('نوع پسماند را انتخاب کنید');
    const q = Number(qty);
    if (!q || q <= 0) return setError('مقدار باید بیشتر از صفر باشد');
    if (items.some((it) => (it.material || it._id) === selected._id)) {
      return setError('این قلم قبلاً اضافه شده است — مقدارش را حذف و دوباره ثبت کنید');
    }

    setItems((prev) => [
      ...prev,
      {
        _id: selected._id,
        material: selected._id,
        title: selected.title,
        unit: selected.unit,
        pricePerUnit: selected.pricePerUnit,
        category: selected.category,
        quantity: q,
      },
    ]);
    setPick('');
    setQty('');
  };

  const save = () => {
    if (items.length === 0) return setError('حداقل یک قلم را وارد کنید');

    setSaving(true);
    axiosService({
      url: API.UPDATE_ITEMS_REQUESTS,
      method: 'put',
      headers: authHeader(),
      body: {
        requestId: request._id,
        paymentMethod: payment,
        // The server re-reads each material and recomputes the price from its
        // own tariff, so what goes up is only *what* and *how much*.
        items: items.map((it) => ({ _id: it.material || it._id, material: it.material || it._id, quantity: it.quantity })),
      },
    })
      .then(() => onDone())
      .catch((err: any) => {
        setError(err?.data?.message || 'ثبت تسویه انجام نشد');
        setSaving(false);
      });
  };

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: S.s4, display: 'flex', alignItems: 'center', gap: S.s3, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.surface, zIndex: 2 }}>
        <IconBadge color={C.green}><Scale className="h-5 w-5" /></IconBadge>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>توزین و تسویه</p>
          <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted }}>
            آنچه تحویل گرفتید را وارد کنید؛ مبلغ از تعرفهٔ روز شهر حساب می‌شود.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="بستن" style={{ background: 'transparent', border: 'none', color: C.subtle, cursor: 'pointer', padding: 6 }}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div style={{ padding: S.s4, display: 'grid', gap: S.s4 }}>
        {materialTypes.length === 0 ? (
          <p style={{ margin: 0, fontSize: S.sm, color: C.muted, lineHeight: 1.9 }}>
            تعرفهٔ اقلام در دسترس نیست. اتصال اینترنت را بررسی کنید و صفحه را دوباره باز کنید.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: S.s3 }}>
            <Field label="نوع پسماند">
              <select className="pm-field" value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">انتخاب کنید…</option>
                {materialTypes.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} — {toman(m.pricePerUnit)} تومان / {unitName(m.unit)}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'flex', gap: S.s2, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Field label={`مقدار${selected ? ` (${unitName(selected.unit)})` : ''}`}>
                  <input
                    className="pm-field tnum"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    dir="ltr"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>
              <Btn variant="soft" onClick={add} style={{ height: 52 }}>
                <Plus className="h-4 w-4" />
                افزودن
              </Btn>
            </div>
          </div>
        )}

        {error && (
          <p style={{ margin: 0, padding: S.s3, borderRadius: S.r1, background: alpha(C.statusDanger, 10), border: `1px solid ${alpha(C.statusDanger, 24)}`, color: C.statusDanger, fontSize: S.xs, fontWeight: 700 }}>
            {error}
          </p>
        )}

        {/* the ticket */}
        <div style={{ display: 'grid', gap: S.s2 }}>
          {items.length === 0 ? (
            <p style={{ margin: 0, padding: S.s5, textAlign: 'center', borderRadius: S.r1, background: C.bgSubtle, border: `1px dashed ${C.borderStrong}`, color: C.muted, fontSize: S.sm }}>
              هنوز قلمی ثبت نشده است
            </p>
          ) : (
            items.map((it) => (
              <div
                key={String(it.material || it._id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: S.s3,
                  padding: S.s3, borderRadius: S.r1,
                  background: C.bgSubtle, border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>{it.title}</p>
                  <p className="tnum" style={{ margin: '3px 0 0', fontSize: S.xs, color: C.muted }}>
                    {toman(it.quantity)} {unitName(it.unit)} × {toman(it.pricePerUnit)} تومان
                  </p>
                </div>
                <span className="tnum" style={{ fontSize: S.sm, fontWeight: 800, color: C.green, whiteSpace: 'nowrap' }}>
                  {toman((Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((x) => (x.material || x._id) !== (it.material || it._id)))}
                  aria-label={`حذف ${it.title}`}
                  style={{ background: 'transparent', border: 'none', color: C.statusDanger, cursor: 'pointer', padding: 6, flexShrink: 0 }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* total */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: S.s3,
            padding: S.s4, borderRadius: S.r2,
            background: `linear-gradient(135deg, ${C.heroStart}, ${C.heroEnd})`, color: C.onHero,
            boxShadow: C.shadowHero,
          }}
        >
          <span style={{ fontSize: S.sm, fontWeight: 700 }}>پرداختی به شهروند</span>
          <span className="tnum" style={{ fontSize: S.lg, fontWeight: 900 }}>{toman(total)} تومان</span>
        </div>

        {/* payment method */}
        <div>
          <p style={{ margin: `0 0 ${S.s2}px`, fontSize: S.sm, fontWeight: 700, color: C.text }}>نحوهٔ پرداخت</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.s2 }}>
            {([
              { key: 'wallet' as const, label: 'کیف پول', icon: <Wallet className="h-4 w-4" /> },
              { key: 'cash' as const, label: 'نقدی', icon: <Banknote className="h-4 w-4" /> },
            ]).map((p) => {
              const on = payment === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPayment(p.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: S.s2,
                    padding: '14px 12px', borderRadius: S.r2, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: S.sm, fontWeight: 800,
                    background: on ? alpha(C.green, 12) : C.surface,
                    color: on ? C.green : C.muted,
                    border: `1.5px solid ${on ? C.green : C.border}`,
                  }}
                >
                  {p.icon}
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <Btn full onClick={save} disabled={saving || items.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          ثبت نهایی و تکمیل
        </Btn>
      </div>
    </Modal>
  );
}

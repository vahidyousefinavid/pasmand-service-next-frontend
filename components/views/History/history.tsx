'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, Scale, Package2, Wallet, ArrowUpDown, MapPin, CalendarClock } from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { API } from '@/services/const';
import { toast } from '@/hooks/use-toast';
import { C, S, alpha } from '@/components/ui/tokens';
import { Screen, Hero, Card, IconBadge, Stat, EmptyState, Shimmer, SectionTitle, Chip } from '@/components/ui/kit';
import { PasmandRequest, authHeader, faDate, toman, unitName } from '@/lib/requests';

/**
 * What this collector has earned, and off which pickups.
 *
 * The screen used to call the *citizen* API's /api/v1/user-requests — an
 * endpoint that does not exist on the panel backend — so it failed on every
 * load and showed three zeros. It now reads the collector's own completed jobs,
 * which is the only record either side of this app can agree on.
 *
 * Weight is summed only over items measured in kilograms; adding a kilo of
 * copper to a ton of rubble produces a number that means nothing.
 */

type SortKey = 'date' | 'totalPrice';

export default function HistoryPage() {
  const [requests, setRequests] = useState<PasmandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('date');

  useEffect(() => {
    axiosService({
      url: API.GET_REQUESTS,
      method: 'post',
      body: { status: 'completed' },
      headers: authHeader(),
    })
      .then((res: any) => setRequests(res?.data?.results || []))
      .catch((err: any) =>
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: err?.data?.message || 'دریافت سوابق انجام نشد',
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    let earnings = 0;
    let kilos = 0;
    for (const r of requests) {
      earnings += Number(r.totalPrice) || 0;
      for (const it of r.items || []) {
        if (it.unit === 'kg') kilos += Number(it.quantity) || 0;
        else if (it.unit === 'ton') kilos += (Number(it.quantity) || 0) * 1000;
        else if (it.unit === 'g') kilos += (Number(it.quantity) || 0) / 1000;
      }
    }
    return { earnings, kilos: Math.round(kilos * 10) / 10, count: requests.length };
  }, [requests]);

  const sorted = useMemo(() => {
    const copy = [...requests];
    copy.sort((a, b) =>
      sortBy === 'totalPrice'
        ? (Number(b.totalPrice) || 0) - (Number(a.totalPrice) || 0)
        : new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return copy;
  }, [requests, sortBy]);

  return (
    <Screen>
      <Hero
        icon={<Wallet className="h-6 w-6" />}
        title="سوابق و درآمد"
        sub="هر جمع‌آوری تکمیل‌شده، با مبلغی که به شهروند پرداختید."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: S.s3 }}>
        <Stat label="مبلغ کل" value={toman(stats.earnings)} unit="تومان" icon={<Banknote className="h-4 w-4" />} />
        <Stat label="وزن جمع‌آوری‌شده" value={toman(stats.kilos)} unit="کیلوگرم" icon={<Scale className="h-4 w-4" />} color={C.statusInfo} />
        <Stat label="تعداد جمع‌آوری" value={toman(stats.count)} unit="مورد" icon={<Package2 className="h-4 w-4" />} color={C.violet} />
      </div>

      <SectionTitle
        title="فهرست جمع‌آوری‌ها"
        action={
          <button
            type="button"
            onClick={() => setSortBy((s) => (s === 'date' ? 'totalPrice' : 'date'))}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: S.rPill, padding: '7px 13px',
              fontFamily: 'inherit', fontSize: S.xs, fontWeight: 700, color: C.muted, cursor: 'pointer',
            }}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortBy === 'date' ? 'جدیدترین' : 'بیشترین مبلغ'}
          </button>
        }
      />

      {loading ? (
        <div style={{ display: 'grid', gap: S.s3 }}>
          <Shimmer height={150} />
          <Shimmer height={150} />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title="هنوز جمع‌آوری تکمیل‌شده‌ای ندارید"
          sub="پس از توزین و تسویهٔ اولین کار، اینجا ثبت می‌شود."
        />
      ) : (
        <div style={{ display: 'grid', gap: S.s3 }}>
          {sorted.map((r, i) => (
            <Card key={r._id} accent={C.statusOk}>
              <div className="pm-fade-up" style={{ padding: S.s4, display: 'grid', gap: S.s3, animationDelay: `${i * 35}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: S.s3 }}>
                  <IconBadge color={C.statusOk}><CalendarClock className="h-5 w-5" /></IconBadge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>
                      {r.timeSlot?.date || faDate(r.date)}
                    </p>
                    <p className="tnum" style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted }}>
                      ثبت {faDate(r.date)}
                    </p>
                  </div>
                  <Chip color={r.paymentMethod === 'cash' ? C.amber : C.statusInfo}>
                    {r.paymentMethod === 'cash' ? 'نقدی' : 'کیف پول'}
                  </Chip>
                </div>

                {r.items?.length > 0 && (
                  <div style={{ display: 'grid', gap: 6, padding: S.s3, borderRadius: S.r1, background: C.bgSubtle, border: `1px solid ${C.border}` }}>
                    {r.items.map((it, k) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: S.s3, fontSize: S.xs }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>
                          {it.title} <span className="tnum" style={{ color: C.muted }}>({toman(it.quantity)} {unitName(it.unit)})</span>
                        </span>
                        <span className="tnum" style={{ color: C.muted, whiteSpace: 'nowrap' }}>
                          {toman((Number(it.quantity) || 0) * (Number(it.pricePerUnit) || 0))} تومان
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: S.s3, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: S.xs, color: C.muted, lineHeight: 1.8, flex: '1 1 180px' }}>
                    <MapPin className="h-3.5 w-3.5" style={{ flexShrink: 0, marginTop: 3 }} />
                    {r.location?.address || '—'}
                  </p>
                  <span
                    className="tnum"
                    style={{
                      fontSize: S.md, fontWeight: 900, color: C.statusOk,
                      background: alpha(C.statusOk, 10), border: `1px solid ${alpha(C.statusOk, 22)}`,
                      borderRadius: S.rPill, padding: '8px 14px', whiteSpace: 'nowrap',
                    }}
                  >
                    {toman(r.totalPrice)} تومان
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}

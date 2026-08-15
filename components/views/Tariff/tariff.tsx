'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Banknote, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { useToast } from '@/hooks/use-toast';
import { API } from '@/services/const';
import { C, S, alpha } from '@/components/ui/tokens';
import { Screen, Hero, Card, EmptyState, Shimmer, SectionTitle } from '@/components/ui/kit';
import { authHeader, toman, unitName } from '@/lib/requests';

/**
 * The price list a collector weighs against, standing at somebody's door.
 *
 * The old screen rendered a five-column table on desktop and a second card list
 * for phones — two layouts of two-word cells. Collectors read this on a phone,
 * one row at a time, so there is one card list at every width and the number
 * they need is the largest thing on the row.
 *
 * It reads the *city's own* tariff, not every city's: the endpoint used to
 * return all of them at once, so a collector in نهاوند could be looking at
 * اصفهان's prices.
 */

interface PriceItem {
  _id: string;
  title: string;
  pricePerUnit: number;
  unit: string;
  change: number;
  category: string;
}

const CATEGORIES = ['همه', 'فلزات', 'پلاستیک', 'کاغذ', 'شیشه'];

/** One hue per material family, so a category reads the same on every row. */
const CATEGORY_COLOR: Record<string, string> = {
  فلزات: C.statusNeutral,
  پلاستیک: C.statusInfo,
  کاغذ: C.amber,
  شیشه: C.violet,
};

export default function PricesPage() {
  const [category, setCategory] = useState('همه');
  const [sortBy, setSortBy] = useState<'pricePerUnit' | 'change'>('pricePerUnit');
  const [desc, setDesc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PriceItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    axiosService({ url: API.MY_MATERIALS, method: 'get', headers: authHeader() })
      .then((res: any) => setData(Array.isArray(res?.data) ? res.data : []))
      .catch((err: any) =>
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: err?.data?.message || 'دریافت تعرفه انجام نشد',
        }),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(
    () =>
      data
        .filter((it) => category === 'همه' || it.category === category)
        .sort((a, b) => ((a[sortBy] || 0) - (b[sortBy] || 0)) * (desc ? -1 : 1)),
    [data, category, sortBy, desc],
  );

  const toggle = (key: 'pricePerUnit' | 'change') => {
    if (sortBy === key) setDesc((d) => !d);
    else {
      setSortBy(key);
      setDesc(true);
    }
  };

  return (
    <Screen>
      <Hero
        icon={<Banknote className="h-6 w-6" />}
        title="تعرفهٔ خرید"
        sub="قیمت روز شهر شما برای هر قلم. همین اعداد در «توزین و تسویه» اعمال می‌شوند."
      />

      {/* categories */}
      <div className="pm-scroll-x" style={{ display: 'flex', gap: S.s2, paddingBottom: S.s2 }}>
        {CATEGORIES.map((cat) => {
          const on = cat === category;
          const color = CATEGORY_COLOR[cat] || C.green;
          const count = cat === 'همه' ? data.length : data.filter((d) => d.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                padding: '9px 15px', borderRadius: S.rPill, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: S.xs, fontWeight: 800,
                background: on ? color : alpha(color, 10),
                color: on ? C.onAccent : color,
                border: `1px solid ${on ? color : alpha(color, 24)}`,
              }}
            >
              {cat}
              <span className="tnum" style={{ opacity: 0.75 }}>{toman(count)}</span>
            </button>
          );
        })}
      </div>

      <SectionTitle
        title="قیمت‌ها"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            <SortBtn label="قیمت" on={sortBy === 'pricePerUnit'} desc={desc} onClick={() => toggle('pricePerUnit')} />
            <SortBtn label="تغییر" on={sortBy === 'change'} desc={desc} onClick={() => toggle('change')} />
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'grid', gap: S.s2 }}>
          <Shimmer height={78} />
          <Shimmer height={78} />
          <Shimmer height={78} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Scale className="h-6 w-6" />}
          title={data.length === 0 ? 'تعرفه‌ای برای شهر شما ثبت نشده' : 'در این دسته قلمی نیست'}
          sub={data.length === 0 ? 'مدیر پسماند شهر باید قیمت‌ها را در پنل وارد کند.' : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gap: S.s2 }}>
          {rows.map((item, i) => {
            const color = CATEGORY_COLOR[item.category] || C.green;
            const change = Number(item.change) || 0;
            const Trend = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
            const trendColor = change > 0 ? C.statusOk : change < 0 ? C.statusDanger : C.subtle;

            return (
              <Card key={item._id}>
                <div className="pm-fade-up" style={{ padding: S.s3, display: 'flex', alignItems: 'center', gap: S.s3, animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  {/* The category's initial rather than a banknote on every row. */}
                  <span
                    style={{
                      width: 44, height: 44, borderRadius: 15, flexShrink: 0, display: 'grid', placeItems: 'center',
                      background: alpha(color, 12), border: `1px solid ${alpha(color, 24)}`, color,
                      fontSize: S.sm, fontWeight: 800,
                    }}
                  >
                    {(item.category || '؟').slice(0, 1)}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>{item.title}</p>
                    <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted }}>
                      {item.category} • هر {unitName(item.unit)}
                    </p>
                  </div>

                  <div style={{ textAlign: 'end', flexShrink: 0 }}>
                    <p className="tnum" style={{ margin: 0, fontSize: S.md, fontWeight: 900, color: C.green, whiteSpace: 'nowrap' }}>
                      {toman(item.pricePerUnit)}
                      <span style={{ fontSize: S.xs, fontWeight: 600, color: C.muted, marginInlineStart: 4 }}>تومان</span>
                    </p>
                    <p
                      className="tnum"
                      style={{ margin: '4px 0 0', fontSize: S.xs, fontWeight: 700, color: trendColor, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                    >
                      <Trend className="h-3 w-3" />
                      {change === 0 ? 'بدون تغییر' : `${toman(Math.abs(change))}٪`}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}

function SortBtn({ label, on, desc, onClick }: { label: string; on: boolean; desc: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontFamily: 'inherit',
        padding: '7px 12px', borderRadius: S.rPill, fontSize: S.xs, fontWeight: 700,
        background: on ? alpha(C.green, 12) : 'transparent',
        color: on ? C.green : C.muted,
        border: `1px solid ${on ? alpha(C.green, 26) : C.border}`,
      }}
    >
      {label}
      {on && (desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );
}

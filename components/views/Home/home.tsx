'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox, ClipboardList, Banknote, HelpCircle, User, Truck, ChevronLeft, Sparkles,
} from 'lucide-react';
import { Navigation } from '@/components/views/navigation';
import { TopMenu } from '@/components/views/top-menu';
import { C, S, alpha } from '@/components/ui/tokens';
import { Screen, Hero, Card, IconBadge, SectionTitle } from '@/components/ui/kit';

/**
 * The collector's home — the citizen app's home seen from the other side of the
 * same job, and built from the same kit so the two apps are recognisably one
 * product.
 *
 * The services sit on a dotted rail for the same reason they do there: what a
 * collector does here is a route, not a menu — pick up new work, carry it,
 * settle it.
 */

const services = [
  {
    href: '/new-requests',
    title: 'درخواست‌های جدید',
    description: 'کارهای آزاد شهر را ببینید و بردارید',
    icon: <Inbox className="h-5 w-5" />,
    color: C.green,
    primary: true,
  },
  {
    href: '/requests',
    title: 'کارهای من',
    description: 'درخواست‌هایی که پذیرفته‌اید و باید جمع‌آوری شوند',
    icon: <ClipboardList className="h-5 w-5" />,
    color: C.statusInfo,
  },
  {
    href: '/tariff',
    title: 'تعرفهٔ قیمت‌ها',
    description: 'قیمت روز خرید هر قلم، برای توزین در محل',
    icon: <Banknote className="h-5 w-5" />,
    color: C.amber,
  },
  {
    href: '/guide',
    title: 'راهنمای جمع‌آوری',
    description: 'از پذیرش کار تا توزین و تحویل',
    icon: <HelpCircle className="h-5 w-5" />,
    color: C.statusNeutral,
  },
  {
    href: '/profile',
    title: 'پروفایل',
    description: 'اطلاعات شما و خدماتی که پوشش می‌دهید',
    icon: <User className="h-5 w-5" />,
    color: C.violet,
  },
];

export default function HomeView() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // A PWA that cannot register its worker is still a working app.
      });
    }
  }, []);

  if (!mounted) return null;

  return (
    <>
      <TopMenu />
      <Screen>
        <Hero
          icon={<Truck className="h-6 w-6" />}
          title="برنامهٔ جمع‌آور"
          sub="کارهای آزاد شهر را بردارید، در محل توزین کنید و تحویل بگیرید."
          aside={
            <Link href="/new-requests" style={{ textDecoration: 'none' }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: S.s2,
                  background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)',
                  color: C.onHero, padding: '12px 18px', borderRadius: S.rPill,
                  fontSize: S.sm, fontWeight: 800, whiteSpace: 'nowrap',
                }}
              >
                <Inbox className="h-4 w-4" />
                درخواست‌های جدید
              </span>
            </Link>
          }
        />

        <SectionTitle
          title="خدمات"
          action={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: S.xs, color: C.muted, fontWeight: 600 }}>
              <Sparkles className="h-3.5 w-3.5" />
              مسیر یک جمع‌آوری
            </span>
          }
        />

        <div style={{ position: 'relative', paddingInlineStart: 34 }}>
          <span
            aria-hidden
            style={{
              position: 'absolute', insetInlineStart: 14, top: 26, bottom: 26, width: 2,
              backgroundImage: `linear-gradient(to bottom, ${alpha(C.green, 55)} 55%, transparent 0)`,
              backgroundSize: '2px 10px',
              backgroundRepeat: 'repeat-y',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 82%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 82%, transparent 100%)',
              animation: 'pmDashFlow 1.6s linear infinite',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: S.s3 }}>
            {services.map((s, i) => (
              <div key={s.href} className="pm-fade-up" style={{ position: 'relative', animationDelay: `${i * 45}ms` }}>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute', insetInlineStart: -26, top: 26,
                    width: 12, height: 12, borderRadius: '50%',
                    background: C.bg, border: `2.5px solid ${s.color}`,
                    boxShadow: s.primary ? `0 0 0 5px ${alpha(s.color, 14)}` : undefined,
                  }}
                />

                <Link href={s.href} style={{ textDecoration: 'none', display: 'block' }}>
                  <Card accent={s.primary ? s.color : undefined} interactive>
                    <div style={{ padding: `${S.s4}px`, display: 'flex', alignItems: 'center', gap: S.s3 }}>
                      <IconBadge color={s.color}>{s.icon}</IconBadge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>{s.title}</p>
                        <p style={{ margin: '5px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.75 }}>{s.description}</p>
                      </div>
                      <ChevronLeft className="h-4 w-4" style={{ color: C.subtle, flexShrink: 0 }} />
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/new-requests"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: S.s2,
            marginTop: S.s6, padding: '14px 20px', borderRadius: S.r2,
            background: C.green, color: C.onAccent, textDecoration: 'none',
            fontSize: S.base, fontWeight: 800, boxShadow: `0 8px 20px ${alpha(C.green, 28)}`,
          }}
        >
          <Inbox className="h-4 w-4" />
          دیدن درخواست‌های جدید
        </Link>
      </Screen>
      <Navigation />
    </>
  );
}

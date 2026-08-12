'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CircleUser, MenuIcon, LogIn, Truck, ChevronLeft, X,
  Inbox, ClipboardList, Banknote, HelpCircle, User, FileClock,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import InstallButton from './InstallButton';
import { C, S, alpha } from '@/components/ui/tokens';

/**
 * The collector's header — the citizen app's header without the city picker,
 * because a collector works in exactly one city and never chooses it.
 */
const MENU_GROUPS: { label: string; items: { title: string; sub: string; href: string; Icon: LucideIcon; color: string }[] }[] = [
  {
    label: 'کار روزانه',
    items: [
      { title: 'درخواست‌های جدید', sub: 'کارهای آزاد شهر', href: '/new-requests', Icon: Inbox, color: C.green },
      { title: 'کارهای من', sub: 'پذیرفته‌شده و در جریان', href: '/requests', Icon: ClipboardList, color: C.statusInfo },
      { title: 'سوابق', sub: 'جمع‌آوری‌های انجام‌شده', href: '/history', Icon: FileClock, color: C.amber },
    ],
  },
  {
    label: 'اطلاعات',
    items: [
      { title: 'تعرفهٔ قیمت‌ها', sub: 'قیمت روز برای توزین', href: '/tariff', Icon: Banknote, color: C.green },
      { title: 'راهنما', sub: 'از پذیرش تا تحویل', href: '/guide', Icon: HelpCircle, color: C.statusNeutral },
      { title: 'پروفایل', sub: 'اطلاعات و خدمات شما', href: '/profile', Icon: User, color: C.violet },
    ],
  },
];

export function TopMenu() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  return (
    <>
      <header
        dir="rtl"
        style={{
          position: 'fixed', insetInline: 0, top: 0, zIndex: 10000,
          background: `linear-gradient(135deg, ${C.heroStart}, ${C.heroEnd})`,
          borderEndStartRadius: 22, borderEndEndRadius: 22,
          boxShadow: C.shadowHero, color: C.onHero,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div style={{ maxWidth: 940, margin: '0 auto', padding: `${S.s3}px ${S.s4}px`, display: 'flex', alignItems: 'center', gap: S.s3 }}>
          <button
            type="button"
            aria-label="منو"
            onClick={() => setOpen(true)}
            style={{
              display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 13,
              background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)',
              color: C.onHero, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: S.sm, fontWeight: 800 }}>
            <Truck className="h-4 w-4" />
            جمع‌آور
          </span>

          <span style={{ flex: 1 }} />

          {isAuthenticated ? (
            <Link href="/profile" aria-label="پروفایل" style={{ color: C.onHero, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <CircleUser className="h-7 w-7" />
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0,
                padding: '9px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)',
                color: C.onHero, fontSize: S.xs, fontWeight: 800,
              }}
            >
              <LogIn className="h-4 w-4" />
              ورود
            </Link>
          )}
        </div>
      </header>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(9,20,16,0.5)' }}
          />
          <aside
            dir="rtl"
            style={{
              position: 'fixed', insetBlock: 0, insetInlineEnd: 0, zIndex: 100001,
              width: 'min(86vw, 360px)', background: C.bg, color: C.text,
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
              boxShadow: C.shadowSheet,
            }}
          >
            <div
              style={{
                position: 'relative', overflow: 'hidden',
                background: `linear-gradient(140deg, ${C.heroStart}, ${C.heroEnd})`,
                color: C.onHero,
                padding: `calc(${S.s6}px + env(safe-area-inset-top)) ${S.s4}px ${S.s5}px`,
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن"
                style={{
                  position: 'absolute', top: `calc(${S.s4}px + env(safe-area-inset-top))`, insetInlineStart: S.s4,
                  background: 'transparent', border: 'none', color: C.onHero, cursor: 'pointer',
                }}
              >
                <X className="h-5 w-5" />
              </button>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: S.s3 }}>
                <span
                  style={{
                    width: 46, height: 46, borderRadius: 16, display: 'grid', placeItems: 'center', flexShrink: 0,
                    background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.24)',
                  }}
                >
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: S.md, fontWeight: 800 }}>برنامهٔ جمع‌آور</p>
                  <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.onHeroMuted }}>
                    {isAuthenticated ? 'حساب شما فعال است' : 'برای دیدن کارها وارد شوید'}
                  </p>
                </div>
              </div>
            </div>

            <nav style={{ padding: `${S.s4}px ${S.s3}px`, display: 'flex', flexDirection: 'column', gap: S.s4, flex: 1 }}>
              {MENU_GROUPS.map((group) => (
                <div key={group.label}>
                  <p style={{ margin: `0 ${S.s2}px ${S.s2}px`, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', color: C.subtle }}>
                    {group.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {group.items.map(({ title, sub, href, Icon, color }) => {
                      const active = pathname === href;
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          style={{
                            display: 'flex', alignItems: 'center', gap: S.s3, textDecoration: 'none',
                            padding: `${S.s2}px`, borderRadius: S.r2,
                            background: active ? C.surface : 'transparent',
                            border: `1px solid ${active ? alpha(color, 30) : 'transparent'}`,
                            boxShadow: active ? C.shadowCard : 'none',
                          }}
                        >
                          <span
                            style={{
                              width: 38, height: 38, borderRadius: 13, flexShrink: 0,
                              display: 'grid', placeItems: 'center',
                              background: alpha(color, active ? 16 : 10),
                              border: `1px solid ${alpha(color, active ? 30 : 18)}`,
                              color,
                            }}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: S.sm, fontWeight: 800, color: active ? color : C.textStrong }}>{title}</span>
                            <span style={{ display: 'block', fontSize: 10, color: C.muted, marginTop: 3 }}>{sub}</span>
                          </span>
                          <ChevronLeft className="h-3.5 w-3.5" style={{ color: C.subtle, flexShrink: 0 }} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div style={{ padding: S.s4, borderTop: `1px dashed ${C.border}` }}>
              <InstallButton />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

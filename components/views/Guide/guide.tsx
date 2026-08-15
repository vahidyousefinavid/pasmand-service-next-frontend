'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Inbox, Check, Navigation2, Scale, Wallet, HelpCircle, ChevronDown, BellRing,
  MessageSquare, PhoneCall, ShieldAlert, Truck,
} from 'lucide-react';

import { C, S, alpha } from '@/components/ui/tokens';
import { Screen, Hero, Card, IconBadge, Btn, StepRail, SectionTitle } from '@/components/ui/kit';

/**
 * How a pickup works, from the collector's side.
 *
 * The screen this replaces was the *citizen's* guide, carried over wholesale: it
 * explained how to place a request, which is the one thing a collector never
 * does. It also carried ~350 lines of commented-out earlier drafts and an
 * orange palette from a different product.
 *
 * The five stages are the same five the app is built around, and each one names
 * the screen it happens on — a guide that does not tell you where to tap is a
 * brochure.
 */

interface Stage {
  key: string;
  title: string;
  where: string;
  icon: React.ReactNode;
  color: string;
  points: string[];
}

const STAGES: Stage[] = [
  {
    key: 'notified',
    title: 'اعلانِ کار تازه',
    where: 'اعلان گوشی',
    icon: <BellRing className="h-5 w-5" />,
    color: C.amber,
    points: [
      'به‌محض ثبت درخواست در شهر شما، اعلان می‌گیرید — حتی وقتی برنامه بسته است.',
      'اگر اعلان نمی‌گیرید، یک‌بار برنامه را باز کنید و اجازهٔ اعلان را بدهید.',
      'شما فقط درخواست‌های شهر خودتان را می‌بینید.',
    ],
  },
  {
    key: 'accept',
    title: 'پذیرش درخواست',
    where: 'درخواست‌های جدید',
    icon: <Check className="h-5 w-5" />,
    color: C.green,
    points: [
      'زمان و آدرس را ببینید و اگر مناسب بود «انجام می‌دهم» را بزنید.',
      'پیش از پذیرش هم می‌توانید با شهروند تماس بگیرید و جزئیات را بپرسید.',
      'هر کار فقط به یک نفر می‌رسد؛ اگر کسی زودتر برداشته باشد، پیام می‌گیرید.',
      'با پذیرش شما، بی‌درنگ به شهروند اطلاع داده می‌شود.',
    ],
  },
  {
    key: 'go',
    title: 'مراجعه به محل',
    where: 'کارهای من',
    icon: <Navigation2 className="h-5 w-5" />,
    color: C.statusInfo,
    points: [
      'روی کارت هر کار، «نقشه» موقعیت دقیق و دکمهٔ مسیریابی را باز می‌کند.',
      'اگر دیر می‌رسید یا آدرس مبهم است، همان‌جا پیام بدهید یا تماس بگیرید.',
    ],
  },
  {
    key: 'weigh',
    title: 'توزین و ثبت اقلام',
    where: 'کارهای من ← توزین و تسویه',
    icon: <Scale className="h-5 w-5" />,
    color: C.violet,
    points: [
      'هر قلم را با مقدارش اضافه کنید؛ مبلغ از تعرفهٔ روز شهر خودکار حساب می‌شود.',
      'جمع کل پیش از ثبت نهایی نمایش داده می‌شود — با شهروند تطبیق دهید.',
      'قیمت‌ها را می‌توانید هر لحظه در بخش «تعرفه» ببینید.',
    ],
  },
  {
    key: 'settle',
    title: 'تسویه و تکمیل',
    where: 'کارهای من ← ثبت نهایی',
    icon: <Wallet className="h-5 w-5" />,
    color: C.statusOk,
    points: [
      'نوع پرداخت را انتخاب کنید: واریز به کیف پول شهروند یا پرداخت نقدی.',
      'با ثبت نهایی، کار «تکمیل شده» می‌شود و به شهروند اطلاع می‌رسد.',
      'سابقه و مبلغ آن در بخش «سوابق و درآمد» ثبت می‌شود.',
    ],
  },
];

const FAQ = [
  {
    q: 'چرا هیچ درخواستی نمی‌بینم؟',
    a: 'سه علت رایج دارد: هنوز درخواستی در شهر شما ثبت نشده، دسترسی حساب شما توسط مدیر شهر فعال نشده، یا شهری برای حساب شما ثبت نشده است. دو مورد آخر در صفحهٔ پروفایل به شما نشان داده می‌شود.',
  },
  {
    q: 'رمز عبورم را فراموش کرده‌ام.',
    a: 'ثبت‌نام و بازیابی رمز در این برنامه انجام نمی‌شود. با مدیر پسماند شهر خود تماس بگیرید تا از پنل رمز تازه‌ای برایتان صادر کند.',
  },
  {
    q: 'کاری را پذیرفته‌ام ولی نمی‌توانم بروم.',
    a: 'با شهروند تماس بگیرید یا پیام بدهید و هماهنگ کنید. اگر کار باید به شخص دیگری برسد، از مدیر شهر بخواهید در پنل آن را آزاد کند.',
  },
  {
    q: 'قیمت‌ها را چه کسی تعیین می‌کند؟',
    a: 'تعرفه را مدیر پسماند هر شهر در پنل وارد می‌کند و همان اعداد در توزین اعمال می‌شوند. شما نمی‌توانید قیمت را دستی تغییر دهید — این تضمین می‌کند مبلغی که به شهروند می‌دهید همان چیزی است که شهر اعلام کرده.',
  },
  {
    q: 'اعلان نمی‌گیرم.',
    a: 'در تنظیمات مرورگر یا گوشی، اجازهٔ اعلان برای این سایت را بررسی کنید. اگر یک‌بار «اجازه نمی‌دهم» زده باشید، باید از تنظیمات مرورگر دستی فعالش کنید. برای اطمینان بیشتر، برنامه را روی صفحهٔ اصلی گوشی نصب کنید.',
  },
];

export default function GuidePage() {
  const [active, setActive] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const stage = STAGES[active];

  return (
    <Screen>
      <Hero
        icon={<Truck className="h-6 w-6" />}
        title="راهنمای جمع‌آوری"
        sub="مسیر یک کار، از اعلان تا تسویه — و اینکه هر مرحله در کدام صفحه انجام می‌شود."
      />

      {/* the road, as a rail you can step through */}
      <Card>
        <div style={{ padding: S.s4 }}>
          <StepRail
            steps={STAGES.map((s, i) => ({
              key: s.key,
              title: s.title,
              detail: i === active ? s.where : undefined,
            }))}
            current={active}
            color={stage.color}
            compact
          />
        </div>
      </Card>

      <div className="pm-scroll-x" style={{ display: 'flex', gap: S.s2, margin: `${S.s3}px 0` }}>
        {STAGES.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(i)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                padding: '9px 14px', borderRadius: S.rPill, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: S.xs, fontWeight: 800,
                background: on ? s.color : alpha(s.color, 10),
                color: on ? C.onAccent : s.color,
                border: `1px solid ${on ? s.color : alpha(s.color, 24)}`,
              }}
            >
              <span className="tnum">{new Intl.NumberFormat('fa-IR').format(i + 1)}</span>
              {s.title}
            </button>
          );
        })}
      </div>

      <Card accent={stage.color}>
        <div className="pm-fade-up" key={stage.key} style={{ padding: S.s4, display: 'grid', gap: S.s3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: S.s3 }}>
            <IconBadge color={stage.color}>{stage.icon}</IconBadge>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: S.md, fontWeight: 800, color: C.textStrong }}>{stage.title}</p>
              <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted }}>کجا: {stage.where}</p>
            </div>
          </div>

          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: S.s2 }}>
            {stage.points.map((p, i) => (
              <li key={i} style={{ display: 'flex', gap: S.s2, alignItems: 'flex-start' }}>
                <span
                  aria-hidden
                  style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color, flexShrink: 0, marginTop: 9 }}
                />
                <p style={{ margin: 0, fontSize: S.sm, color: C.text, lineHeight: 1.95 }}>{p}</p>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: S.s2, flexWrap: 'wrap' }}>
            {active > 0 && (
              <Btn variant="ghost" onClick={() => setActive(active - 1)}>مرحلهٔ قبل</Btn>
            )}
            {active < STAGES.length - 1 ? (
              <Btn onClick={() => setActive(active + 1)} style={{ flex: '1 1 140px' }}>مرحلهٔ بعد</Btn>
            ) : (
              <Link href="/new-requests" style={{ textDecoration: 'none', flex: '1 1 140px' }}>
                <Btn full>
                  <Inbox className="h-4 w-4" />
                  رفتن به درخواست‌ها
                </Btn>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* the two things people reach for mid-job */}
      <SectionTitle title="ارتباط با شهروند" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: S.s3 }}>
        <Card>
          <div style={{ padding: S.s4, display: 'flex', alignItems: 'center', gap: S.s3 }}>
            <IconBadge color={C.statusInfo}><MessageSquare className="h-5 w-5" /></IconBadge>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>گفتگو</p>
              <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.8 }}>
                روی هر کار، پیام‌ها همان‌جا می‌مانند.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: S.s4, display: 'flex', alignItems: 'center', gap: S.s3 }}>
            <IconBadge color={C.green}><PhoneCall className="h-5 w-5" /></IconBadge>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>تماس</p>
              <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.8 }}>
                یک ضربه، بدون جست‌وجوی شماره.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQ */}
      <SectionTitle title="پرسش‌های پرتکرار" />
      <div style={{ display: 'grid', gap: S.s2 }}>
        {FAQ.map((item, i) => {
          const open = openFaq === i;
          return (
            <Card key={i}>
              <button
                type="button"
                onClick={() => setOpenFaq(open ? null : i)}
                aria-expanded={open}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: S.s3, textAlign: 'start',
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: S.s4, fontFamily: 'inherit',
                }}
              >
                <HelpCircle className="h-4 w-4" style={{ color: C.green, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: S.sm, fontWeight: 800, color: C.textStrong }}>{item.q}</span>
                <ChevronDown
                  className="h-4 w-4"
                  style={{ color: C.subtle, flexShrink: 0, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s ease' }}
                />
              </button>
              {open && (
                <p className="pm-fade-up" style={{ margin: 0, padding: `0 ${S.s4}px ${S.s4}px`, fontSize: S.sm, color: C.muted, lineHeight: 1.95 }}>
                  {item.a}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: S.s3, marginTop: S.s5,
          padding: S.s4, borderRadius: S.r2,
          background: alpha(C.amber, 9), border: `1px solid ${alpha(C.amber, 24)}`,
        }}
      >
        <ShieldAlert className="h-5 w-5" style={{ color: C.amber, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: S.xs, color: C.text, lineHeight: 1.95 }}>
          شمارهٔ همراه و آدرس شهروندان اطلاعات شخصی است. فقط برای همان جمع‌آوری از آن استفاده کنید.
        </p>
      </div>
    </Screen>
  );
}

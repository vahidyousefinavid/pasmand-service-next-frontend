'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Phone, Lock, ArrowLeft, Loader2, Eye, EyeOff, Truck, ShieldCheck, Headphones } from 'lucide-react';

import { API } from '@/services/const';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { C, S, alpha } from '@/components/ui/tokens';
import { Btn, Field } from '@/components/ui/kit';
import EcoGlobe from '@/components/ui/EcoGlobe';

/**
 * The collector's way in.
 *
 * Same emblem, same green, same IRANSans as the citizen app's login — the two
 * apps are two doors into one system and should look like it. What differs is
 * the wording: a collector signs in with credentials a city gave them, so the
 * screen says who issues the account and what to do when it is missing, rather
 * than offering a sign-up that does not exist on this side.
 *
 * The old screen offered a کاربر/مدیر tab pair that posted to the same endpoint
 * either way — a choice with no consequence. It is gone.
 */

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const phoneOk = /^09\d{9}$/.test(phone);
  const canSubmit = phoneOk && password.length >= 4 && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    axios
      .post(API.SIGN_UP, { phone, password })
      .then((res: any) => {
        const token = res.data?.token;
        Cookies.set('auth_token', token, { expires: 30 });
        login({ id: res.data?.user?._id || '', phone, token });
        toast({ variant: 'success', title: 'خوش آمدید', description: 'وارد برنامهٔ جمع‌آور شدید' });
        // A full navigation, not router.push: the middleware reads the cookie
        // on the server, and a client-side transition would run before it.
        window.location.href = '/';
      })
      .catch((err) => {
        setLoading(false);
        const message =
          err?.response?.data?.message ||
          (err?.response?.status === 404
            ? 'حسابی با این شمارهٔ همراه ثبت نشده است'
            : 'ورود انجام نشد. دوباره تلاش کنید');
        setError(message);
        setPassword('');
      });
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── the emblem, on the green ─────────────────────────────────────── */}
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(150deg, ${C.heroStart}, ${C.heroEnd})`,
          color: C.onHero,
          padding: `calc(${S.s7}px + env(safe-area-inset-top)) ${S.s4}px ${S.s7 + 22}px`,
          borderEndStartRadius: 34,
          borderEndEndRadius: 34,
          boxShadow: C.shadowHero,
          textAlign: 'center',
        }}
      >
        <span aria-hidden style={{ position: 'absolute', insetInlineStart: -70, top: -90, width: 230, height: 230, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <span aria-hidden style={{ position: 'absolute', insetInlineEnd: -50, bottom: -100, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', display: 'grid', justifyItems: 'center', gap: S.s3 }}>
          <EcoGlobe size={182} />

          <div>
            <h1 style={{ margin: 0, fontSize: S.xxl, fontWeight: 900, letterSpacing: '-0.02em' }}>شهر شهر</h1>
            <p style={{ margin: `${S.s2}px 0 0`, fontSize: S.sm, color: C.onHeroMuted, lineHeight: 1.9 }}>
              برنامهٔ خدمات‌دهندگان — سامانهٔ خدمات شهری
            </p>
          </div>

          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.26)',
              padding: '8px 15px', borderRadius: S.rPill, fontSize: S.xs, fontWeight: 700,
            }}
          >
            <Truck className="h-3.5 w-3.5" />
            ویژهٔ جمع‌آوران و رانندگان
          </span>
        </div>
      </header>

      {/* ── the form ─────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 460,
          margin: '0 auto',
          padding: `0 ${S.s4}px calc(${S.s6}px + env(safe-area-inset-bottom))`,
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="pm-fade-up"
          style={{
            marginTop: -30,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: S.r4,
            boxShadow: C.shadowLift,
            padding: S.s5,
            display: 'grid',
            gap: S.s4,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: S.lg, fontWeight: 800, color: C.textStrong }}>ورود به حساب</h2>
            <p style={{ margin: `${S.s2}px 0 0`, fontSize: S.xs, color: C.muted, lineHeight: 1.9 }}>
              با شمارهٔ همراه و رمزی که شهرداری شهر شما صادر کرده وارد شوید.
            </p>
          </div>

          <Field label="شمارهٔ همراه" icon={<Phone className="h-4 w-4" style={{ color: C.green }} />}>
            <input
              className="pm-field tnum"
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              value={phone}
              maxLength={11}
              disabled={loading}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                setError('');
              }}
            />
          </Field>

          <Field label="رمز عبور" icon={<Lock className="h-4 w-4" style={{ color: C.green }} />}>
            <div style={{ position: 'relative' }}>
              <input
                className="pm-field"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                dir="ltr"
                placeholder="••••••"
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                style={{ paddingInlineEnd: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                style={{
                  position: 'absolute', insetInlineEnd: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: C.subtle, padding: 8, display: 'grid', placeItems: 'center',
                }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {error && (
            <p
              role="alert"
              style={{
                margin: 0, padding: `${S.s3}px ${S.s4}px`, borderRadius: S.r1,
                background: alpha(C.statusDanger, 10), border: `1px solid ${alpha(C.statusDanger, 26)}`,
                color: C.statusDanger, fontSize: S.xs, fontWeight: 700, lineHeight: 1.8,
              }}
            >
              {error}
            </p>
          )}

          <Btn type="submit" full disabled={!canSubmit}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowLeft className="h-4 w-4" />ورود</>}
          </Btn>

          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: S.s2,
              padding: `${S.s3}px ${S.s3}px`, borderRadius: S.r1,
              background: C.bgSubtle, border: `1px solid ${C.border}`,
            }}
          >
            <Headphones className="h-4 w-4" style={{ color: C.muted, flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: S.xs, color: C.muted, lineHeight: 1.9 }}>
              حساب ندارید یا رمزتان را فراموش کرده‌اید؟ ثبت‌نام در این برنامه انجام نمی‌شود — با مدیر
              پسماند شهر خود تماس بگیرید تا حساب شما را بسازد یا رمز تازه‌ای صادر کند.
            </p>
          </div>
        </form>

        <p
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            margin: `${S.s5}px 0 0`, fontSize: S.xs, color: C.subtle,
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          ورود شما رمزنگاری‌شده است
        </p>
      </main>
    </div>
  );
}

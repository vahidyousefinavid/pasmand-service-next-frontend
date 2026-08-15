'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
  User, Phone, Mail, Pencil, LogOut, ClipboardList, Wallet, Building2, BadgeCheck,
  ShieldAlert, Loader2, Truck, Check, X,
} from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { API } from '@/services/const';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { C, S, alpha } from '@/components/ui/tokens';
import { Screen, Hero, Card, IconBadge, Btn, Chip, Field, Shimmer, SectionTitle } from '@/components/ui/kit';
import { authHeader } from '@/lib/requests';

/**
 * Who this collector is, as the city recorded them.
 *
 * Two halves, and the split matters: the name and contact details are theirs to
 * correct, while the city, the services they cover and whether their access is
 * switched on are the city's decisions. The second half is shown but not
 * editable — a collector who could grant themselves access would make the
 * panel's access switch meaningless.
 *
 * The old screen also offered "آدرس‌های من", carried over from the citizen app.
 * A collector has no saved addresses; the ones that matter belong to the jobs.
 */

interface ServiceField { _id: string; title?: string }
interface City { _id?: string; name?: string }

interface Profile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  description?: string;
  accessible?: boolean;
  city?: City | string | null;
  serviceFields?: ServiceField[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { logout } = useAuth();
  const { toast } = useToast();

  const load = () => {
    axiosService({ url: API.GET_PROFILE, method: 'get', token: Cookies.get('auth_token') })
      .then((res: any) => {
        setProfile(res?.data?.user || null);
        setDraft(res?.data?.user || {});
      })
      .catch(() =>
        toast({ variant: 'destructive', title: 'ناموفق', description: 'دریافت اطلاعات انجام نشد' }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    setSaving(true);
    axiosService({
      url: API.UPDATE_PROFILE,
      method: 'put',
      headers: authHeader(),
      body: {
        first_name: draft.first_name,
        last_name: draft.last_name,
        email: draft.email,
        description: draft.description,
      },
    })
      .then((res: any) => {
        setProfile(res?.data?.user || draft);
        setEditing(false);
        toast({ variant: 'success', title: 'ثبت شد', description: 'اطلاعات شما بروزرسانی شد' });
      })
      .catch((err: any) =>
        toast({ variant: 'destructive', title: 'ناموفق', description: err?.data?.message || 'ذخیره انجام نشد' }),
      )
      .finally(() => setSaving(false));
  };

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'جمع‌آور';
  const cityName = typeof profile?.city === 'object' && profile?.city ? profile.city.name : undefined;
  const active = profile?.accessible !== false;

  return (
    <Screen>
      <Hero
        icon={<Truck className="h-6 w-6" />}
        title={fullName}
        sub={cityName ? `جمع‌آور شهر ${cityName}` : 'جمع‌آور سامانهٔ شهر شهر'}
        aside={
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)',
              color: C.onHero, padding: '10px 16px', borderRadius: S.rPill,
              fontSize: S.xs, fontWeight: 800, whiteSpace: 'nowrap',
            }}
          >
            {active ? <BadgeCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {active ? 'دسترسی فعال' : 'دسترسی غیرفعال'}
          </span>
        }
      />

      {loading ? (
        <div style={{ display: 'grid', gap: S.s3 }}>
          <Shimmer height={220} />
          <Shimmer height={140} />
        </div>
      ) : (
        <>
          <SectionTitle
            title="اطلاعات شخصی"
            action={
              !editing && (
                <button
                  type="button"
                  onClick={() => { setDraft(profile || {}); setEditing(true); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent',
                    border: `1px solid ${C.border}`, borderRadius: S.rPill, padding: '7px 13px',
                    fontFamily: 'inherit', fontSize: S.xs, fontWeight: 700, color: C.green, cursor: 'pointer',
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  ویرایش
                </button>
              )
            }
          />

          <Card>
            <div style={{ padding: S.s4, display: 'grid', gap: S.s3 }}>
              {editing ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: S.s3 }}>
                    <Field label="نام">
                      <input className="pm-field" value={draft.first_name || ''} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} />
                    </Field>
                    <Field label="نام خانوادگی">
                      <input className="pm-field" value={draft.last_name || ''} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="ایمیل" hint="اختیاری">
                    <input className="pm-field" dir="ltr" value={draft.email || ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                  </Field>

                  <Field label="توضیحات" hint="مثلاً نوع خودرو یا محدودهٔ کاری شما">
                    <textarea className="pm-field" rows={3} value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                  </Field>

                  <p style={{ margin: 0, fontSize: S.xs, color: C.muted, lineHeight: 1.9 }}>
                    شمارهٔ همراه کلید ورود شماست و از این‌جا تغییر نمی‌کند. برای تغییر آن یا برای رمز
                    تازه، با مدیر شهر خود تماس بگیرید.
                  </p>

                  <div style={{ display: 'flex', gap: S.s2 }}>
                    <Btn onClick={save} disabled={saving} style={{ flex: 1 }}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      ذخیره
                    </Btn>
                    <Btn variant="ghost" onClick={() => { setEditing(false); setDraft(profile || {}); }}>
                      <X className="h-4 w-4" />
                      انصراف
                    </Btn>
                  </div>
                </>
              ) : (
                <>
                  <Row icon={<User className="h-4 w-4" />} label="نام و نام خانوادگی" value={fullName} />
                  <Row icon={<Phone className="h-4 w-4" />} label="شمارهٔ همراه" value={profile?.phone || '—'} ltr />
                  <Row icon={<Mail className="h-4 w-4" />} label="ایمیل" value={profile?.email || '—'} ltr />
                  {profile?.description && (
                    <Row icon={<ClipboardList className="h-4 w-4" />} label="توضیحات" value={profile.description} />
                  )}
                </>
              )}
            </div>
          </Card>

          {/* what the city decided */}
          <SectionTitle title="اطلاعات خدماتی" />
          <Card>
            <div style={{ padding: S.s4, display: 'grid', gap: S.s3 }}>
              <Row icon={<Building2 className="h-4 w-4" />} label="شهر" value={cityName || 'ثبت نشده'} />

              <div>
                <p style={{ margin: `0 0 ${S.s2}px`, fontSize: S.xs, color: C.muted, fontWeight: 600 }}>خدمات تحت پوشش</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(profile?.serviceFields || []).length === 0 ? (
                    <span style={{ fontSize: S.sm, color: C.subtle }}>موردی ثبت نشده است</span>
                  ) : (
                    (profile?.serviceFields || []).map((f) => (
                      <Chip key={f._id} color={C.green}>{f.title || '—'}</Chip>
                    ))
                  )}
                </div>
              </div>

              {!active && (
                <p
                  style={{
                    margin: 0, padding: S.s3, borderRadius: S.r1, fontSize: S.xs, lineHeight: 1.9, fontWeight: 600,
                    background: alpha(C.amber, 10), border: `1px solid ${alpha(C.amber, 26)}`, color: C.text,
                  }}
                >
                  تا وقتی مدیر شهر دسترسی شما را فعال نکند، درخواستی برایتان نمایش داده نمی‌شود.
                </p>
              )}
            </div>
          </Card>

          {/* shortcuts */}
          <SectionTitle title="دسترسی سریع" />
          <div style={{ display: 'grid', gap: S.s3 }}>
            <Shortcut href="/requests" icon={<ClipboardList className="h-5 w-5" />} color={C.statusInfo} title="کارهای من" sub="درخواست‌هایی که پذیرفته‌اید" />
            <Shortcut href="/history" icon={<Wallet className="h-5 w-5" />} color={C.amber} title="سوابق و درآمد" sub="جمع‌آوری‌های تکمیل‌شده و مبالغ" />
          </div>

          <div style={{ marginTop: S.s6 }}>
            <Btn full variant="soft" color={C.statusDanger} onClick={logout}>
              <LogOut className="h-4 w-4" />
              خروج از حساب
            </Btn>
          </div>
        </>
      )}
    </Screen>
  );
}

function Row({ icon, label, value, ltr }: { icon: React.ReactNode; label: string; value: string; ltr?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: S.s3 }}>
      <IconBadge color={C.green} size={38}>{icon}</IconBadge>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: S.xs, color: C.muted, fontWeight: 600 }}>{label}</p>
        <p
          className={ltr ? 'tnum' : undefined}
          dir={ltr ? 'ltr' : undefined}
          style={{ margin: '3px 0 0', fontSize: S.sm, fontWeight: 700, color: C.textStrong, textAlign: 'start', wordBreak: 'break-word' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Shortcut({ href, icon, color, title, sub }: { href: string; icon: React.ReactNode; color: string; title: string; sub: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <Card interactive>
        <div style={{ padding: S.s4, display: 'flex', alignItems: 'center', gap: S.s3 }}>
          <IconBadge color={color}>{icon}</IconBadge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: S.base, fontWeight: 800, color: C.textStrong }}>{title}</p>
            <p style={{ margin: '4px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.75 }}>{sub}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

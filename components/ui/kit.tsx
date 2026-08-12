'use client';

/**
 * The small set of primitives the redesigned screens are built from.
 *
 * Everything here styles itself from `tokens.ts`, not from Tailwind classes, so
 * these components can sit next to the untouched shadcn screens without either
 * side leaking into the other.
 */

import { ReactNode, CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { C, S, alpha } from './tokens';

/* ── page chrome ─────────────────────────────────────────────────────────── */

export function Screen({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        // Room for the fixed top bar (62px of content) and the floating tab
        // bar, plus a gap on each side.
        padding: `calc(78px + env(safe-area-inset-top)) 0 calc(104px + env(safe-area-inset-bottom))`,
        ...style,
      }}
    >
      <div style={{ width: '100%', maxWidth: 940, margin: '0 auto', padding: `0 ${S.s4}px` }}>
        {children}
      </div>
    </div>
  );
}

/**
 * The green slab at the top of a screen. It carries the title so the page has a
 * single obvious subject, and an optional read-out on the opposite side.
 */
export function Hero({
  title,
  sub,
  icon,
  aside,
}: {
  title: string;
  sub?: string;
  icon?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      className="pm-fade-up"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${C.heroStart}, ${C.heroEnd})`,
        borderRadius: S.r4,
        padding: `${S.s5}px ${S.s5}px`,
        boxShadow: C.shadowHero,
        color: C.onHero,
        marginBottom: S.s5,
      }}
    >
      {/* Two soft discs, well outside the text column — depth without noise. */}
      <span aria-hidden style={{ position: 'absolute', insetInlineStart: -60, top: -70, width: 190, height: 190, borderRadius: '50%', background: 'rgba(255,255,255,0.09)' }} />
      <span aria-hidden style={{ position: 'absolute', insetInlineEnd: -40, bottom: -80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: S.s4, flexWrap: 'wrap' }}>
        {icon && (
          <span
            style={{
              width: 52, height: 52, borderRadius: 18, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            {icon}
          </span>
        )}
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: S.xl, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h1>
          {sub && (
            <p style={{ margin: `${S.s2}px 0 0`, fontSize: S.sm, lineHeight: 1.8, color: C.onHeroMuted, maxWidth: '46ch' }}>
              {sub}
            </p>
          )}
        </div>
        {aside}
      </div>
    </section>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: S.s3, margin: `${S.s6}px 0 ${S.s3}px` }}>
      <h2 style={{ margin: 0, fontSize: S.md, fontWeight: 800, color: C.textStrong }}>{title}</h2>
      {action}
    </div>
  );
}

/* ── surfaces ────────────────────────────────────────────────────────────── */

export function Card({
  children,
  accent,
  onClick,
  style,
  interactive,
}: {
  children: ReactNode;
  /** Draws a 3px hairline across the top in this colour. */
  accent?: string;
  onClick?: () => void;
  style?: CSSProperties;
  interactive?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'start',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: S.r3,
        boxShadow: C.shadowCard,
        overflow: 'hidden',
        cursor: onClick || interactive ? 'pointer' : undefined,
        transition: 'box-shadow .22s ease, transform .22s ease, border-color .22s ease',
        font: 'inherit',
        color: 'inherit',
        ...style,
      }}
    >
      {accent && <span style={{ display: 'block', height: 3, background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 20)})` }} />}
      {children}
    </Tag>
  );
}

export function IconBadge({ color, size = 44, children }: { color: string; size?: number; children: ReactNode }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: size / 3, flexShrink: 0,
        display: 'grid', placeItems: 'center',
        background: alpha(color, 12),
        border: `1px solid ${alpha(color, 22)}`,
        color,
      }}
    >
      {children}
    </span>
  );
}

export function Chip({
  children,
  color = C.statusNeutral,
  active,
  onClick,
}: {
  children: ReactNode;
  color?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        fontSize: S.xs, fontWeight: 700, lineHeight: 1,
        padding: '8px 13px', borderRadius: S.rPill,
        background: active ? color : alpha(color, 10),
        color: active ? C.onAccent : color,
        border: `1px solid ${active ? color : alpha(color, 24)}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background .18s ease, color .18s ease',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

/* ── controls ────────────────────────────────────────────────────────────── */

export function Btn({
  children,
  onClick,
  variant = 'primary',
  color = C.green,
  disabled,
  full,
  type = 'button',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'soft' | 'ghost';
  color?: string;
  disabled?: boolean;
  full?: boolean;
  type?: 'button' | 'submit';
  style?: CSSProperties;
}) {
  const palette =
    variant === 'primary'
      ? { background: color, color: C.onAccent, border: `1px solid ${color}` }
      : variant === 'soft'
        ? { background: alpha(color, 12), color, border: `1px solid ${alpha(color, 24)}` }
        : { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: S.s2,
        width: full ? '100%' : undefined,
        padding: '13px 20px', borderRadius: S.r2,
        fontSize: S.base, fontWeight: 800, fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'filter .18s ease, opacity .18s ease',
        boxShadow: variant === 'primary' && !disabled ? `0 8px 20px ${alpha(color, 28)}` : undefined,
        ...palette,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── read-outs ───────────────────────────────────────────────────────────── */

export function Stat({ label, value, unit, icon, color = C.green }: { label: string; value: ReactNode; unit?: string; icon?: ReactNode; color?: string }) {
  return (
    <Card>
      <div style={{ padding: `${S.s4}px`, display: 'flex', alignItems: 'center', gap: S.s3 }}>
        {icon && <IconBadge color={color} size={40}>{icon}</IconBadge>}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: S.xs, color: C.muted, fontWeight: 600 }}>{label}</p>
          <p className="tnum" style={{ margin: '4px 0 0', fontSize: S.lg, fontWeight: 800, color: C.textStrong, whiteSpace: 'nowrap' }}>
            {value}
            {unit && <span style={{ fontSize: S.xs, fontWeight: 600, color: C.muted, marginInlineStart: 4 }}>{unit}</span>}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * A ring that reads as a share of something. Pure SVG — no chart library on a
 * PWA that has to load over a phone connection.
 */
export function ProgressRing({ value, size = 74, label, color = C.green }: { value: number; size?: number; label?: string; color?: string }) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={alpha(color, 14)} strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="tnum" style={{ fontSize: S.base, fontWeight: 800, color: C.textStrong, lineHeight: 1 }}>
            {Math.round(pct)}٪
          </div>
          {label && <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── the step rail ───────────────────────────────────────────────────────── */

export type Step = {
  key: string;
  title: string;
  /** Shown under the title once the step is reached. */
  detail?: string;
};

/**
 * The step-by-step read-out, the same idea as karnama's scan console: a fixed
 * list of stages where what has happened, what is happening and what has not
 * started yet are three visibly different things.
 *
 * Used for both request tracking (the stages a request passes through) and the
 * new-request wizard (the stages the citizen passes through), because they are
 * the same object seen from two sides.
 */
export function StepRail({
  steps,
  current,
  failed,
  color = C.green,
  compact,
}: {
  steps: Step[];
  /** Index of the active step. Everything before it counts as done. */
  current: number;
  /** Render the current step as a failure instead of in-progress. */
  failed?: boolean;
  color?: string;
  compact?: boolean;
}) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative' }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const stateColor = failed && active ? C.statusDanger : done || active ? color : C.subtle;
        const last = i === steps.length - 1;

        return (
          <li key={s.key} style={{ display: 'flex', gap: S.s3, alignItems: 'flex-start', position: 'relative' }}>
            {/* node + the dotted thread down to the next node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span
                style={{
                  width: compact ? 20 : 26, height: compact ? 20 : 26, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  background: done ? stateColor : active ? alpha(stateColor, 16) : 'transparent',
                  border: `2px solid ${done || active ? stateColor : C.border}`,
                  color: done ? C.onAccent : stateColor,
                  transition: 'background .25s ease, border-color .25s ease',
                }}
              >
                {done ? (
                  <Check size={compact ? 11 : 14} strokeWidth={3} />
                ) : (
                  <span
                    style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'currentColor',
                      animation: active && !failed ? 'pmPulseDot 1.5s ease-in-out infinite' : undefined,
                      opacity: active ? 1 : 0.5,
                    }}
                  />
                )}
              </span>

              {!last && (
                <span
                  style={{
                    width: 2, flex: 1, minHeight: compact ? 22 : 30, marginBlock: 3,
                    // A dotted thread rather than a solid rule: the gap between
                    // two stages is a wait, and a dashed line reads as one.
                    backgroundImage: `linear-gradient(to bottom, ${done ? stateColor : C.borderStrong} 55%, transparent 0)`,
                    backgroundSize: '2px 9px',
                    backgroundRepeat: 'repeat-y',
                    opacity: done ? 1 : 0.75,
                  }}
                />
              )}
            </div>

            <div style={{ paddingBottom: last ? 0 : compact ? S.s3 : S.s4, minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: compact ? S.xs : S.sm,
                  fontWeight: active ? 800 : 700,
                  color: done ? C.text : active ? (failed ? C.statusDanger : C.textStrong) : C.subtle,
                  transition: 'color .25s ease',
                }}
              >
                {s.title}
              </p>
              {s.detail && (done || active) && (
                <p style={{ margin: '3px 0 0', fontSize: S.xs, color: C.muted, lineHeight: 1.7 }}>{s.detail}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── overlays ────────────────────────────────────────────────────────────── */

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div
      dir="rtl"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000000,
        background: 'rgba(9, 20, 16, 0.55)', backdropFilter: 'blur(2px)',
        display: 'grid', placeItems: 'center', padding: S.s4,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: wide ? 620 : 420, maxHeight: '88vh', overflowY: 'auto',
          background: C.surface, borderRadius: S.r4, boxShadow: C.shadowSheet, color: C.text,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── form pieces ─────────────────────────────────────────────────────────── */

/**
 * Label + control. The input styling lives in one CSS class (`.pm-field`) so
 * native inputs, the Jalali date picker and the address search all look alike.
 */
export function Field({
  label,
  hint,
  children,
  icon,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: S.sm, fontWeight: 700, color: C.text, marginBottom: S.s2 }}>
        {icon}
        {label}
      </span>
      {children}
      {hint && <span style={{ display: 'block', marginTop: 6, fontSize: S.xs, color: C.muted, lineHeight: 1.7 }}>{hint}</span>}
    </label>
  );
}

/** Two or more mutually exclusive views. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4,
        background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: S.r2, padding: 4,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '10px 8px', borderRadius: S.r1, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: S.sm, fontWeight: 800,
              background: on ? C.surface : 'transparent',
              color: on ? C.green : C.muted,
              boxShadow: on ? C.shadowCard : 'none',
              transition: 'background .18s ease, color .18s ease',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A loading placeholder with the same sweep the history list uses. */
export function Shimmer({ height = 96, radius = S.r3 }: { height?: number; radius?: number }) {
  return (
    <div
      style={{
        height, borderRadius: radius, position: 'relative', overflow: 'hidden',
        background: C.surface, border: `1px solid ${C.border}`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute', inset: 0, width: '40%',
          background: `linear-gradient(90deg, transparent, ${C.bgSubtle}, transparent)`,
          animation: 'pmSweep 1.4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

/* ── empty ───────────────────────────────────────────────────────────────── */

export function EmptyState({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <Card>
      <div style={{ padding: `${S.s7}px ${S.s5}px`, display: 'grid', justifyItems: 'center', gap: S.s3, textAlign: 'center' }}>
        <IconBadge color={C.green} size={56}>{icon}</IconBadge>
        <p style={{ margin: 0, fontSize: S.md, fontWeight: 800, color: C.textStrong }}>{title}</p>
        {sub && <p style={{ margin: 0, fontSize: S.sm, color: C.muted, lineHeight: 1.8, maxWidth: '40ch' }}>{sub}</p>}
        {action}
      </div>
    </Card>
  );
}

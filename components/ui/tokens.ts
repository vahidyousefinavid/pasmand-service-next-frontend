/**
 * Design tokens for the citizen app, in the shape the vehicle project uses.
 *
 * Every value is a CSS variable reference rather than a literal, so one inline
 * style renders correctly in both themes — the variables are defined in
 * globals.css under `:root` and redefined under `html[data-theme="dark"]`.
 *
 * Because these are `var(...)` strings and not hex, the `${C.green}1F` alpha
 * suffix trick cannot work. Use `alpha()`:
 *   background: alpha(C.green, 12)
 */
export const C = {
  green:     'var(--pm-green)',
  greenDark: 'var(--pm-green-dark)',
  greenSoft: 'var(--pm-green-soft)',
  amber:     'var(--pm-amber)',
  red:       'var(--pm-red)',
  blue:      'var(--pm-blue)',
  violet:    'var(--pm-violet)',

  bg:        'var(--pm-bg)',
  bgSubtle:  'var(--pm-bg-subtle)',
  surface:   'var(--pm-surface)',
  surface2:  'var(--pm-surface-2)',

  heroStart: 'var(--pm-hero-start)',
  heroEnd:   'var(--pm-hero-end)',
  onHero:    'var(--pm-on-hero)',
  onHeroMuted: 'var(--pm-on-hero-muted)',

  textStrong: 'var(--pm-text-strong)',
  text:       'var(--pm-text)',
  muted:      'var(--pm-muted)',
  subtle:     'var(--pm-subtle)',
  onAccent:   'var(--pm-on-accent)',

  border:       'var(--pm-border)',
  borderStrong: 'var(--pm-border-strong)',

  shadowCard:  'var(--pm-shadow-card)',
  shadowLift:  'var(--pm-shadow-lift)',
  shadowHero:  'var(--pm-shadow-hero)',
  shadowSheet: 'var(--pm-shadow-sheet)',

  statusOk:      'var(--pm-status-ok)',
  statusWarn:    'var(--pm-status-warn)',
  statusInfo:    'var(--pm-status-info)',
  statusDanger:  'var(--pm-status-danger)',
  statusNeutral: 'var(--pm-status-neutral)',
} as const;

/** One hue per waste type — see --pm-waste-* in globals.css. */
export const WASTE_COLOR = {
  household:    'var(--pm-waste-household)',
  recyclable:   'var(--pm-waste-recyclable)',
  electronic:   'var(--pm-waste-electronic)',
  bulky:        'var(--pm-waste-bulky)',
  automotive:   'var(--pm-waste-automotive)',
  construction: 'var(--pm-waste-construction)',
} as const;

/**
 * Type scale and spacing. Fluid so one set of numbers works from a 360px phone
 * to a desktop without a breakpoint for every size.
 */
export const S = {
  xs:   'clamp(0.68rem, 0.64rem + 0.18vw, 0.76rem)',
  sm:   'clamp(0.78rem, 0.74rem + 0.2vw, 0.88rem)',
  base: 'clamp(0.88rem, 0.84rem + 0.22vw, 0.98rem)',
  md:   'clamp(1rem, 0.94rem + 0.3vw, 1.14rem)',
  lg:   'clamp(1.14rem, 1.04rem + 0.45vw, 1.36rem)',
  xl:   'clamp(1.34rem, 1.18rem + 0.7vw, 1.7rem)',
  xxl:  'clamp(1.6rem, 1.3rem + 1.3vw, 2.3rem)',

  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 22,
  s6: 30,
  s7: 42,

  r1: 12,
  r2: 16,
  r3: 20,
  r4: 26,
  rPill: 999,
} as const;

/**
 * Translucent variant of any colour — a hex literal, a `var(--x)` or a colour
 * passed down as a prop. `color-mix` is what makes this work on variables.
 *
 * @param percent opacity 0–100.
 */
export function alpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

export type RequestStatus = 'pending' | 'collecting' | 'completed' | 'canceled';

export const STATUS_THEME: Record<RequestStatus, { label: string; color: string }> = {
  pending:    { label: 'در انتظار تأیید',  color: C.statusWarn },
  collecting: { label: 'در حال جمع‌آوری', color: C.statusInfo },
  completed:  { label: 'تکمیل شده',        color: C.statusOk },
  canceled:   { label: 'لغو شده',          color: C.statusDanger },
};

/** Persian digits everywhere a number is read rather than computed with. */
export function fa(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '—';
  return Number(n).toLocaleString('fa-IR');
}

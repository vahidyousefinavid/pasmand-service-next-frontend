import Cookies from 'js-cookie';
import { C } from '@/components/ui/tokens';

/**
 * The shapes and the small conversions the two request screens share.
 *
 * Both screens read the same collection from two angles — work that is free and
 * work that is mine — so the types, the unit names and the stage list live here
 * rather than being written twice and drifting apart.
 */

export interface TimeSlot { date: string; time: string; _id?: string }
export interface Loc { lat: number; lng: number; title?: string; address?: string }
export interface Person { _id: string; first_name?: string; last_name?: string; phone: string }

export interface Item {
  _id?: string;
  material?: string;
  title: string;
  category?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
}

export type Status = 'pending' | 'collecting' | 'completed' | 'canceled';

export interface PasmandRequest {
  _id: string;
  description?: string;
  status: Status;
  location: Loc;
  items: Item[];
  date: string;
  timeSlot: TimeSlot;
  totalPrice: number;
  paymentMethod?: 'wallet' | 'cash';
  user: Person;
  collector?: Person;
}

export const UNITS: Record<string, string> = { g: 'گرم', kg: 'کیلوگرم', ton: 'تن' };

export const unitName = (u?: string) => (u && UNITS[u]) || u || '';

export const toman = (n: number | undefined | null) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(Number(n) || 0));

/** The request's own date is an ISO string; the pickup slot is already Jalali text. */
export function faDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return '—';
  }
}

export const STATUS: Record<Status, { label: string; color: string }> = {
  pending: { label: 'در انتظار پذیرش', color: C.statusWarn },
  collecting: { label: 'در حال جمع‌آوری', color: C.statusInfo },
  completed: { label: 'تکمیل شده', color: C.statusOk },
  canceled: { label: 'لغو شده', color: C.statusDanger },
};

/**
 * The stages one pickup passes through, for the step rail.
 *
 * Deliberately the same four the citizen sees in their history: when the two
 * sides phone each other about "where are we", they should be looking at the
 * same list.
 */
export const STAGES = [
  { key: 'registered', title: 'ثبت درخواست شهروند' },
  { key: 'accepted', title: 'پذیرش توسط جمع‌آور' },
  { key: 'collecting', title: 'مراجعه و توزین در محل' },
  { key: 'done', title: 'تسویه و تکمیل' },
];

/** Which stage a request is standing on. `canceled` fails whatever it reached. */
export function stageOf(r: { status: Status; collector?: unknown }): number {
  if (r.status === 'completed') return 3;
  if (r.status === 'canceled') return r.collector ? 2 : 1;
  if (r.status === 'collecting') return 2;
  return 1;
}

/** The panel API reads a bearer token; the cookie is where login puts it. */
export function authHeader(): Record<string, string> | undefined {
  const token = Cookies.get('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/** A map link that works on a phone with no app installed. */
export function mapsUrl(loc?: Loc) {
  if (!loc?.lat || !loc?.lng) return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
}

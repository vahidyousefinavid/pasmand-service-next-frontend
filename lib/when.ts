import moment from 'jalali-moment';

/**
 * Two ways of writing a time, and the rule for choosing between them.
 *
 * A list is read by scanning: «۱۰ دقیقه پیش» answers «is this new?» in one
 * glance, which is the only question being asked there. A receipt or a detail
 * view is read once and carefully, and there the exact Jalali date is what
 * somebody quotes to support. Both live here so the two screens that show
 * conversations and notifications cannot drift apart.
 */

const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** Latin digits in any string turned Persian, for anything not run through `fa()`. */
export const faDigits = (value: string) => value.replace(/\d/g, (d) => PERSIAN[Number(d)]);

/** «همین حالا» → «۱۲ دقیقه پیش» → «۳ ساعت پیش» → a date. */
export function relative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'همین حالا';
  if (minutes < 60) return `${faDigits(String(minutes))} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${faDigits(String(hours))} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'دیروز';
  if (days < 7) return `${faDigits(String(days))} روز پیش`;

  return jalaliDate(iso);
}

export function jalaliDate(iso: string): string {
  try {
    return faDigits(moment(iso).locale('fa').format('YYYY/MM/DD'));
  } catch {
    return '';
  }
}

export function jalaliDateTime(iso: string): string {
  try {
    return faDigits(moment(iso).locale('fa').format('YYYY/MM/DD - HH:mm'));
  } catch {
    return '';
  }
}

export function clock(iso: string): string {
  try {
    return faDigits(moment(iso).locale('fa').format('HH:mm'));
  } catch {
    return '';
  }
}

/** Date helpers shared across modules. All local-time; DateKey = 'yyyy-MM-dd'. */

import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
} from 'date-fns';
import type { DateKey, Minutes } from '@/core/types';

export const toKey = (d: Date): DateKey => format(d, 'yyyy-MM-dd');
export const fromKey = (k: DateKey): Date => parseISO(k);
export const todayKey = (): DateKey => toKey(new Date());

export const keyIsToday = (k: DateKey) => isToday(fromKey(k));
export const sameKey = (a: DateKey, b: DateKey) => a === b;

export const addDaysKey = (k: DateKey, n: number): DateKey => toKey(addDays(fromKey(k), n));

export const daysUntil = (k: DateKey): number =>
  differenceInCalendarDays(fromKey(k), new Date());

/** 'Mon 4' / 'Today' / 'Tomorrow' — the label a human wants on a chip. */
export function humanDay(k: DateKey): string {
  const n = daysUntil(k);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  const d = fromKey(k);
  if (Math.abs(n) < 7) return format(d, 'EEE');
  return format(d, 'MMM d');
}

export function fullDay(k: DateKey): string {
  return format(fromKey(k), 'EEEE, MMMM d');
}

/** Week starting Monday, as 7 DateKeys. */
export function weekKeys(anchor: Date = new Date()): DateKey[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toKey(addDays(start, i)));
}

/** Last n days ending today, oldest first. */
export function trailingKeys(n: number): DateKey[] {
  const out: DateKey[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(toKey(addDays(new Date(), -i)));
  return out;
}

export const minutesNow = (): Minutes => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export function fmtMinutes(m: Minutes): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}

/** 540 → '9:00', 810 → '13:30' (24h keeps column widths stable). */
export function fmtClock(m: Minutes): string {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${h}:${String(mm).padStart(2, '0')}`;
}

export { isSameDay, format };

/**
 * Derived data. Pure functions over store slices — components call these inside
 * useData(useShallow(...)) or with plain state, keeping renders cheap and the
 * business rules testable in one place.
 */

import type {
  DataState,
} from '@/core/store/data';
import type { DateKey, Goal, Habit, HabitLog, Priority, Task } from '@/core/types';
import { fromKey, todayKey, trailingKeys } from '@/lib/dates';

/* ── Task lenses ─────────────────────────────────────────────────────── */

export const isOpen = (t: Task) => t.status !== 'done' && t.status !== 'dropped';

export function tasksForDay(tasks: Task[], date: DateKey): Task[] {
  return tasks
    .filter((t) => t.plannedFor === date && t.status !== 'dropped')
    .sort(byPriorityThenOrder);
}

export function inboxTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'inbox').sort((a, b) => a.order - b.order);
}

export function upcomingTasks(tasks: Task[], from: DateKey, days = 14): Map<DateKey, Task[]> {
  const map = new Map<DateKey, Task[]>();
  for (const t of tasks) {
    if (!isOpen(t)) continue;
    const key = t.plannedFor ?? t.dueDate;
    if (!key || key <= from) continue;
    const diff = (fromKey(key).getTime() - fromKey(from).getTime()) / 86400000;
    if (diff > days) continue;
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  for (const list of map.values()) list.sort(byPriorityThenOrder);
  return new Map([...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
}

export function overdueTasks(tasks: Task[], today: DateKey): Task[] {
  return tasks
    .filter((t) => isOpen(t) && ((t.dueDate && t.dueDate < today) || (t.plannedFor && t.plannedFor < today)))
    .sort(byPriorityThenOrder);
}

const priRank: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
export function byPriorityThenOrder(a: Task, b: Task): number {
  return priRank[a.priority] - priRank[b.priority] || a.order - b.order;
}

export function isBlocked(t: Task, all: Task[]): boolean {
  return t.blockedBy.some((id) => {
    const dep = all.find((x) => x.id === id);
    return dep ? isOpen(dep) : false;
  });
}

/** Eisenhower quadrant: urgency from due/planned proximity, importance from priority. */
export function eisenhowerQuadrant(t: Task, today: DateKey): 0 | 1 | 2 | 3 {
  const due = t.dueDate ?? t.plannedFor;
  const urgent =
    t.priority === 'urgent' ||
    (!!due && (fromKey(due).getTime() - fromKey(today).getTime()) / 86400000 <= 2);
  const important = t.priority === 'urgent' || t.priority === 'high' || !!t.projectId;
  if (urgent && important) return 0; // do
  if (!urgent && important) return 1; // schedule
  if (urgent && !important) return 2; // delegate/shrink
  return 3; // eliminate
}

/* ── Day stats (the Today header) ────────────────────────────────────── */

export interface DayStats {
  total: number;
  done: number;
  plannedMinutes: number;
  doneMinutes: number;
}

export function dayStats(tasks: Task[], date: DateKey): DayStats {
  const day = tasks.filter((t) => t.plannedFor === date && t.status !== 'dropped');
  const done = day.filter((t) => t.status === 'done');
  return {
    total: day.length,
    done: done.length,
    plannedMinutes: day.reduce((s, t) => s + (t.estimate ?? 30), 0),
    doneMinutes: done.reduce((s, t) => s + (t.estimate ?? 30), 0),
  };
}

/* ── Habits ──────────────────────────────────────────────────────────── */

export function habitDoneOn(logs: HabitLog[], habitId: string, date: DateKey): boolean {
  return logs.some((l) => l.habitId === habitId && l.date === date && l.done);
}

/** A habit "counts" on a date if its cadence expects it that day. */
export function habitExpectedOn(habit: Habit, date: DateKey): boolean {
  const day = fromKey(date).getDay();
  switch (habit.cadence.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return habit.cadence.days.includes(day);
    case 'times-per-week':
      return true; // any day can count toward the weekly quota
  }
}

/**
 * Streak with freezes: walk backwards from today. A frozen day neither breaks
 * nor extends the streak. For times-per-week habits the streak is counted in
 * completed days (any day counts).
 */
export function habitStreak(habit: Habit, logs: HabitLog[], today: DateKey = todayKey()): number {
  let streak = 0;
  const days = trailingKeys(365).reverse(); // today first
  for (const day of days) {
    if (day > today) continue;
    const done = habitDoneOn(logs, habit.id, day);
    const frozen = habit.freezes.includes(day);
    const expected = habitExpectedOn(habit, day);
    if (done) {
      streak++;
    } else if (frozen || !expected) {
      continue; // neutral day
    } else if (day === today) {
      continue; // today isn't over — an unmet habit doesn't break yet
    } else {
      break;
    }
  }
  return streak;
}

/** completion ratio for the trailing n days (expected days only) */
export function habitConsistency(habit: Habit, logs: HabitLog[], n = 30): number {
  const days = trailingKeys(n);
  let expected = 0;
  let done = 0;
  for (const day of days) {
    if (habit.cadence.type === 'times-per-week') {
      expected += habit.cadence.times / 7;
    } else if (habitExpectedOn(habit, day)) {
      expected += 1;
    }
    if (habitDoneOn(logs, habit.id, day)) done += 1;
  }
  return expected === 0 ? 0 : Math.min(1, done / expected);
}

/* ── Goals ───────────────────────────────────────────────────────────── */

export function goalProgress(goal: Goal): number {
  if (!goal.keyResults.length) return goal.status === 'achieved' ? 1 : 0;
  const sum = goal.keyResults.reduce((acc, kr) => {
    const span = kr.target - kr.start;
    if (span === 0) return acc + 1;
    return acc + Math.max(0, Math.min(1, (kr.current - kr.start) / span));
  }, 0);
  return sum / goal.keyResults.length;
}

/* ── Analytics (dashboard) ───────────────────────────────────────────── */

export interface TrendPoint {
  date: DateKey;
  value: number;
}

export function completionTrend(tasks: Task[], days = 14): TrendPoint[] {
  return trailingKeys(days).map((date) => ({
    date,
    value: tasks.filter((t) => t.status === 'done' && t.plannedFor === date).length,
  }));
}

export function focusMinutesTrend(sessions: DataState['sessions'], days = 14): TrendPoint[] {
  return trailingKeys(days).map((date) => {
    const dayStart = fromKey(date).getTime();
    const dayEnd = dayStart + 86400000;
    const mins = sessions
      .filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd && s.endedAt)
      .reduce((acc, s) => acc + Math.round(((s.endedAt as number) - s.startedAt) / 60000), 0);
    return { date, value: mins };
  });
}

/** Minutes of planned blocks per area for a trailing window — the balance view. */
export function areaLoad(state: Pick<DataState, 'blocks' | 'areas'>, days = 7): Map<string, number> {
  const keys = new Set(trailingKeys(days));
  const map = new Map<string, number>();
  for (const b of state.blocks) {
    if (!keys.has(b.date) || !b.areaId) continue;
    map.set(b.areaId, (map.get(b.areaId) ?? 0) + b.duration);
  }
  return map;
}

/** Suggested next action for the "what now?" slot. Never silently acts. */
export function suggestNow(state: Pick<DataState, 'tasks'>, date: DateKey): { task: Task; reason: string } | null {
  const open = tasksForDay(state.tasks, date).filter((t) => isOpen(t) && !isBlocked(t, state.tasks));
  if (!open.length) return null;
  const urgent = open.find((t) => t.priority === 'urgent');
  if (urgent) return { task: urgent, reason: 'Maior prioridade no plano de hoje' };
  const short = open.find((t) => (t.estimate ?? 30) <= 15);
  const hour = new Date().getHours();
  if (hour >= 16 && short) return { task: short, reason: 'Pequena o bastante para terminar antes do fim do dia' };
  return { task: open[0], reason: 'Próxima por prioridade no plano de hoje' };
}

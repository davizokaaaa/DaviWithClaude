/**
 * Domain model.
 *
 * One principle governs this file: a thing lives in exactly one collection,
 * and every view is a lens over those collections. Nothing is duplicated to
 * make a view easier to build.
 */

export type ID = string;

/** ISO date, local, no time component: '2026-08-04' */
export type DateKey = string;
/** Minutes after midnight, local. 540 = 09:00 */
export type Minutes = number;

export type Hue =
  | 'indigo'
  | 'green'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'purple'
  | 'teal'
  | 'graphite';

/* ── Life structure ──────────────────────────────────────────────────── */

/** Top level of the hierarchy: Areas → Goals → Projects → Tasks. */
export interface Area {
  id: ID;
  name: string;
  icon: string;
  hue: Hue;
  order: number;
  /** Weekly hours the user intends to invest. Drives the balance view. */
  intendedHours?: number;
}

export type GoalStatus = 'on-track' | 'at-risk' | 'behind' | 'achieved' | 'paused';

export interface KeyResult {
  id: ID;
  name: string;
  /** current progresses from start → target; unit is display-only */
  start: number;
  current: number;
  target: number;
  unit?: string;
}

export interface Goal {
  id: ID;
  areaId: ID;
  name: string;
  why?: string;
  horizon: 'quarter' | 'year' | 'long';
  status: GoalStatus;
  keyResults: KeyResult[];
  targetDate?: DateKey;
  createdAt: number;
}

/* ── Execution ───────────────────────────────────────────────────────── */

export type ProjectStatus = 'active' | 'planned' | 'paused' | 'done';

export interface Project {
  id: ID;
  areaId: ID;
  goalId?: ID;
  parentId?: ID; // subproject support
  name: string;
  description?: string;
  status: ProjectStatus;
  hue: Hue;
  order: number;
  targetDate?: DateKey;
  createdAt: number;
  /** Kanban column order for this project's board */
  columns: KanbanColumn[];
}

export interface KanbanColumn {
  id: ID;
  name: string;
  /** Tasks in this column count against WIP when set */
  wipLimit?: number;
}

export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type TaskStatus = 'inbox' | 'todo' | 'in-progress' | 'done' | 'dropped';
export type EnergyLevel = 'deep' | 'focused' | 'light';

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

export interface Recurrence {
  freq: 'daily' | 'weekly' | 'monthly';
  /** for weekly: 0=Sun..6=Sat */
  weekdays?: number[];
  interval: number;
}

export interface Task {
  id: ID;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: Priority;
  areaId?: ID;
  projectId?: ID;
  columnId?: ID;
  order: number;
  /** Which day the user committed this task to (daily planning). */
  plannedFor?: DateKey;
  dueDate?: DateKey;
  /** Estimated minutes of work; feeds time-blocking and the day gauge. */
  estimate?: Minutes;
  energy?: EnergyLevel;
  tags: string[];
  subtasks: Subtask[];
  /** ids of tasks that must complete before this one can start */
  blockedBy: ID[];
  recurrence?: Recurrence;
  createdAt: number;
  completedAt?: number;
}

/* ── Time ────────────────────────────────────────────────────────────── */

export interface TimeBlock {
  id: ID;
  date: DateKey;
  start: Minutes;
  duration: Minutes;
  title: string;
  taskId?: ID;
  areaId?: ID;
  hue?: Hue;
  kind: 'task' | 'event' | 'ritual' | 'break';
}

/* ── Habits, mood, energy ────────────────────────────────────────────── */

export interface Habit {
  id: ID;
  name: string;
  icon: string;
  hue: Hue;
  areaId?: ID;
  cadence: { type: 'daily' } | { type: 'weekdays'; days: number[] } | { type: 'times-per-week'; times: number };
  /** e.g. "20 min" — display only */
  target?: string;
  order: number;
  createdAt: number;
  archived?: boolean;
  /** Dates on which a miss was forgiven. Streaks skip these. */
  freezes: DateKey[];
}

export interface HabitLog {
  habitId: ID;
  date: DateKey;
  done: boolean;
}

/** 1..5 for both; logged once per day at shutdown (or whenever). */
export interface DayPulse {
  date: DateKey;
  mood?: number;
  energy?: number;
  note?: string;
}

/* ── Focus ───────────────────────────────────────────────────────────── */

export interface FocusSession {
  id: ID;
  taskId?: ID;
  intent?: string;
  kind: 'pomodoro' | 'deep';
  startedAt: number;
  /** planned length in minutes */
  length: Minutes;
  endedAt?: number;
  completed: boolean;
}

/* ── Knowledge ───────────────────────────────────────────────────────── */

export type NoteKind = 'note' | 'journal' | 'meeting' | 'bookmark' | 'reading';

export interface Note {
  id: ID;
  kind: NoteKind;
  title: string;
  body: string;
  areaId?: ID;
  projectId?: ID;
  tags: string[];
  url?: string; // bookmarks / reading list
  readingStatus?: 'to-read' | 'reading' | 'read';
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Finance (overview, not bookkeeping) ─────────────────────────────── */

export interface MoneyFlow {
  id: ID;
  name: string;
  amount: number; // monthly; positive = income, negative = expense
  kind: 'income' | 'fixed' | 'variable' | 'saving';
  hue: Hue;
}

export interface SavingsGoal {
  id: ID;
  name: string;
  current: number;
  target: number;
  hue: Hue;
}

/* ── Reviews & rituals ───────────────────────────────────────────────── */

export type ReviewCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface Review {
  id: ID;
  cadence: ReviewCadence;
  /** Anchor date: the day/week/month the review covers */
  periodKey: string;
  answers: Record<string, string>;
  completedAt: number;
}

/** Result of a daily shutdown: what the user chose per unfinished task. */
export interface ShutdownRecord {
  date: DateKey;
  completedAt: number;
  carried: number;
  rescheduled: number;
  dropped: number;
}

/* ── Settings ────────────────────────────────────────────────────────── */

export type ThemePref = 'system' | 'dark' | 'light';
export type AccentPref = 'indigo' | 'evergreen' | 'amber' | 'rose' | 'graphite';
export type DensityPref = 'comfortable' | 'compact';

export interface ModuleFlags {
  finance: boolean;
  habits: boolean;
  knowledge: boolean;
  goals: boolean;
  reviews: boolean;
  focus: boolean;
}

/* ── View routing ────────────────────────────────────────────────────── */

export type ViewId =
  | 'today'
  | 'inbox'
  | 'upcoming'
  | 'projects'
  | 'project'
  | 'calendar'
  | 'focus'
  | 'habits'
  | 'goals'
  | 'areas'
  | 'notes'
  | 'finance'
  | 'reviews'
  | 'dashboard'
  | 'matrix'
  | 'timeline'
  | 'settings';

export interface Route {
  view: ViewId;
  /** e.g. projectId for 'project', noteId for 'notes' */
  param?: string;
}

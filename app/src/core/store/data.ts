/**
 * The single persisted data store. Zustand + localStorage.
 *
 * Actions are small and named after user intent (completeTask, not setTask) —
 * this is what keeps undo, toasts and analytics honest later.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Area, DateKey, DayPulse, FocusSession, Goal, Habit, HabitLog, ID, MoneyFlow,
  Note, Priority, Project, Review, ReviewCadence, SavingsGoal, ShutdownRecord,
  Task, TaskStatus, TimeBlock,
} from '@/core/types';
import { uid } from '@/lib/id';
import { addDaysKey, todayKey } from '@/lib/dates';
import { seedState } from '@/core/store/seed';

export interface DataState {
  areas: Area[];
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  blocks: TimeBlock[];
  habits: Habit[];
  habitLogs: HabitLog[];
  pulses: DayPulse[];
  sessions: FocusSession[];
  notes: Note[];
  flows: MoneyFlow[];
  savings: SavingsGoal[];
  reviews: Review[];
  shutdowns: ShutdownRecord[];
  /** Dates on which daily planning was completed. */
  plannedDays: DateKey[];

  /* tasks */
  addTask: (partial: Partial<Task> & { title: string }) => Task;
  updateTask: (id: ID, patch: Partial<Task>) => void;
  completeTask: (id: ID) => void;
  reopenTask: (id: ID) => void;
  dropTask: (id: ID) => void;
  deleteTask: (id: ID) => void;
  toggleSubtask: (taskId: ID, subtaskId: ID) => void;
  addSubtask: (taskId: ID, title: string) => void;
  moveTaskToColumn: (taskId: ID, columnId: ID, order: number) => void;
  planTask: (taskId: ID, date: DateKey | undefined) => void;
  setPriority: (taskId: ID, p: Priority) => void;

  /* projects */
  addProject: (partial: Partial<Project> & { name: string; areaId: ID }) => Project;
  updateProject: (id: ID, patch: Partial<Project>) => void;

  /* goals */
  updateKeyResult: (goalId: ID, krId: ID, current: number) => void;
  updateGoal: (id: ID, patch: Partial<Goal>) => void;

  /* time blocks */
  addBlock: (b: Omit<TimeBlock, 'id'>) => TimeBlock;
  updateBlock: (id: ID, patch: Partial<TimeBlock>) => void;
  deleteBlock: (id: ID) => void;

  /* habits */
  toggleHabit: (habitId: ID, date: DateKey) => void;
  freezeHabit: (habitId: ID, date: DateKey) => void;
  addHabit: (partial: Partial<Habit> & { name: string }) => Habit;
  updateHabit: (id: ID, patch: Partial<Habit>) => void;

  /* pulse */
  logPulse: (p: DayPulse) => void;

  /* focus */
  startSession: (s: Omit<FocusSession, 'id' | 'startedAt' | 'completed'>) => FocusSession;
  endSession: (id: ID, completed: boolean) => void;

  /* notes */
  addNote: (partial: Partial<Note> & { title: string }) => Note;
  updateNote: (id: ID, patch: Partial<Note>) => void;
  deleteNote: (id: ID) => void;

  /* finance */
  updateFlow: (id: ID, patch: Partial<MoneyFlow>) => void;
  addFlow: (f: Omit<MoneyFlow, 'id'>) => void;
  deleteFlow: (id: ID) => void;
  updateSavings: (id: ID, patch: Partial<SavingsGoal>) => void;

  /* rituals */
  markDayPlanned: (date: DateKey) => void;
  recordShutdown: (r: ShutdownRecord) => void;
  saveReview: (cadence: ReviewCadence, periodKey: string, answers: Record<string, string>) => void;

  /** Rolls unfinished planned tasks from `date` to the next day. */
  carryOver: (from: DateKey) => number;

  resetToSeed: () => void;
}

const now = () => Date.now();

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      /* ── tasks ─────────────────────────────────────────────────── */
      addTask: (partial) => {
        const task: Task = {
          id: uid('t'),
          title: partial.title,
          notes: partial.notes,
          status: partial.status ?? 'inbox',
          priority: partial.priority ?? 'none',
          areaId: partial.areaId,
          projectId: partial.projectId,
          columnId: partial.columnId,
          order: partial.order ?? now(),
          plannedFor: partial.plannedFor,
          dueDate: partial.dueDate,
          estimate: partial.estimate,
          energy: partial.energy,
          tags: partial.tags ?? [],
          subtasks: partial.subtasks ?? [],
          blockedBy: partial.blockedBy ?? [],
          recurrence: partial.recurrence,
          createdAt: now(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      completeTask: (id) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          const done: Task = { ...task, status: 'done', completedAt: now() };
          const next = s.tasks.map((t) => (t.id === id ? done : t));
          // Recurring tasks respawn on completion, scheduled forward.
          if (task.recurrence) {
            const base = task.plannedFor ?? todayKey();
            const gap =
              task.recurrence.freq === 'daily'
                ? task.recurrence.interval
                : task.recurrence.freq === 'weekly'
                  ? 7 * task.recurrence.interval
                  : 30 * task.recurrence.interval;
            next.push({
              ...task,
              id: uid('t'),
              status: 'todo',
              plannedFor: addDaysKey(base, gap),
              completedAt: undefined,
              subtasks: task.subtasks.map((st) => ({ ...st, done: false })),
              createdAt: now(),
            });
          }
          return { tasks: next };
        }),

      reopenTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'todo' as TaskStatus, completedAt: undefined } : t,
          ),
        })),

      dropTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'dropped' as TaskStatus } : t)) })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st)) }
              : t,
          ),
        })),

      addSubtask: (taskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: [...t.subtasks, { id: uid('st'), title, done: false }] } : t,
          ),
        })),

      moveTaskToColumn: (taskId, columnId, order) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, columnId, order, status: t.status === 'done' ? t.status : 'in-progress' }
              : t,
          ),
        })),

      planTask: (taskId, date) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, plannedFor: date, status: t.status === 'inbox' ? 'todo' : t.status }
              : t,
          ),
        })),

      setPriority: (taskId, p) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, priority: p } : t)) })),

      /* ── projects ──────────────────────────────────────────────── */
      addProject: (partial) => {
        const project: Project = {
          id: uid('p'),
          areaId: partial.areaId,
          goalId: partial.goalId,
          parentId: partial.parentId,
          name: partial.name,
          description: partial.description,
          status: partial.status ?? 'active',
          hue: partial.hue ?? 'indigo',
          order: partial.order ?? now(),
          targetDate: partial.targetDate,
          createdAt: now(),
          columns: partial.columns ?? [
            { id: uid('c'), name: 'To do' },
            { id: uid('c'), name: 'In progress', wipLimit: 3 },
            { id: uid('c'), name: 'Done' },
          ],
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      /* ── goals ─────────────────────────────────────────────────── */
      updateKeyResult: (goalId, krId, current) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, keyResults: g.keyResults.map((kr) => (kr.id === krId ? { ...kr, current } : kr)) }
              : g,
          ),
        })),

      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      /* ── time blocks ───────────────────────────────────────────── */
      addBlock: (b) => {
        const block: TimeBlock = { ...b, id: uid('b') };
        set((s) => ({ blocks: [...s.blocks, block] }));
        return block;
      },
      updateBlock: (id, patch) =>
        set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      deleteBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

      /* ── habits ────────────────────────────────────────────────── */
      toggleHabit: (habitId, date) =>
        set((s) => {
          const existing = s.habitLogs.find((l) => l.habitId === habitId && l.date === date);
          if (existing) {
            return { habitLogs: s.habitLogs.filter((l) => !(l.habitId === habitId && l.date === date)) };
          }
          return { habitLogs: [...s.habitLogs, { habitId, date, done: true }] };
        }),

      freezeHabit: (habitId, date) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === habitId && !h.freezes.includes(date) ? { ...h, freezes: [...h.freezes, date] } : h,
          ),
        })),

      addHabit: (partial) => {
        const habit: Habit = {
          id: uid('h'),
          name: partial.name,
          icon: partial.icon ?? '✦',
          hue: partial.hue ?? 'indigo',
          areaId: partial.areaId,
          cadence: partial.cadence ?? { type: 'daily' },
          target: partial.target,
          order: partial.order ?? now(),
          createdAt: now(),
          freezes: [],
        };
        set((s) => ({ habits: [...s.habits, habit] }));
        return habit;
      },

      updateHabit: (id, patch) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),

      /* ── pulse ─────────────────────────────────────────────────── */
      logPulse: (p) =>
        set((s) => ({
          pulses: [...s.pulses.filter((x) => x.date !== p.date), { ...s.pulses.find((x) => x.date === p.date), ...p }],
        })),

      /* ── focus ─────────────────────────────────────────────────── */
      startSession: (partial) => {
        const session: FocusSession = { ...partial, id: uid('f'), startedAt: now(), completed: false };
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session;
      },
      endSession: (id, completed) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, endedAt: now(), completed } : x)),
        })),

      /* ── notes ─────────────────────────────────────────────────── */
      addNote: (partial) => {
        const note: Note = {
          id: uid('n'),
          kind: partial.kind ?? 'note',
          title: partial.title,
          body: partial.body ?? '',
          areaId: partial.areaId,
          projectId: partial.projectId,
          tags: partial.tags ?? [],
          url: partial.url,
          readingStatus: partial.readingStatus,
          pinned: partial.pinned,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      /* ── finance ───────────────────────────────────────────────── */
      updateFlow: (id, patch) =>
        set((s) => ({ flows: s.flows.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      addFlow: (f) => set((s) => ({ flows: [...s.flows, { ...f, id: uid('m') }] })),
      deleteFlow: (id) => set((s) => ({ flows: s.flows.filter((f) => f.id !== id) })),
      updateSavings: (id, patch) =>
        set((s) => ({ savings: s.savings.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      /* ── rituals ───────────────────────────────────────────────── */
      markDayPlanned: (date) =>
        set((s) => (s.plannedDays.includes(date) ? s : { plannedDays: [...s.plannedDays, date] })),

      recordShutdown: (r) =>
        set((s) => ({ shutdowns: [...s.shutdowns.filter((x) => x.date !== r.date), r] })),

      saveReview: (cadence, periodKey, answers) =>
        set((s) => ({
          reviews: [
            ...s.reviews.filter((r) => !(r.cadence === cadence && r.periodKey === periodKey)),
            { id: uid('r'), cadence, periodKey, answers, completedAt: now() },
          ],
        })),

      carryOver: (from) => {
        const { tasks } = get();
        const stale = tasks.filter(
          (t) => t.plannedFor === from && t.status !== 'done' && t.status !== 'dropped',
        );
        if (stale.length) {
          const to = addDaysKey(from, 1);
          set((s) => ({
            tasks: s.tasks.map((t) => (stale.some((x) => x.id === t.id) ? { ...t, plannedFor: to } : t)),
          }));
        }
        return stale.length;
      },

      resetToSeed: () => set(() => ({ ...seedState() })),
    }),
    {
      name: 'meridian.data',
      version: 1,
    },
  ),
);

/**
 * The seeded workspace.
 *
 * Research note (notes/personal-os-research.md §4): the documented failure mode
 * of Notion-class tools is "endless setup before value". Meridian opens as a
 * coherent, believable workspace — real areas, a live project mid-flight,
 * habits with history, notes worth reading — so every view demonstrates itself.
 */

import type { DataState } from '@/core/store/data';
import type { DayPulse, HabitLog, Task, TimeBlock } from '@/core/types';
import { addDaysKey, todayKey, trailingKeys } from '@/lib/dates';
import { uid } from '@/lib/id';

type SeedSlice = Omit<
  DataState,
  | 'addTask' | 'updateTask' | 'completeTask' | 'reopenTask' | 'dropTask' | 'deleteTask'
  | 'toggleSubtask' | 'addSubtask' | 'moveTaskToColumn' | 'planTask' | 'setPriority'
  | 'addProject' | 'updateProject' | 'updateKeyResult' | 'updateGoal'
  | 'addBlock' | 'updateBlock' | 'deleteBlock'
  | 'toggleHabit' | 'freezeHabit' | 'addHabit' | 'updateHabit'
  | 'logPulse' | 'startSession' | 'endSession'
  | 'addNote' | 'updateNote' | 'deleteNote'
  | 'updateFlow' | 'addFlow' | 'deleteFlow' | 'updateSavings'
  | 'markDayPlanned' | 'recordShutdown' | 'saveReview' | 'carryOver' | 'resetToSeed'
>;

export function seedState(): SeedSlice {
  const today = todayKey();
  const t = (n: number) => addDaysKey(today, n);
  const created = Date.now() - 1000 * 60 * 60 * 24 * 30;

  /* Areas ─────────────────────────────────────────────────────────── */
  const aWork = { id: 'area_work', name: 'Work', icon: '◆', hue: 'indigo' as const, order: 0, intendedHours: 40 };
  const aHealth = { id: 'area_health', name: 'Health', icon: '♥', hue: 'green' as const, order: 1, intendedHours: 6 };
  const aLearn = { id: 'area_learn', name: 'Learning', icon: '◉', hue: 'purple' as const, order: 2, intendedHours: 5 };
  const aLife = { id: 'area_life', name: 'Personal', icon: '✦', hue: 'amber' as const, order: 3, intendedHours: 8 };
  const aMoney = { id: 'area_money', name: 'Finance', icon: '▲', hue: 'teal' as const, order: 4, intendedHours: 1 };

  /* Goals ─────────────────────────────────────────────────────────── */
  const goals = [
    {
      id: 'goal_launch', areaId: aWork.id, name: 'Ship Atlas v2 to all customers',
      why: 'The redesign is the year’s biggest bet — landing it well compounds everything else.',
      horizon: 'quarter' as const, status: 'on-track' as const, targetDate: t(40), createdAt: created,
      keyResults: [
        { id: uid('kr'), name: 'Beta accounts migrated', start: 0, current: 64, target: 100, unit: '%' },
        { id: uid('kr'), name: 'P95 load time', start: 3.2, current: 1.9, target: 1.2, unit: 's' },
        { id: uid('kr'), name: 'Support tickets/week', start: 40, current: 24, target: 15 },
      ],
    },
    {
      id: 'goal_run', areaId: aHealth.id, name: 'Run a half marathon',
      why: 'Proof that consistency beats intensity.',
      horizon: 'year' as const, status: 'on-track' as const, targetDate: t(120), createdAt: created,
      keyResults: [
        { id: uid('kr'), name: 'Weekly distance', start: 8, current: 21, target: 32, unit: 'km' },
        { id: uid('kr'), name: 'Long run', start: 4, current: 12, target: 18, unit: 'km' },
      ],
    },
    {
      id: 'goal_sys', areaId: aLearn.id, name: 'Master systems design',
      why: 'The gap between senior and staff is architecture judgment.',
      horizon: 'year' as const, status: 'at-risk' as const, createdAt: created,
      keyResults: [
        { id: uid('kr'), name: 'Design docs written', start: 0, current: 3, target: 12 },
        { id: uid('kr'), name: 'Book chapters', start: 0, current: 7, target: 20 },
      ],
    },
    {
      id: 'goal_fund', areaId: aMoney.id, name: 'Six-month emergency fund',
      horizon: 'year' as const, status: 'on-track' as const, createdAt: created,
      keyResults: [{ id: uid('kr'), name: 'Months saved', start: 1.5, current: 3.8, target: 6, unit: 'mo' }],
    },
  ];

  /* Projects ──────────────────────────────────────────────────────── */
  const colA = { id: 'col_a_todo', name: 'To do' };
  const colB = { id: 'col_a_doing', name: 'In progress', wipLimit: 3 };
  const colC = { id: 'col_a_review', name: 'In review' };
  const colD = { id: 'col_a_done', name: 'Done' };

  const projects = [
    {
      id: 'proj_atlas', areaId: aWork.id, goalId: 'goal_launch', name: 'Atlas v2 launch',
      description: 'Redesign rollout: migration tooling, docs, and the launch sequence.',
      status: 'active' as const, hue: 'indigo' as const, order: 0, targetDate: t(40), createdAt: created,
      columns: [colA, colB, colC, colD],
    },
    {
      id: 'proj_hiring', areaId: aWork.id, name: 'Hire two engineers',
      description: 'Pipeline, interviews, and closing for the platform team.',
      status: 'active' as const, hue: 'blue' as const, order: 1, createdAt: created,
      columns: [
        { id: 'col_h_todo', name: 'To do' },
        { id: 'col_h_doing', name: 'In progress' },
        { id: 'col_h_done', name: 'Done' },
      ],
    },
    {
      id: 'proj_race', areaId: aHealth.id, goalId: 'goal_run', name: 'Half-marathon training',
      description: '16-week plan, currently week 9.',
      status: 'active' as const, hue: 'green' as const, order: 2, createdAt: created,
      columns: [
        { id: 'col_r_todo', name: 'To do' },
        { id: 'col_r_doing', name: 'This week' },
        { id: 'col_r_done', name: 'Done' },
      ],
    },
    {
      id: 'proj_home', areaId: aLife.id, name: 'Studio refresh',
      description: 'Turn the spare room into a proper workspace.',
      status: 'planned' as const, hue: 'amber' as const, order: 3, createdAt: created,
      columns: [
        { id: 'col_s_todo', name: 'To do' },
        { id: 'col_s_doing', name: 'Doing' },
        { id: 'col_s_done', name: 'Done' },
      ],
    },
  ];

  /* Tasks ─────────────────────────────────────────────────────────── */
  const mk = (partial: Partial<Task> & { title: string }): Task => ({
    id: uid('t'),
    title: partial.title,
    notes: partial.notes,
    status: partial.status ?? 'todo',
    priority: partial.priority ?? 'none',
    areaId: partial.areaId,
    projectId: partial.projectId,
    columnId: partial.columnId,
    order: partial.order ?? Math.random() * 1000,
    plannedFor: partial.plannedFor,
    dueDate: partial.dueDate,
    estimate: partial.estimate,
    energy: partial.energy,
    tags: partial.tags ?? [],
    subtasks: partial.subtasks ?? [],
    blockedBy: partial.blockedBy ?? [],
    recurrence: partial.recurrence,
    createdAt: created + Math.random() * 1000 * 60 * 60 * 24 * 20,
    completedAt: partial.completedAt,
  });

  const tMigration = mk({
    title: 'Finish migration dry-run on staging',
    notes: 'Run the full import against the staging snapshot; capture timings for the launch doc.',
    projectId: 'proj_atlas', areaId: aWork.id, columnId: colB.id,
    priority: 'urgent', plannedFor: today, estimate: 90, energy: 'deep', order: 1,
    tags: ['launch'],
    subtasks: [
      { id: uid('st'), title: 'Snapshot production data', done: true },
      { id: uid('st'), title: 'Run importer with new schema', done: true },
      { id: uid('st'), title: 'Diff record counts', done: false },
    ],
  });

  const tLaunchDoc = mk({
    title: 'Draft launch-day runbook',
    projectId: 'proj_atlas', areaId: aWork.id, columnId: colA.id,
    priority: 'high', plannedFor: today, estimate: 60, energy: 'focused', order: 2,
    tags: ['launch', 'writing'], blockedBy: [tMigration.id],
  });

  const tasks: Task[] = [
    tMigration,
    tLaunchDoc,
    mk({
      title: 'Review PR: rate limiter rewrite',
      projectId: 'proj_atlas', areaId: aWork.id, columnId: colC.id,
      priority: 'high', plannedFor: today, estimate: 45, energy: 'focused', order: 3, tags: ['code-review'],
    }),
    mk({
      title: 'Reply to Elena about beta feedback',
      areaId: aWork.id, priority: 'medium', plannedFor: today, estimate: 15, energy: 'light', order: 4,
    }),
    mk({
      title: 'Tempo run — 6 km @ 5:20',
      projectId: 'proj_race', areaId: aHealth.id, columnId: 'col_r_doing',
      priority: 'medium', plannedFor: today, estimate: 45, energy: 'light', order: 5, tags: ['training'],
    }),
    mk({
      title: 'Read: Designing Data-Intensive Applications, ch. 8',
      areaId: aLearn.id, priority: 'low', plannedFor: today, estimate: 40, energy: 'focused', order: 6,
      tags: ['reading'],
    }),

    /* tomorrow / upcoming */
    mk({
      title: 'Prepare interview loop for platform candidates',
      projectId: 'proj_hiring', areaId: aWork.id, columnId: 'col_h_doing',
      priority: 'high', plannedFor: t(1), estimate: 60, energy: 'focused',
      subtasks: [
        { id: uid('st'), title: 'Update system-design rubric', done: false },
        { id: uid('st'), title: 'Book interviewers', done: false },
      ],
    }),
    mk({
      title: 'Write Atlas migration announcement email',
      projectId: 'proj_atlas', areaId: aWork.id, columnId: colA.id,
      priority: 'medium', plannedFor: t(1), estimate: 30, energy: 'focused', tags: ['launch', 'writing'],
    }),
    mk({ title: 'Long run — 14 km easy', projectId: 'proj_race', areaId: aHealth.id, columnId: 'col_r_doing', plannedFor: t(2), estimate: 90, energy: 'light', priority: 'medium' }),
    mk({ title: 'Quarterly investment rebalance', areaId: aMoney.id, plannedFor: t(3), estimate: 30, priority: 'medium', energy: 'focused' }),
    mk({ title: 'Screen new candidate CVs', projectId: 'proj_hiring', areaId: aWork.id, columnId: 'col_h_todo', plannedFor: t(2), estimate: 40, priority: 'medium', energy: 'light' }),
    mk({
      title: 'Weekly review', areaId: aLife.id, plannedFor: t(4), estimate: 30, priority: 'high', energy: 'focused',
      recurrence: { freq: 'weekly', weekdays: [5], interval: 1 },
    }),

    /* due dates without plan (drive Upcoming) */
    mk({ title: 'Renew passport', areaId: aLife.id, dueDate: t(12), priority: 'high', estimate: 45 }),
    mk({ title: 'Submit conference talk proposal', areaId: aLearn.id, dueDate: t(8), priority: 'medium', estimate: 90, tags: ['writing'] }),
    mk({ title: 'Book dentist appointment', areaId: aHealth.id, dueDate: t(6), priority: 'low', estimate: 10 }),

    /* inbox — capture works when there is something to triage */
    mk({ title: 'Idea: internal demo day every month', status: 'inbox', order: 1 }),
    mk({ title: 'Look into the new profiler Ana mentioned', status: 'inbox', order: 2 }),
    mk({ title: 'Gift for Sofia’s birthday', status: 'inbox', order: 3 }),

    /* history — completed work so analytics/dashboard breathe */
    ...trailingKeys(14).flatMap((day, i) => {
      if (i % 3 === 2) return [];
      const n = (i % 4) + 1;
      return Array.from({ length: n }, (_, j) =>
        mk({
          title: ['Standup notes', 'Fix flaky migration test', 'Beta account check-in', 'Update launch checklist', 'Easy run 5 km', 'Read one chapter'][(i + j) % 6] ?? 'Done task',
          status: 'done', plannedFor: day,
          areaId: [aWork.id, aWork.id, aWork.id, aHealth.id, aLearn.id][(i + j) % 5],
          projectId: (i + j) % 3 === 0 ? 'proj_atlas' : undefined,
          columnId: (i + j) % 3 === 0 ? colD.id : undefined,
          estimate: [25, 45, 30, 60][(i + j) % 4],
          completedAt: Date.now() - (13 - i) * 86400000,
        }),
      );
    }),
  ];

  /* Time blocks for today ─────────────────────────────────────────── */
  const blocks: TimeBlock[] = [
    { id: uid('b'), date: today, start: 8 * 60 + 30, duration: 30, title: 'Plan the day', kind: 'ritual', hue: 'graphite' },
    { id: uid('b'), date: today, start: 9 * 60, duration: 90, title: 'Migration dry-run', kind: 'task', taskId: tMigration.id, areaId: aWork.id, hue: 'indigo' },
    { id: uid('b'), date: today, start: 11 * 60, duration: 45, title: 'PR review', kind: 'task', areaId: aWork.id, hue: 'indigo' },
    { id: uid('b'), date: today, start: 12 * 60 + 30, duration: 45, title: 'Lunch + walk', kind: 'break', hue: 'graphite' },
    { id: uid('b'), date: today, start: 13 * 60 + 30, duration: 60, title: 'Launch runbook', kind: 'task', taskId: tLaunchDoc.id, areaId: aWork.id, hue: 'indigo' },
    { id: uid('b'), date: today, start: 15 * 60, duration: 60, title: 'Team sync', kind: 'event', areaId: aWork.id, hue: 'blue' },
    { id: uid('b'), date: today, start: 17 * 60 + 30, duration: 45, title: 'Tempo run', kind: 'task', areaId: aHealth.id, hue: 'green' },
    { id: uid('b'), date: t(1), start: 9 * 60, duration: 120, title: 'Deep work: interview loop', kind: 'task', areaId: aWork.id, hue: 'indigo' },
    { id: uid('b'), date: t(1), start: 14 * 60, duration: 60, title: 'Candidate screen', kind: 'event', areaId: aWork.id, hue: 'blue' },
  ];

  /* Habits + 10 weeks of believable history ───────────────────────── */
  const habits = [
    { id: 'hab_run', name: 'Morning run', icon: '⚡', hue: 'green' as const, areaId: aHealth.id, cadence: { type: 'times-per-week' as const, times: 4 }, target: '30 min', order: 0, createdAt: created, freezes: [] as string[] },
    { id: 'hab_read', name: 'Read 20 pages', icon: '◉', hue: 'purple' as const, areaId: aLearn.id, cadence: { type: 'daily' as const }, target: '20 pages', order: 1, createdAt: created, freezes: [] as string[] },
    { id: 'hab_write', name: 'Journal', icon: '✎', hue: 'amber' as const, areaId: aLife.id, cadence: { type: 'daily' as const }, order: 2, createdAt: created, freezes: [] as string[] },
    { id: 'hab_shutdown', name: 'No screens after 22:00', icon: '☾', hue: 'indigo' as const, areaId: aHealth.id, cadence: { type: 'daily' as const }, order: 3, createdAt: created, freezes: [] as string[] },
  ];

  const habitLogs: HabitLog[] = [];
  trailingKeys(70).forEach((day, i) => {
    // Deterministic pseudo-random pattern that looks human: streaky, with gaps.
    const h = (n: number) => (i * 7 + n * 13) % 10;
    if (h(1) < 6) habitLogs.push({ habitId: 'hab_run', date: day, done: true });
    if (h(2) < 8) habitLogs.push({ habitId: 'hab_read', date: day, done: true });
    if (h(3) < 7) habitLogs.push({ habitId: 'hab_write', date: day, done: true });
    if (h(4) < 6) habitLogs.push({ habitId: 'hab_shutdown', date: day, done: true });
  });
  // Keep today's reading streak alive-but-incomplete so there is something to do.
  const todayLogs = new Set(habitLogs.filter((l) => l.date === today).map((l) => l.habitId));
  todayLogs.delete('hab_read');

  const pulses: DayPulse[] = trailingKeys(21).map((day, i) => ({
    date: day,
    mood: 3 + ((i * 5) % 3) - (i % 7 === 0 ? 1 : 0),
    energy: 2 + ((i * 3) % 3) + (i % 5 === 0 ? 1 : 0),
  }));

  /* Notes ─────────────────────────────────────────────────────────── */
  const notes = [
    {
      id: uid('n'), kind: 'note' as const, title: 'Atlas v2 — architecture decisions',
      body: 'Why we chose event-sourced migration over dual-write:\n\n1. Replayable — a failed batch can be rerun without manual cleanup.\n2. Auditable — every record carries its source offset.\n3. Testable — the staging dry-run uses the exact production path.\n\nTrade-off accepted: ~2× storage during the transition window. Revisit after launch.',
      areaId: aWork.id, projectId: 'proj_atlas', tags: ['architecture', 'launch'], pinned: true,
      createdAt: created, updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: uid('n'), kind: 'meeting' as const, title: 'Beta council — week 12',
      body: 'Attendees: Elena, Marcus, two design partners.\n\n- Migration banner confused one partner → copy fix shipped.\n- Both partners asked for CSV export before GA. Added to launch scope? → No: post-launch fast-follow.\n- NPS among beta accounts: 58 (+6).\n\nActions: runbook draft (me), export spec (Marcus).',
      areaId: aWork.id, projectId: 'proj_atlas', tags: ['meeting'],
      createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3,
    },
    {
      id: uid('n'), kind: 'journal' as const, title: 'On pace, not intensity',
      body: 'Week 9 of training and the lesson keeps repeating: the easy runs make the hard runs possible. The same is true at work — the boring daily planning ritual is what makes deep work sessions land.\n\nProtect the mornings.',
      areaId: aLife.id, tags: ['reflection'],
      createdAt: Date.now() - 86400000 * 1, updatedAt: Date.now() - 86400000 * 1,
    },
    {
      id: uid('n'), kind: 'reading' as const, title: 'Designing Data-Intensive Applications',
      body: 'Ch. 8 — distributed system faults. Key idea: partial failure is the defining property. Notes on fencing tokens → apply to the migration lock.',
      url: 'https://dataintensive.net', readingStatus: 'reading' as const,
      areaId: aLearn.id, tags: ['book', 'systems'],
      createdAt: created, updatedAt: Date.now() - 86400000 * 4,
    },
    {
      id: uid('n'), kind: 'bookmark' as const, title: 'The invisible details of interaction design',
      body: 'Long-form essay on why spring physics beat duration curves for object-like motion.',
      url: 'https://rauno.me/craft/interaction-design', areaId: aLearn.id, tags: ['design', 'craft'],
      createdAt: Date.now() - 86400000 * 6, updatedAt: Date.now() - 86400000 * 6,
    },
  ];

  /* Finance ───────────────────────────────────────────────────────── */
  const flows = [
    { id: uid('m'), name: 'Salary', amount: 8200, kind: 'income' as const, hue: 'green' as const },
    { id: uid('m'), name: 'Freelance retainer', amount: 900, kind: 'income' as const, hue: 'teal' as const },
    { id: uid('m'), name: 'Rent', amount: -1900, kind: 'fixed' as const, hue: 'indigo' as const },
    { id: uid('m'), name: 'Utilities + internet', amount: -180, kind: 'fixed' as const, hue: 'blue' as const },
    { id: uid('m'), name: 'Subscriptions', amount: -85, kind: 'fixed' as const, hue: 'purple' as const },
    { id: uid('m'), name: 'Groceries & eating out', amount: -720, kind: 'variable' as const, hue: 'amber' as const },
    { id: uid('m'), name: 'Transport', amount: -140, kind: 'variable' as const, hue: 'graphite' as const },
    { id: uid('m'), name: 'Everything else', amount: -400, kind: 'variable' as const, hue: 'rose' as const },
    { id: uid('m'), name: 'Index funds', amount: -1500, kind: 'saving' as const, hue: 'teal' as const },
    { id: uid('m'), name: 'Emergency fund', amount: -600, kind: 'saving' as const, hue: 'green' as const },
  ];

  const savings = [
    { id: uid('sv'), name: 'Emergency fund', current: 14400, target: 22800, hue: 'green' as const },
    { id: uid('sv'), name: 'Sabbatical', current: 6200, target: 30000, hue: 'purple' as const },
    { id: uid('sv'), name: 'New bike', current: 1450, target: 2200, hue: 'amber' as const },
  ];

  return {
    areas: [aWork, aHealth, aLearn, aLife, aMoney],
    goals,
    projects,
    tasks,
    blocks,
    habits,
    habitLogs: habitLogs.filter((l) => !(l.date === today && !todayLogs.has(l.habitId))),
    pulses,
    sessions: [],
    notes,
    flows,
    savings,
    reviews: [],
    shutdowns: [],
    plannedDays: [today],
  };
}

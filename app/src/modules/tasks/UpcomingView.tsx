/** Upcoming — the next two weeks, grouped by day, overdue surfaced first. */

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { TaskRow } from '@/modules/tasks/TaskRow';
import { EmptyState } from '@/ui/primitives';
import { stagger, riseIn, staggerItem } from '@/lib/motion';
import { overdueTasks, upcomingTasks } from '@/core/selectors';
import { fullDay, humanDay, todayKey } from '@/lib/dates';

export default function UpcomingView() {
  const tasks = useData((s) => s.tasks);
  const today = todayKey();

  const overdue = useMemo(() => overdueTasks(tasks, today), [tasks, today]);
  const grouped = useMemo(() => upcomingTasks(tasks, today, 14), [tasks, today]);

  const empty = overdue.length === 0 && grouped.size === 0;

  return (
    <div className="view view-narrow">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Upcoming</h2>
        <p className="view-sub">The next two weeks, exactly as committed.</p>
      </motion.header>

      {empty && (
        <EmptyState
          icon={<span aria-hidden>⤳</span>}
          title="A clear horizon"
          hint="Nothing scheduled ahead. Plan from Today or set due dates on tasks."
        />
      )}

      {overdue.length > 0 && (
        <motion.section variants={stagger()} initial="hidden" animate="show" style={{ marginBottom: 'var(--stack-gap)' }}>
          <motion.p variants={staggerItem} className="t-eyebrow" style={{ color: 'var(--danger)', marginBottom: 'var(--sp-3)' }}>
            Needs a decision · {overdue.length}
          </motion.p>
          <ul className="col panel" style={{ padding: 'var(--sp-3)', borderColor: 'var(--danger-fill)' }}>
            <AnimatePresence initial={false}>
              {overdue.map((t) => (
                <TaskRow key={t.id} task={t} showDay />
              ))}
            </AnimatePresence>
          </ul>
        </motion.section>
      )}

      <motion.div className="col g-7" variants={stagger(0.04, 0.05)} initial="hidden" animate="show">
        {[...grouped.entries()].map(([day, dayTasks]) => (
          <motion.section key={day} variants={staggerItem}>
            <div className="row g-3" style={{ marginBottom: 'var(--sp-3)' }}>
              <span className="t-body" style={{ fontWeight: 590 }}>{humanDay(day)}</span>
              <span className="t-caption ink-faint">{fullDay(day)}</span>
            </div>
            <ul className="col panel" style={{ padding: 'var(--sp-3)' }}>
              <AnimatePresence initial={false}>
                {dayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </AnimatePresence>
            </ul>
          </motion.section>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Today — the home screen. Answers "what now?", not "here is your data":
 * a greeting with the day's shape, a suggested next action with its reason,
 * the committed plan, today's schedule, and habit rings.
 */

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useSettings, useUi } from '@/core/store/ui';
import { TaskRow } from '@/modules/tasks/TaskRow';
import { Button, EmptyState, ProgressRing, Dot } from '@/ui/primitives';
import { AnimatedNumber } from '@/ui/charts';
import { stagger, staggerItem, spring, riseIn } from '@/lib/motion';
import {
  dayStats, habitDoneOn, habitExpectedOn, habitStreak, suggestNow, tasksForDay,
} from '@/core/selectors';
import { fmtClock, fmtMinutes, fullDay, minutesNow, todayKey } from '@/lib/dates';

export default function TodayView() {
  const tasks = useData((s) => s.tasks);
  const blocks = useData((s) => s.blocks);
  const habits = useData((s) => s.habits);
  const habitLogs = useData((s) => s.habitLogs);
  const toggleHabit = useData((s) => s.toggleHabit);
  const plannedDays = useData((s) => s.plannedDays);
  const shutdowns = useData((s) => s.shutdowns);
  const openOverlay = useUi((s) => s.openOverlay);
  const navigate = useUi((s) => s.navigate);
  const modules = useSettings((s) => s.modules);

  const today = todayKey();
  const dayTasks = useMemo(() => tasksForDay(tasks, today), [tasks, today]);
  const stats = useMemo(() => dayStats(tasks, today), [tasks, today]);
  const suggestion = useMemo(() => suggestNow({ tasks }, today), [tasks, today]);
  const todayBlocks = useMemo(
    () => blocks.filter((b) => b.date === today).sort((a, b) => a.start - b.start),
    [blocks, today],
  );

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const planned = plannedDays.includes(today);
  const shutdownDone = shutdowns.some((s) => s.date === today);
  const now = minutesNow();
  const activeHabits = habits.filter((h) => !h.archived && habitExpectedOn(h, today));

  return (
    <div className="view">
      <motion.header className="view-head row-start between g-6 wrap" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">{greeting}</h2>
          <p className="view-sub">{fullDay(today)}</p>
        </div>
        <div className="row g-4">
          {!planned && (
            <Button variant="primary" onClick={() => openOverlay({ kind: 'planning' })}>
              Plan today
            </Button>
          )}
          {planned && !shutdownDone && hour >= 15 && (
            <Button variant="secondary" onClick={() => openOverlay({ kind: 'shutdown' })}>
              ☾ Shutdown
            </Button>
          )}
          <div className="row g-4 panel" style={{ padding: 'var(--sp-4) var(--sp-6)' }}>
            <ProgressRing value={stats.total ? stats.done / stats.total : 0} size={36} stroke={3.5}>
              <span className="t-micro" style={{ fontWeight: 590 }}>
                {stats.total ? Math.round((stats.done / stats.total) * 100) : 0}
              </span>
            </ProgressRing>
            <div className="col">
              <span className="t-body-sm" style={{ fontWeight: 590 }}>
                <AnimatedNumber value={stats.done} />/{stats.total} done
              </span>
              <span className="t-micro ink-faint">~{fmtMinutes(Math.max(0, stats.plannedMinutes - stats.doneMinutes))} remaining</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Suggested next action — propose, never impose */}
      <AnimatePresence>
        {suggestion && (
          <motion.section
            className="panel panel-pad row g-5 wrap"
            style={{ marginBottom: 'var(--stack-gap)', borderColor: 'var(--accent-line)', background: 'var(--accent-softer)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: spring.smooth }}
            exit={{ opacity: 0, y: -6 }}
            aria-label="Suggested next task"
          >
            <div className="col g-1 spacer" style={{ minWidth: 200 }}>
              <span className="t-eyebrow" style={{ color: 'var(--accent)' }}>Up next</span>
              <span className="t-subtitle truncate">{suggestion.task.title}</span>
              <span className="t-caption ink-subtle">{suggestion.reason}</span>
            </div>
            {modules.focus && (
              <Button variant="primary" onClick={() => navigate({ view: 'focus', param: suggestion.task.id })}>
                Start focus
              </Button>
            )}
            <Button variant="ghost" onClick={() => openOverlay({ kind: 'task', taskId: suggestion.task.id })}>
              Open
            </Button>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid-3" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', alignItems: 'start' }}>
        {/* The plan */}
        <section className="panel" style={{ gridColumn: '1' }}>
          <div className="panel-head" style={{ padding: 'var(--sp-6) var(--sp-7) 0' }}>
            <h3 className="panel-title">Today’s plan</h3>
            <Button size="sm" variant="ghost" onClick={() => openOverlay({ kind: 'planning' })}>
              Edit plan
            </Button>
          </div>
          {dayTasks.length === 0 ? (
            <EmptyState
              title="No plan yet"
              hint="Run daily planning to commit a realistic set of tasks for today."
              action={<Button variant="primary" onClick={() => openOverlay({ kind: 'planning' })}>Plan today</Button>}
            />
          ) : (
            <motion.ul
              className="col"
              style={{ padding: 'var(--sp-3) var(--sp-3) var(--sp-4)' }}
              variants={stagger()}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence initial={false}>
                {dayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </section>

        <div className="col g-6">
          {/* Schedule */}
          <section className="panel panel-pad">
            <div className="panel-head">
              <h3 className="panel-title">Schedule</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate({ view: 'calendar' })}>
                Calendar →
              </Button>
            </div>
            {todayBlocks.length === 0 ? (
              <p className="t-body-sm ink-faint">No blocks today. Time-block from the calendar.</p>
            ) : (
              <motion.ul className="col g-2" variants={stagger()} initial="hidden" animate="show">
                {todayBlocks.map((b) => {
                  const past = b.start + b.duration < now;
                  const current = b.start <= now && now < b.start + b.duration;
                  return (
                    <motion.li
                      key={b.id}
                      variants={staggerItem}
                      className="row g-4"
                      style={{ minHeight: 30, opacity: past ? 0.45 : 1 }}
                    >
                      <span className="t-mono ink-faint" style={{ width: 40, flex: 'none' }}>
                        {fmtClock(b.start)}
                      </span>
                      <Dot hue={b.hue ?? 'graphite'} />
                      <span className="t-body-sm truncate spacer" style={current ? { fontWeight: 590 } : undefined}>
                        {b.title}
                      </span>
                      {current && (
                        <motion.span
                          className="t-micro"
                          style={{ color: 'var(--accent)', fontWeight: 590 }}
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2.4 }}
                        >
                          now
                        </motion.span>
                      )}
                      <span className="t-micro ink-faint">{fmtMinutes(b.duration)}</span>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </section>

          {/* Habits */}
          {modules.habits && activeHabits.length > 0 && (
            <section className="panel panel-pad">
              <div className="panel-head">
                <h3 className="panel-title">Habits</h3>
                <Button size="sm" variant="ghost" onClick={() => navigate({ view: 'habits' })}>
                  All →
                </Button>
              </div>
              <motion.ul className="col g-3" variants={stagger()} initial="hidden" animate="show">
                {activeHabits.map((h) => {
                  const done = habitDoneOn(habitLogs, h.id, today);
                  const streak = habitStreak(h, habitLogs);
                  return (
                    <motion.li key={h.id} variants={staggerItem} className="row g-4" style={{ minHeight: 34 }}>
                      <motion.button
                        className="iconbtn iconbtn-md"
                        aria-pressed={done}
                        aria-label={`${h.name}${done ? ' — done' : ''}`}
                        onClick={() => toggleHabit(h.id, today)}
                        whileTap={{ scale: 0.8 }}
                        transition={spring.bouncy}
                        style={{
                          background: done ? `var(--hue-${h.hue})` : 'var(--fill-subtle)',
                          color: done ? '#fff' : 'var(--ink-subtle)',
                          borderRadius: 'var(--r-full)',
                        }}
                      >
                        {h.icon}
                      </motion.button>
                      <span className="t-body-sm spacer truncate" style={done ? { color: 'var(--ink-faint)' } : undefined}>
                        {h.name}
                      </span>
                      {streak > 1 && (
                        <span className="t-micro ink-faint" title={`${streak}-day streak`}>
                          {streak}⚡
                        </span>
                      )}
                    </motion.li>
                  );
                })}
              </motion.ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

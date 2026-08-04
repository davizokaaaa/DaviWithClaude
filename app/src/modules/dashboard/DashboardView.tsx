/**
 * Executive dashboard. Measures output and follow-through — completion,
 * focus hours, goal movement, ritual consistency — never how much structure
 * exists (the anti-"pseudo-productivity" stance from the research).
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Dot, ProgressRing } from '@/ui/primitives';
import { AnimatedNumber, Bars, Sparkline } from '@/ui/charts';
import { riseIn, stagger, staggerItem } from '@/lib/motion';
import { completionTrend, focusMinutesTrend, goalProgress, habitConsistency } from '@/core/selectors';
import { fmtMinutes, todayKey, trailingKeys } from '@/lib/dates';

export default function DashboardView() {
  const tasks = useData((s) => s.tasks);
  const sessions = useData((s) => s.sessions);
  const goals = useData((s) => s.goals);
  const areas = useData((s) => s.areas);
  const habits = useData((s) => s.habits);
  const habitLogs = useData((s) => s.habitLogs);
  const shutdowns = useData((s) => s.shutdowns);
  const plannedDays = useData((s) => s.plannedDays);
  const pulses = useData((s) => s.pulses);
  const navigate = useUi((s) => s.navigate);

  const completion = useMemo(() => completionTrend(tasks, 14), [tasks]);
  const focusTrend = useMemo(() => focusMinutesTrend(sessions, 14), [sessions]);

  const week = useMemo(() => {
    const last7 = completion.slice(-7).reduce((s, p) => s + p.value, 0);
    const prev7 = completion.slice(0, 7).reduce((s, p) => s + p.value, 0);
    return { last7, delta: last7 - prev7 };
  }, [completion]);

  const focusWeekMin = focusTrend.slice(-7).reduce((s, p) => s + p.value, 0);

  const ritualRate = useMemo(() => {
    const days = trailingKeys(14);
    const planned = days.filter((d) => plannedDays.includes(d)).length;
    const shut = days.filter((d) => shutdowns.some((s) => s.date === d)).length;
    return Math.round(((planned + shut) / (days.length * 2)) * 100);
  }, [plannedDays, shutdowns]);

  const habitAvg = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    if (!active.length) return 0;
    return active.reduce((s, h) => s + habitConsistency(h, habitLogs, 30), 0) / active.length;
  }, [habits, habitLogs]);

  const moodTrend = useMemo(
    () => trailingKeys(14).map((d) => pulses.find((p) => p.date === d)?.mood ?? 0),
    [pulses],
  );

  const openToday = tasks.filter((t) => t.plannedFor === todayKey() && t.status !== 'done' && t.status !== 'dropped').length;

  return (
    <div className="view">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Dashboard</h2>
        <p className="view-sub">Follow-through, not busyness.</p>
      </motion.header>

      <motion.div className="grid-4" style={{ marginBottom: 'var(--stack-gap)' }} variants={stagger(0.02, 0.05)} initial="hidden" animate="show">
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value"><AnimatedNumber value={week.last7} /></span>
          <span className="stat-label">tasks done · 7 days</span>
          <span className={`stat-delta ${week.delta >= 0 ? 'is-up' : 'is-down'}`}>
            {week.delta >= 0 ? '▲' : '▼'} {Math.abs(week.delta)} vs prior week
          </span>
        </motion.div>
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value">
            <AnimatedNumber value={focusWeekMin} format={(n) => fmtMinutes(Math.round(n))} />
          </span>
          <span className="stat-label">focused time · 7 days</span>
        </motion.div>
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value"><AnimatedNumber value={ritualRate} format={(n) => `${Math.round(n)}%`} /></span>
          <span className="stat-label">planning + shutdown kept</span>
        </motion.div>
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value"><AnimatedNumber value={Math.round(habitAvg * 100)} format={(n) => `${Math.round(n)}%`} /></span>
          <span className="stat-label">habit consistency · 30 days</span>
        </motion.div>
      </motion.div>

      <div className="grid-2" style={{ marginBottom: 'var(--stack-gap)', alignItems: 'start' }}>
        <motion.section className="panel panel-pad" variants={riseIn} initial="hidden" animate="show">
          <div className="panel-head">
            <h3 className="panel-title">Completions</h3>
            <span className="t-caption ink-faint">14 days</span>
          </div>
          <Bars data={completion.map((p) => p.value)} labels={['2w ago', 'today']} height={80} />
        </motion.section>
        <motion.section className="panel panel-pad" variants={riseIn} initial="hidden" animate="show">
          <div className="panel-head">
            <h3 className="panel-title">Mood</h3>
            <span className="t-caption ink-faint">14 days · logged at shutdown</span>
          </div>
          <Sparkline points={moodTrend} hue="teal" height={80} />
        </motion.section>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <motion.section className="panel panel-pad" variants={riseIn} initial="hidden" animate="show">
          <div className="panel-head">
            <h3 className="panel-title">Goal movement</h3>
            <button className="t-caption ink-faint" onClick={() => navigate({ view: 'goals' })}>All →</button>
          </div>
          <div className="col g-5">
            {goals.slice(0, 4).map((g) => {
              const p = goalProgress(g);
              const area = areas.find((a) => a.id === g.areaId);
              return (
                <div key={g.id} className="row g-5">
                  <ProgressRing value={p} size={38} stroke={3.5} hue={area?.hue}>
                    <span className="t-micro" style={{ fontWeight: 590 }}>{Math.round(p * 100)}</span>
                  </ProgressRing>
                  <div className="col spacer" style={{ minWidth: 0 }}>
                    <span className="t-body-sm truncate" style={{ fontWeight: 500 }}>{g.name}</span>
                    <span className="t-micro ink-faint row g-2">
                      {area && <Dot hue={area.hue} />}
                      {g.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section className="panel panel-pad" variants={riseIn} initial="hidden" animate="show">
          <div className="panel-head"><h3 className="panel-title">Right now</h3></div>
          <div className="col g-4 t-body-sm ink-muted">
            <p>
              <strong style={{ color: 'var(--ink)' }}>{openToday}</strong> task{openToday !== 1 ? 's' : ''} left on today’s plan.
            </p>
            <p>
              {plannedDays.includes(todayKey())
                ? 'Today was planned deliberately — the system is working.'
                : 'Today has no committed plan yet. Two minutes of planning beats a day of reacting.'}
            </p>
            <p>
              {shutdowns.some((s) => s.date === todayKey())
                ? 'Shutdown complete. The evening is yours.'
                : 'End with a shutdown so tomorrow starts clean.'}
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

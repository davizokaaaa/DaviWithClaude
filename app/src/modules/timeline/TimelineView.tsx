/** Timeline — Gantt-style view of projects against their target dates. */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Dot } from '@/ui/primitives';
import { riseIn, spring, stagger, staggerItem } from '@/lib/motion';
import { addDaysKey, daysUntil, fromKey, humanDay, todayKey, format } from '@/lib/dates';

export default function TimelineView() {
  const projects = useData((s) => s.projects);
  const tasks = useData((s) => s.tasks);
  const navigate = useUi((s) => s.navigate);

  const today = todayKey();
  const horizon = 90; // days shown
  const start = addDaysKey(today, -14);

  const rows = useMemo(
    () =>
      projects
        .filter((p) => p.status === 'active' || p.status === 'planned')
        .map((p) => {
          const end = p.targetDate ?? addDaysKey(today, 30);
          const created = format(new Date(p.createdAt), 'yyyy-MM-dd');
          const from = created < start ? start : created;
          const projTasks = tasks.filter((t) => t.projectId === p.id && t.status !== 'dropped');
          const done = projTasks.filter((t) => t.status === 'done').length;
          return {
            project: p,
            from,
            to: end,
            progress: projTasks.length ? done / projTasks.length : 0,
          };
        })
        .sort((a, b) => (a.to < b.to ? -1 : 1)),
    [projects, tasks, today, start],
  );

  const dayOffset = (k: string) => (fromKey(k).getTime() - fromKey(start).getTime()) / 86400000;
  const pct = (k: string) => `${Math.max(0, Math.min(100, (dayOffset(k) / horizon) * 100))}%`;

  return (
    <div className="view">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Timeline</h2>
        <p className="view-sub">Projetos contra suas linhas de chegada, próximos {horizon} dias.</p>
      </motion.header>

      <motion.section className="panel panel-pad gantt" variants={stagger(0.03, 0.05)} initial="hidden" animate="show">
        <div className="gantt-inner col g-2">
          <div className="gantt-row" aria-hidden>
            <span className="gantt-name" />
            <div className="gantt-track" style={{ background: 'none' }}>
              <span className="gantt-today" style={{ left: pct(today) }} />
              <span className="t-micro ink-faint" style={{ position: 'absolute', left: pct(today), translate: '6px -2px' }}>
                hoje
              </span>
            </div>
          </div>
          {rows.map(({ project: p, from, to, progress }) => {
            const overdue = daysUntil(to) < 0 && progress < 1;
            return (
              <motion.button
                key={p.id}
                variants={staggerItem}
                className="gantt-row"
                style={{ textAlign: 'left', borderRadius: 'var(--r-md)' }}
                onClick={() => navigate({ view: 'project', param: p.id })}
              >
                <span className="gantt-name row g-3">
                  <Dot hue={p.hue} />
                  <span className="t-body-sm truncate" style={{ fontWeight: 500 }}>{p.name}</span>
                </span>
                <span className="gantt-track">
                  <span className="gantt-today" style={{ left: pct(today) }} aria-hidden />
                  <motion.span
                    className="gantt-bar"
                    style={{
                      left: pct(from),
                      width: `calc(${pct(to)} - ${pct(from)})`,
                      background: `color-mix(in oklab, var(--hue-${p.hue}) 22%, var(--chart-track))`,
                      border: `1px solid color-mix(in oklab, var(--hue-${p.hue}) 45%, transparent)`,
                    }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={spring.smooth}
                  >
                    <motion.span
                      className="gantt-bar"
                      style={{ left: 0, background: `var(--hue-${p.hue})`, opacity: 0.85 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={spring.measured}
                    />
                  </motion.span>
                </span>
                <span className="t-caption ink-faint" style={{ flex: 'none', width: 84, textAlign: 'right', color: overdue ? 'var(--danger)' : undefined }}>
                  {p.targetDate ? humanDay(to) : 'sem data'}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}

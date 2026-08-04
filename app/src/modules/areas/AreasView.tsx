/** Life Areas — where attention actually went vs. where it was meant to go. */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { Dot } from '@/ui/primitives';
import { DistributionBar } from '@/ui/charts';
import { riseIn, stagger, staggerItem } from '@/lib/motion';
import { areaLoad } from '@/core/selectors';
import { fmtMinutes } from '@/lib/dates';

export default function AreasView() {
  const areas = useData((s) => s.areas);
  const blocks = useData((s) => s.blocks);
  const goals = useData((s) => s.goals);
  const projects = useData((s) => s.projects);
  const tasks = useData((s) => s.tasks);

  const load = useMemo(() => areaLoad({ blocks, areas }, 7), [blocks, areas]);
  const totalPlanned = [...load.values()].reduce((s, v) => s + v, 0);

  return (
    <div className="view view-narrow">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Life Areas</h2>
        <p className="view-sub">The week’s attention, area by area — intention vs. reality.</p>
      </motion.header>

      {totalPlanned > 0 && (
        <motion.section className="panel panel-pad" style={{ marginBottom: 'var(--stack-gap)' }} variants={riseIn} initial="hidden" animate="show">
          <div className="panel-head"><h3 className="panel-title">This week’s balance</h3></div>
          <DistributionBar
            segments={areas
              .filter((a) => (load.get(a.id) ?? 0) > 0)
              .map((a) => ({ label: a.name, value: load.get(a.id) ?? 0, hue: a.hue }))}
          />
          <div className="row g-5 wrap" style={{ marginTop: 'var(--sp-4)' }}>
            {areas.map((a) => {
              const v = load.get(a.id) ?? 0;
              if (!v) return null;
              return (
                <span key={a.id} className="row g-2 t-caption ink-subtle">
                  <Dot hue={a.hue} />
                  {a.name} · {fmtMinutes(v)}
                </span>
              );
            })}
          </div>
        </motion.section>
      )}

      <motion.div className="grid-2" variants={stagger(0.02, 0.05)} initial="hidden" animate="show">
        {areas.map((a) => {
          const areaGoals = goals.filter((g) => g.areaId === a.id);
          const areaProjects = projects.filter((p) => p.areaId === a.id && p.status === 'active');
          const openTasks = tasks.filter((t) => t.areaId === a.id && t.status !== 'done' && t.status !== 'dropped').length;
          const weekMinutes = load.get(a.id) ?? 0;
          const intended = (a.intendedHours ?? 0) * 60;
          return (
            <motion.section key={a.id} variants={staggerItem} className="panel panel-pad col g-4">
              <div className="row g-4">
                <span
                  style={{
                    width: 34, height: 34, borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center',
                    background: `color-mix(in oklab, var(--hue-${a.hue}) 18%, transparent)`,
                    color: `var(--hue-${a.hue})`, fontSize: 14, flex: 'none',
                  }}
                  aria-hidden
                >
                  {a.icon}
                </span>
                <div className="col">
                  <span className="t-subtitle">{a.name}</span>
                  <span className="t-micro ink-faint">
                    {fmtMinutes(weekMinutes)} this week{intended > 0 && ` · intent ${fmtMinutes(intended)}`}
                  </span>
                </div>
              </div>
              <div className="row g-5 t-caption ink-subtle wrap">
                <span>{areaProjects.length} active project{areaProjects.length !== 1 ? 's' : ''}</span>
                <span>{areaGoals.length} goal{areaGoals.length !== 1 ? 's' : ''}</span>
                <span>{openTasks} open task{openTasks !== 1 ? 's' : ''}</span>
              </div>
              {intended > 0 && weekMinutes < intended * 0.5 && (
                <p className="t-caption" style={{ color: 'var(--warning)' }}>
                  Running well under intention this week.
                </p>
              )}
            </motion.section>
          );
        })}
      </motion.div>
    </div>
  );
}

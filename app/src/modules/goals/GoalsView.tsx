/** Goals & OKRs — key results editable inline; progress is computed, never typed. */

import { motion } from 'motion/react';
import clsx from 'clsx';
import { useData } from '@/core/store/data';
import { Dot, ProgressBar, ProgressRing } from '@/ui/primitives';
import { AnimatedNumber } from '@/ui/charts';
import { riseIn, stagger, staggerItem } from '@/lib/motion';
import { goalProgress } from '@/core/selectors';
import { humanDay } from '@/lib/dates';
import type { GoalStatus } from '@/core/types';

const STATUS_META: Record<GoalStatus, { label: string; color: string }> = {
  'on-track': { label: 'On track', color: 'var(--success)' },
  'at-risk': { label: 'At risk', color: 'var(--warning)' },
  behind: { label: 'Behind', color: 'var(--danger)' },
  achieved: { label: 'Achieved', color: 'var(--success)' },
  paused: { label: 'Paused', color: 'var(--ink-faint)' },
};

export default function GoalsView() {
  const goals = useData((s) => s.goals);
  const areas = useData((s) => s.areas);
  const projects = useData((s) => s.projects);
  const updateKeyResult = useData((s) => s.updateKeyResult);

  return (
    <div className="view view-narrow">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Goals</h2>
        <p className="view-sub">Direction first. Progress is measured by key results, not vibes.</p>
      </motion.header>

      <motion.div className="col g-6" variants={stagger(0.02, 0.06)} initial="hidden" animate="show">
        {goals.map((g) => {
          const progress = goalProgress(g);
          const area = areas.find((a) => a.id === g.areaId);
          const linked = projects.filter((p) => p.goalId === g.id);
          const meta = STATUS_META[g.status];
          return (
            <motion.section key={g.id} variants={staggerItem} className="panel panel-pad">
              <div className="row-start g-6">
                <ProgressRing value={progress} size={52} stroke={4} hue={area?.hue}>
                  <span className="t-caption" style={{ fontWeight: 590 }}>
                    <AnimatedNumber value={Math.round(progress * 100)} />
                  </span>
                </ProgressRing>
                <div className="col g-1 spacer" style={{ minWidth: 0 }}>
                  <div className="row g-4 wrap">
                    <h3 className="t-subtitle">{g.name}</h3>
                    <span className="t-micro" style={{ color: meta.color, fontWeight: 590 }}>{meta.label}</span>
                  </div>
                  {g.why && <p className="t-body-sm ink-subtle">{g.why}</p>}
                  <div className="row g-4 t-caption ink-faint wrap">
                    {area && (
                      <span className="row g-2"><Dot hue={area.hue} />{area.name}</span>
                    )}
                    <span>{g.horizon === 'quarter' ? 'This quarter' : g.horizon === 'year' ? 'This year' : 'Long-term'}</span>
                    {g.targetDate && <span>→ {humanDay(g.targetDate)}</span>}
                    {linked.length > 0 && <span>{linked.length} linked project{linked.length > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </div>

              <div className="col g-4" style={{ marginTop: 'var(--sp-6)' }}>
                {g.keyResults.map((kr) => {
                  const span = kr.target - kr.start;
                  const p = span === 0 ? 1 : Math.max(0, Math.min(1, (kr.current - kr.start) / span));
                  return (
                    <div key={kr.id} className="col g-2">
                      <div className="row between g-4">
                        <span className="t-body-sm truncate">{kr.name}</span>
                        <span className={clsx('t-caption', 'row', 'g-2')} style={{ flex: 'none' }}>
                          <input
                            className="input"
                            style={{ width: 76, height: 24, textAlign: 'right', padding: '0 8px', fontSize: 12 }}
                            type="number"
                            step="any"
                            aria-label={`Current value for ${kr.name}`}
                            value={kr.current}
                            onChange={(e) => updateKeyResult(g.id, kr.id, Number(e.target.value))}
                          />
                          <span className="ink-faint" style={{ alignSelf: 'center' }}>
                            / {kr.target}{kr.unit ?? ''}
                          </span>
                        </span>
                      </div>
                      <ProgressBar value={p} hue={area?.hue} />
                    </div>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </motion.div>
    </div>
  );
}

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
import { reveal, riseIn, stagger, staggerItem } from '@/lib/motion';
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
        <h2 className="view-title">Painel</h2>
        <p className="view-sub">Entrega, não ocupação.</p>
      </motion.header>

      <motion.div className="grid-4" style={{ marginBottom: 'var(--stack-gap)' }} variants={stagger(0.02, 0.05)} initial="hidden" animate="show">
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value"><AnimatedNumber value={week.last7} /></span>
          <span className="stat-label">tarefas feitas · 7 dias</span>
          <span className={`stat-delta ${week.delta >= 0 ? 'is-up' : 'is-down'}`}>
            {week.delta >= 0 ? '▲' : '▼'} {Math.abs(week.delta)} vs semana anterior
          </span>
        </motion.div>
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value">
            <AnimatedNumber value={focusWeekMin} format={(n) => fmtMinutes(Math.round(n))} />
          </span>
          <span className="stat-label">tempo focado · 7 dias</span>
        </motion.div>
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value"><AnimatedNumber value={ritualRate} format={(n) => `${Math.round(n)}%`} /></span>
          <span className="stat-label">planejamento + encerramento mantidos</span>
        </motion.div>
        <motion.div variants={staggerItem} className="panel panel-pad stat">
          <span className="stat-value"><AnimatedNumber value={Math.round(habitAvg * 100)} format={(n) => `${Math.round(n)}%`} /></span>
          <span className="stat-label">consistência de hábitos · 30 dias</span>
        </motion.div>
      </motion.div>

      <div className="grid-2" style={{ marginBottom: 'var(--stack-gap)', alignItems: 'start' }}>
        <motion.section className="panel panel-pad" {...reveal}>
          <div className="panel-head">
            <h3 className="panel-title">Conclusões</h3>
            <span className="t-caption ink-faint">14 dias</span>
          </div>
          <Bars data={completion.map((p) => p.value)} labels={['há 2 sem', 'hoje']} height={80} />
        </motion.section>
        <motion.section className="panel panel-pad" {...reveal}>
          <div className="panel-head">
            <h3 className="panel-title">Humor</h3>
            <span className="t-caption ink-faint">14 dias · registrado no encerramento</span>
          </div>
          <Sparkline points={moodTrend} hue="teal" height={80} />
        </motion.section>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <motion.section className="panel panel-pad" {...reveal}>
          <div className="panel-head">
            <h3 className="panel-title">Movimento das metas</h3>
            <button className="t-caption ink-faint" onClick={() => navigate({ view: 'goals' })}>Todas →</button>
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
                      {({ 'on-track': 'no rumo', 'at-risk': 'em risco', behind: 'atrasada', achieved: 'alcançada', paused: 'pausada' } as const)[g.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section className="panel panel-pad" {...reveal}>
          <div className="panel-head"><h3 className="panel-title">Agora mesmo</h3></div>
          <div className="col g-4 t-body-sm ink-muted">
            <p>
              <strong style={{ color: 'var(--ink)' }}>{openToday}</strong> tarefa{openToday !== 1 ? 's' : ''} no plano de hoje.
            </p>
            <p>
              {plannedDays.includes(todayKey())
                ? 'Hoje foi planejado deliberadamente — o sistema está funcionando.'
                : 'Hoje ainda não tem plano assumido. Dois minutos de planejamento valem mais que um dia reagindo.'}
            </p>
            <p>
              {shutdowns.some((s) => s.date === todayKey())
                ? 'Encerramento feito. A noite é sua.'
                : 'Termine com um encerramento para amanhã começar limpo.'}
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

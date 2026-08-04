/**
 * Daily Planning & Shutdown rituals.
 *
 * Research (notes/personal-os-research.md §3): Sunsama's shutdown is the
 * single feature users credit with changing their work-life balance. Planning
 * pulls candidates in front of the user and asks for a *realistic* commitment;
 * shutdown forces an explicit decision for every unfinished task — carry,
 * reschedule, or drop — so the day ends closed, not abandoned.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog } from '@/ui/overlays';
import { Button, Checkbox, EmptyState } from '@/ui/primitives';
import { AnimatedNumber } from '@/ui/charts';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { fade, spring, stagger, staggerItem } from '@/lib/motion';
import { byPriorityThenOrder, isOpen } from '@/core/selectors';
import { addDaysKey, fmtMinutes, todayKey } from '@/lib/dates';
import type { Task } from '@/core/types';

/* ── Planning ────────────────────────────────────────────────────────── */

export function PlanningRitual() {
  const overlay = useUi((s) => s.overlay);
  const open = overlay?.kind === 'planning';
  const close = useUi((s) => s.closeOverlay);
  const toast = useUi((s) => s.toast);

  const tasks = useData((s) => s.tasks);
  const planTask = useData((s) => s.planTask);
  const markDayPlanned = useData((s) => s.markDayPlanned);

  const today = todayKey();

  /** Candidates: already planned + overdue + due soon + top inbox picks. */
  const candidates = useMemo(() => {
    if (!open) return [];
    const soon = addDaysKey(today, 3);
    const set = new Map<string, Task>();
    for (const t of tasks) {
      if (!isOpen(t)) continue;
      const planned = t.plannedFor === today;
      const overdue = (t.plannedFor && t.plannedFor < today) || (t.dueDate && t.dueDate < today);
      const dueSoon = t.dueDate && t.dueDate <= soon;
      if (planned || overdue || dueSoon) set.set(t.id, t);
    }
    for (const t of tasks.filter((x) => x.status === 'inbox').slice(0, 5)) set.set(t.id, t);
    return [...set.values()].sort(byPriorityThenOrder);
  }, [open, tasks, today]);

  const committedIds = candidates.filter((t) => t.plannedFor === today).map((t) => t.id);
  const committedMinutes = candidates
    .filter((t) => t.plannedFor === today)
    .reduce((s, t) => s + (t.estimate ?? 30), 0);

  // A day over ~6h of task work is a plan that will fail. Say so, gently.
  const overloaded = committedMinutes > 360;

  const finish = () => {
    markDayPlanned(today);
    toast({ message: `Dia planejado — ${committedIds.length} tarefas, ~${fmtMinutes(committedMinutes)}`, kind: 'success' });
    close();
  };

  return (
    <Dialog open={open} onClose={close} title="Planejar o dia" width={540}>
      <p className="t-body-sm ink-subtle" style={{ marginTop: -10, marginBottom: 18 }}>
        Escolha o que realmente cabe no dia de hoje. Todo o resto fica guardado onde está.
      </p>

      {candidates.length === 0 ? (
        <EmptyState title="Nada esperando" hint="Capture algo primeiro, ou aproveite o silêncio." />
      ) : (
        <motion.ul className="col g-1" variants={stagger()} initial="hidden" animate="show">
          {candidates.map((t) => {
            const committed = t.plannedFor === today;
            return (
              <motion.li
                key={t.id}
                variants={staggerItem}
                layout
                className="trow"
                style={{ cursor: 'pointer' }}
                onClick={() => planTask(t.id, committed ? undefined : today)}
              >
                <Checkbox checked={committed} onChange={() => planTask(t.id, committed ? undefined : today)} label={`Assumir ${t.title}`} />
                <span className="trow-title truncate spacer">{t.title}</span>
                <span className="trow-meta">
                  {t.status === 'inbox' && <span>entrada</span>}
                  {t.dueDate && t.dueDate < today && <span style={{ color: 'var(--danger)' }}>atrasada</span>}
                  {t.estimate != null && <span>{fmtMinutes(t.estimate)}</span>}
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      <div className="row between" style={{ marginTop: 20 }}>
        <div className="col g-1">
          <span className="t-caption ink-faint">Assumidas</span>
          <span className="t-subtitle" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedNumber value={committedIds.length} /> tarefas · ~{fmtMinutes(committedMinutes)}
          </span>
          <AnimatePresence>
            {overloaded && (
              <motion.span
                className="t-caption"
                style={{ color: 'var(--warning)' }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={fade.base}
              >
                Isso já é um dia cheio antes das reuniões — considere enxugar.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <Button variant="primary" onClick={finish}>Assumir o plano</Button>
      </div>
    </Dialog>
  );
}

/* ── Shutdown ────────────────────────────────────────────────────────── */

type Decision = 'carry' | 'reschedule' | 'drop';

export function ShutdownRitual() {
  const overlay = useUi((s) => s.overlay);
  const open = overlay?.kind === 'shutdown';
  const close = useUi((s) => s.closeOverlay);
  const toast = useUi((s) => s.toast);

  const tasks = useData((s) => s.tasks);
  const planTask = useData((s) => s.planTask);
  const dropTask = useData((s) => s.dropTask);
  const logPulse = useData((s) => s.logPulse);
  const recordShutdown = useData((s) => s.recordShutdown);

  const today = todayKey();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);

  const unfinished = useMemo(
    () => (open ? tasks.filter((t) => t.plannedFor === today && isOpen(t)) : []),
    [open, tasks, today],
  );
  const doneToday = tasks.filter((t) => t.plannedFor === today && t.status === 'done').length;

  const finish = () => {
    let carried = 0;
    let rescheduled = 0;
    let dropped = 0;
    for (const t of unfinished) {
      const d = decisions[t.id] ?? 'carry';
      if (d === 'carry') {
        planTask(t.id, addDaysKey(today, 1));
        carried++;
      } else if (d === 'reschedule') {
        planTask(t.id, addDaysKey(today, 3));
        rescheduled++;
      } else {
        dropTask(t.id);
        dropped++;
      }
    }
    if (mood || energy) logPulse({ date: today, mood: mood || undefined, energy: energy || undefined });
    recordShutdown({ date: today, completedAt: Date.now(), carried, rescheduled, dropped });
    toast({ message: 'Dia encerrado. Nada ficou no ar.', kind: 'success' });
    close();
  };

  return (
    <Dialog open={open} onClose={close} title="Encerramento do dia" width={540}>
      <motion.div
        className="row g-6"
        style={{ marginBottom: 20 }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.smooth}
      >
        <div className="stat">
          <span className="stat-value"><AnimatedNumber value={doneToday} /></span>
          <span className="stat-label">concluídas hoje</span>
        </div>
        <div className="stat">
          <span className="stat-value"><AnimatedNumber value={unfinished.length} /></span>
          <span className="stat-label">a decidir</span>
        </div>
      </motion.div>

      {unfinished.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <p className="t-caption ink-subtle" style={{ marginBottom: 10 }}>
            Decida uma a uma — levar para amanhã, adiar alguns dias, ou soltar.
          </p>
          <motion.ul className="col g-2" variants={stagger()} initial="hidden" animate="show">
            {unfinished.map((t) => {
              const d = decisions[t.id] ?? 'carry';
              return (
                <motion.li key={t.id} variants={staggerItem} className="row g-4" style={{ minHeight: 34 }}>
                  <span className="t-body truncate spacer">{t.title}</span>
                  <div className="segmented" role="tablist" aria-label={`Decisão para ${t.title}`}>
                    {(['carry', 'reschedule', 'drop'] as Decision[]).map((opt) => (
                      <button
                        key={opt}
                        role="tab"
                        aria-selected={d === opt}
                        className={`segmented-item ${d === opt ? 'is-active' : ''}`}
                        onClick={() => setDecisions((prev) => ({ ...prev, [t.id]: opt }))}
                      >
                        {d === opt && (
                          <motion.span className="segmented-thumb" layoutId={`shut:${t.id}`} transition={spring.snappy} />
                        )}
                        <span className="segmented-label">
                          {opt === 'carry' ? 'Amanhã' : opt === 'reschedule' ? 'Depois' : 'Soltar'}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </section>
      )}

      <section className="grid-2" style={{ gap: 'var(--sp-6)', marginBottom: 20 }}>
        <PulsePicker label="Como foi o seu humor?" value={mood} onChange={setMood} glyphs={['☹', '◔', '−', '◑', '☺']} />
        <PulsePicker label="Nível de energia?" value={energy} onChange={setEnergy} glyphs={['▁', '▂', '▄', '▆', '█']} />
      </section>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={finish}>Encerrar o dia</Button>
      </div>
    </Dialog>
  );
}

function PulsePicker({
  label,
  value,
  onChange,
  glyphs,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  glyphs: string[];
}) {
  return (
    <div className="col g-3">
      <span className="field-label">{label}</span>
      <div className="row g-2" role="radiogroup" aria-label={label}>
        {glyphs.map((g, i) => {
          const v = i + 1;
          const active = value === v;
          return (
            <motion.button
              key={v}
              role="radio"
              aria-checked={active}
              aria-label={`${v} de 5`}
              className="iconbtn iconbtn-lg"
              style={active ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
              onClick={() => onChange(active ? 0 : v)}
              whileTap={{ scale: 0.85 }}
              transition={spring.bouncy}
            >
              {g}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

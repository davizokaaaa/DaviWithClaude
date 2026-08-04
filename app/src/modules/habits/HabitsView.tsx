/**
 * Habits — week grid + streaks + 16-week heatmap. Forgiving by design:
 * streak freezes exist because punitive streaks are the documented failure
 * mode of habit gamification (see notes/personal-os-research.md §3).
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Button, Input, ProgressRing, Select } from '@/ui/primitives';
import { Dialog } from '@/ui/overlays';
import { Heatmap } from '@/ui/charts';
import { riseIn, spring, stagger, staggerItem } from '@/lib/motion';
import { habitConsistency, habitDoneOn, habitStreak } from '@/core/selectors';
import { format, fromKey, todayKey, trailingKeys, weekKeys } from '@/lib/dates';
import type { Hue } from '@/core/types';

export default function HabitsView() {
  const allHabits = useData((s) => s.habits);
  // Derive outside the selector: a selector returning a fresh array on every
  // snapshot makes useSyncExternalStore loop (React #185).
  const habits = useMemo(
    () => allHabits.filter((h) => !h.archived).sort((a, b) => a.order - b.order),
    [allHabits],
  );
  const habitLogs = useData((s) => s.habitLogs);
  const toggleHabit = useData((s) => s.toggleHabit);
  const freezeHabit = useData((s) => s.freezeHabit);
  const addHabit = useData((s) => s.addHabit);
  const toast = useUi((s) => s.toast);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [hue, setHue] = useState<Hue>('green');
  const [selected, setSelected] = useState<string | null>(null);

  const today = todayKey();
  const week = useMemo(() => weekKeys(), []);
  const heatDays = useMemo(() => trailingKeys(16 * 7), []);
  const selectedHabit = habits.find((h) => h.id === selected) ?? habits[0];

  return (
    <div className="view view-narrow">
      <motion.header className="view-head row between g-4" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Habits</h2>
          <p className="view-sub">Pequenas coisas, mantidas. Congelamentos protegem a sequência num dia ruim.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Novo hábito</Button>
      </motion.header>

      <motion.section className="panel" variants={stagger()} initial="hidden" animate="show">
        {habits.map((h) => {
          const streak = habitStreak(h, habitLogs);
          const consistency = habitConsistency(h, habitLogs, 30);
          return (
            <motion.div key={h.id} variants={staggerItem} className="habit-row">
              <button className="row g-4" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => setSelected(h.id)}>
                <ProgressRing value={consistency} size={34} stroke={3} hue={h.hue}>
                  <span style={{ fontSize: 12 }}>{h.icon}</span>
                </ProgressRing>
                <div className="col" style={{ minWidth: 0 }}>
                  <span className="t-body truncate" style={{ fontWeight: 500 }}>{h.name}</span>
                  <span className="t-micro ink-faint">
                    {streak > 0 ? `sequência de ${streak} dias` : 'sem sequência ainda'} · {Math.round(consistency * 100)}% no mês
                  </span>
                </div>
              </button>
              <div className="habit-week" role="group" aria-label={`${h.name} nesta semana`}>
                {week.map((day) => {
                  const done = habitDoneOn(habitLogs, h.id, day);
                  const frozen = h.freezes.includes(day);
                  const future = day > today;
                  return (
                    <motion.button
                      key={day}
                      className={clsx('habit-cell', done && 'is-done', frozen && !done && 'is-frozen', future && 'is-future')}
                      style={done ? { background: `var(--hue-${h.hue})` } : undefined}
                      aria-label={`${h.name} em ${format(fromKey(day), 'EEE d')}${done ? ' — feito' : frozen ? ' — congelado' : ''}`}
                      aria-pressed={done}
                      title={`${format(fromKey(day), 'EEE d')}${frozen ? ' · congelado' : ''}`}
                      onClick={() => !future && toggleHabit(h.id, day)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!future && !done) {
                          freezeHabit(h.id, day);
                          toast({ message: 'Dia congelado — sequência protegida', kind: 'success' });
                        }
                      }}
                      whileTap={{ scale: 0.8 }}
                      transition={spring.bouncy}
                    >
                      {done ? '✓' : frozen ? '❄' : '·'}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.section>

      {selectedHabit && (
        <motion.section
          className="panel panel-pad"
          style={{ marginTop: 'var(--stack-gap)' }}
          variants={riseIn}
          initial="hidden"
          animate="show"
        >
          <div className="panel-head">
            <h3 className="panel-title">{selectedHabit.name} — últimas 16 semanas</h3>
            <span className="t-caption ink-faint">clique com o botão direito para congelar um dia</span>
          </div>
          <Heatmap
            days={heatDays}
            hue={selectedHabit.hue}
            value={(d) => (habitDoneOn(habitLogs, selectedHabit.id, d) ? 1 : 0)}
          />
        </motion.section>
      )}

      <Dialog open={adding} onClose={() => setAdding(false)} title="Novo hábito" width={380}>
        <div className="col g-5">
          <Input
            autoFocus
            label="Hábito"
            placeholder="Ler 20 páginas"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select label="Cor" value={hue} onChange={(e) => setHue(e.target.value as Hue)}>
            {(['green', 'indigo', 'amber', 'rose', 'blue', 'purple', 'teal'] as Hue[]).map((h) => (
              <option key={h} value={h}>{({ green: 'verde', indigo: 'azul-tinta', amber: 'latão', rose: 'terracota', blue: 'azul', purple: 'violeta', teal: 'petróleo', graphite: 'pedra' } as Record<Hue, string>)[h]}</option>
            ))}
          </Select>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => {
                if (!name.trim()) return;
                addHabit({ name: name.trim(), hue, icon: '✦' });
                setName('');
                setAdding(false);
              }}
            >
              Criar hábito
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

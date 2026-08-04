/** Eisenhower Matrix — a computed lens over open tasks, never a second home. */

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { TaskRow } from '@/modules/tasks/TaskRow';
import { riseIn, stagger } from '@/lib/motion';
import { eisenhowerQuadrant, isOpen } from '@/core/selectors';
import { todayKey } from '@/lib/dates';
import type { Task } from '@/core/types';

const QUADS = [
  { title: 'Fazer já', hint: 'urgente e importante', color: 'var(--danger)' },
  { title: 'Agendar', hint: 'importante, não urgente', color: 'var(--accent)' },
  { title: 'Encolher', hint: 'urgente, não importante', color: 'var(--warning)' },
  { title: 'Soltar', hint: 'nem um nem outro — candidatas a sair', color: 'var(--ink-faint)' },
];

export default function MatrixView() {
  const tasks = useData((s) => s.tasks);
  const today = todayKey();

  const quads = useMemo(() => {
    const out: Task[][] = [[], [], [], []];
    for (const t of tasks) {
      if (!isOpen(t) || t.status === 'inbox') continue;
      out[eisenhowerQuadrant(t, today)].push(t);
    }
    return out;
  }, [tasks, today]);

  return (
    <div className="view">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Eisenhower Matrix</h2>
        <p className="view-sub">
          Urgência vem das datas, importância da prioridade e do projeto — calculado ao vivo, então esta visão é sempre honesta.
        </p>
      </motion.header>

      <div className="matrix">
        {QUADS.map((q, i) => (
          <motion.section key={q.title} className="panel panel-pad matrix-quad" variants={riseIn} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
            <div className="matrix-label">
              <span className="t-body" style={{ fontWeight: 590, color: q.color }}>{q.title}</span>
              <span className="t-caption ink-faint">{q.hint} · {quads[i].length}</span>
            </div>
            {quads[i].length === 0 ? (
              <p className="t-body-sm ink-faint">Nada por aqui.</p>
            ) : (
              <motion.ul className="col" variants={stagger()} initial="hidden" animate="show">
                <AnimatePresence initial={false}>
                  {quads[i].slice(0, 8).map((t) => (
                    <TaskRow key={t.id} task={t} showDay />
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
            {quads[i].length > 8 && (
              <p className="t-caption ink-faint" style={{ marginTop: 'var(--sp-3)' }}>+ {quads[i].length - 8} outras</p>
            )}
          </motion.section>
        ))}
      </div>
    </div>
  );
}

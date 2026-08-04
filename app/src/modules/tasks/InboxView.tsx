/** Inbox — frictionless capture in, deliberate triage out. */

import { AnimatePresence, motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { TaskRow } from '@/modules/tasks/TaskRow';
import { Button, EmptyState } from '@/ui/primitives';
import { stagger, riseIn } from '@/lib/motion';
import { inboxTasks } from '@/core/selectors';
import { modLabel } from '@/lib/hooks/useHotkeys';

export default function InboxView() {
  const tasks = useData((s) => s.tasks);
  const openOverlay = useUi((s) => s.openOverlay);
  const items = inboxTasks(tasks);

  return (
    <div className="view view-narrow">
      <motion.header className="view-head row between g-4" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Inbox</h2>
          <p className="view-sub">
            {items.length === 0
              ? 'Tudo processado.'
              : `${items.length} para triar — dê um destino a cada uma, ou solte.`}
          </p>
        </div>
        <Button variant="primary" onClick={() => openOverlay({ kind: 'capture' })} kbd={`${modLabel}⇧N`}>
          Capturar
        </Button>
      </motion.header>

      {items.length === 0 ? (
        <EmptyState
          icon={<span aria-hidden>⊙</span>}
          title="Entrada zerada"
          hint={`Algo na cabeça? Pressione ${modLabel}⇧N de qualquer lugar para capturar antes que escape.`}
        />
      ) : (
        <motion.ul className="col panel" style={{ padding: 'var(--sp-3)' }} variants={stagger()} initial="hidden" animate="show">
          <AnimatePresence initial={false}>
            {items.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

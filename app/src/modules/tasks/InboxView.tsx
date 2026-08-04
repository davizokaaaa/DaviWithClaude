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
              ? 'Everything is processed.'
              : `${items.length} to triage — give each a home or let it go.`}
          </p>
        </div>
        <Button variant="primary" onClick={() => openOverlay({ kind: 'capture' })} kbd={`${modLabel}⇧N`}>
          Capture
        </Button>
      </motion.header>

      {items.length === 0 ? (
        <EmptyState
          icon={<span aria-hidden>⊙</span>}
          title="Inbox zero"
          hint={`Anything on your mind? Press ${modLabel}⇧N from anywhere to capture it before it escapes.`}
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

/** Task detail drawer: everything about one task, editable in place. */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Drawer } from '@/ui/overlays';
import { Button, Checkbox, Chip, Input, Select, Textarea } from '@/ui/primitives';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { staggerItem, stagger } from '@/lib/motion';
import { addDaysKey, humanDay, todayKey } from '@/lib/dates';
import type { EnergyLevel, Priority } from '@/core/types';

export function TaskDetailHost() {
  const overlay = useUi((s) => s.overlay);
  const close = useUi((s) => s.closeOverlay);
  const taskId = overlay?.kind === 'task' ? overlay.taskId : null;
  const task = useData((s) => (taskId ? s.tasks.find((t) => t.id === taskId) : undefined));

  return (
    <Drawer open={!!task} onClose={close} title="Tarefa" width={440}>
      {task && <TaskDetailBody taskId={task.id} />}
    </Drawer>
  );
}

function TaskDetailBody({ taskId }: { taskId: string }) {
  const task = useData((s) => s.tasks.find((t) => t.id === taskId));
  const updateTask = useData((s) => s.updateTask);
  const toggleSubtask = useData((s) => s.toggleSubtask);
  const addSubtask = useData((s) => s.addSubtask);
  const projects = useData((s) => s.projects);
  const areas = useData((s) => s.areas);
  const allTasks = useData((s) => s.tasks);
  const [newSub, setNewSub] = useState('');

  if (!task) return null;

  const blockers = task.blockedBy
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t) => t && t.status !== 'done' && t.status !== 'dropped');

  return (
    <div className="col g-6">
      <Input
        aria-label="Título da tarefa"
        value={task.title}
        onChange={(e) => updateTask(task.id, { title: e.target.value })}
        style={{ fontSize: 16, fontWeight: 590, height: 40 }}
      />

      <div className="row g-3 wrap">
        <Chip active={!!task.plannedFor && task.plannedFor === todayKey()} onClick={() => updateTask(task.id, { plannedFor: todayKey(), status: task.status === 'inbox' ? 'todo' : task.status })}>
          Hoje
        </Chip>
        <Chip
          active={!!task.plannedFor && task.plannedFor === addDaysKey(todayKey(), 1)}
          onClick={() => updateTask(task.id, { plannedFor: addDaysKey(todayKey(), 1), status: task.status === 'inbox' ? 'todo' : task.status })}
        >
          Amanhã
        </Chip>
        {task.plannedFor && (
          <Chip onClick={() => updateTask(task.id, { plannedFor: undefined })}>
            ✕ {humanDay(task.plannedFor)}
          </Chip>
        )}
      </div>

      <div className="grid-2" style={{ gap: 'var(--sp-5)' }}>
        <Select
          label="Prioridade"
          value={task.priority}
          onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
        >
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
          <option value="none">Nenhuma</option>
        </Select>
        <Select
          label="Energia"
          value={task.energy ?? ''}
          onChange={(e) => updateTask(task.id, { energy: (e.target.value || undefined) as EnergyLevel | undefined })}
        >
          <option value="">—</option>
          <option value="deep">Trabalho profundo</option>
          <option value="focused">Concentrado</option>
          <option value="light">Leve</option>
        </Select>
        <Select
          label="Projeto"
          value={task.projectId ?? ''}
          onChange={(e) => {
            const proj = projects.find((p) => p.id === e.target.value);
            updateTask(task.id, {
              projectId: proj?.id,
              areaId: proj?.areaId ?? task.areaId,
              columnId: proj?.columns[0]?.id,
            });
          }}
        >
          <option value="">Nenhum</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
        <Select
          label="Área"
          value={task.areaId ?? ''}
          onChange={(e) => updateTask(task.id, { areaId: e.target.value || undefined })}
        >
          <option value="">Nenhum</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
        <Input
          label="Estimativa (min)"
          type="number"
          min={0}
          step={5}
          value={task.estimate ?? ''}
          onChange={(e) => updateTask(task.id, { estimate: e.target.value ? Number(e.target.value) : undefined })}
        />
        <Input
          label="Prazo"
          type="date"
          value={task.dueDate ?? ''}
          onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
        />
      </div>

      <Textarea
        label="Notas"
        rows={3}
        value={task.notes ?? ''}
        placeholder="Contexto, links, critérios de aceite…"
        onChange={(e) => updateTask(task.id, { notes: e.target.value })}
      />

      {blockers.length > 0 && (
        <div className="panel panel-pad" style={{ borderColor: 'var(--warning)', background: 'var(--warning-fill)' }}>
          <p className="t-caption" style={{ color: 'var(--warning)', fontWeight: 590 }}>Bloqueada por</p>
          {blockers.map((b) => (
            <p key={b!.id} className="t-body-sm ink-muted" style={{ marginTop: 4 }}>· {b!.title}</p>
          ))}
        </div>
      )}

      <section>
        <p className="field-label" style={{ marginBottom: 'var(--sp-4)' }}>
          Checklist {task.subtasks.length > 0 && `· ${task.subtasks.filter((s) => s.done).length}/${task.subtasks.length}`}
        </p>
        <motion.ul className="col g-2" variants={stagger()} initial="hidden" animate="show">
          <AnimatePresence initial={false}>
            {task.subtasks.map((st) => (
              <motion.li key={st.id} variants={staggerItem} layout className="row g-4" style={{ minHeight: 28 }}>
                <Checkbox size="sm" checked={st.done} onChange={() => toggleSubtask(task.id, st.id)} label={st.title} />
                <span className={st.done ? 'ink-faint t-body-sm truncate' : 't-body-sm truncate'} style={st.done ? { textDecoration: 'line-through' } : undefined}>
                  {st.title}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        <form
          className="row g-3"
          style={{ marginTop: 'var(--sp-3)' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (newSub.trim()) {
              addSubtask(task.id, newSub.trim());
              setNewSub('');
            }
          }}
        >
          <Input
            aria-label="Novo item do checklist"
            placeholder="Adicionar um passo…"
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            style={{ height: 30 }}
          />
          <Button type="submit" size="sm" variant="ghost">Adicionar</Button>
        </form>
      </section>
    </div>
  );
}

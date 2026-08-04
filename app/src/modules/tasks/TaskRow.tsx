/**
 * The task row — the most-touched surface in the product, so it carries the
 * most care: spring checkbox, staggered mount, hover actions, context menu,
 * blocked state, inline metadata that never wraps.
 */

import { motion } from 'motion/react';
import clsx from 'clsx';
import { staggerItem } from '@/lib/motion';
import { Checkbox, Dot, PriorityFlag } from '@/ui/primitives';
import { Menu } from '@/ui/overlays';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { isBlocked } from '@/core/selectors';
import { addDaysKey, fmtMinutes, humanDay, todayKey } from '@/lib/dates';
import type { Task } from '@/core/types';

export function TaskRow({
  task,
  showProject = true,
  showDay = false,
}: {
  task: Task;
  showProject?: boolean;
  showDay?: boolean;
}) {
  const completeTask = useData((s) => s.completeTask);
  const reopenTask = useData((s) => s.reopenTask);
  const deleteTask = useData((s) => s.deleteTask);
  const dropTask = useData((s) => s.dropTask);
  const planTask = useData((s) => s.planTask);
  const setPriority = useData((s) => s.setPriority);
  const projects = useData((s) => s.projects);
  const tasks = useData((s) => s.tasks);
  const openOverlay = useUi((s) => s.openOverlay);
  const toast = useUi((s) => s.toast);

  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
  const done = task.status === 'done';
  const blocked = !done && isBlocked(task, tasks);
  const subDone = task.subtasks.filter((s) => s.done).length;

  const toggle = (checked: boolean) => {
    if (checked) {
      completeTask(task.id);
      toast({
        message: 'Concluída',
        kind: 'success',
        action: { label: 'Desfazer', onAction: () => reopenTask(task.id) },
      });
    } else {
      reopenTask(task.id);
    }
  };

  return (
    <motion.li
      layout="position"
      variants={staggerItem}
      className={clsx('trow', done && 'is-done', blocked && 'is-blocked')}
      onClick={() => openOverlay({ kind: 'task', taskId: task.id })}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openOverlay({ kind: 'task', taskId: task.id });
      }}
      tabIndex={0}
      role="button"
      aria-label={task.title}
    >
      <Checkbox checked={done} onChange={toggle} label={task.title} />
      <span className="trow-title truncate spacer">{task.title}</span>

      <span className="trow-meta">
        {blocked && <span title="Bloqueada por outra tarefa">⛓</span>}
        {task.subtasks.length > 0 && (
          <span title="Subtarefas">{subDone}/{task.subtasks.length}</span>
        )}
        {task.estimate != null && <span>{fmtMinutes(task.estimate)}</span>}
        {showDay && task.plannedFor && <span>{humanDay(task.plannedFor)}</span>}
        {task.dueDate && !task.plannedFor && (
          <span className={task.dueDate < todayKey() ? 'ink-accent' : undefined}>
            prazo {humanDay(task.dueDate)}
          </span>
        )}
        <PriorityFlag priority={task.priority} />
        {showProject && project && (
          <span className="row g-2" title={project.name}>
            <Dot hue={project.hue} />
          </span>
        )}
      </span>

      <span className="trow-hover-actions" onClick={(e) => e.stopPropagation()}>
        <Menu
          label="Ações da tarefa"
          align="end"
          items={[
            { label: 'Fazer hoje', onSelect: () => planTask(task.id, todayKey()) },
            { label: 'Fazer amanhã', onSelect: () => planTask(task.id, addDaysKey(todayKey(), 1)) },
            { label: 'Tirar do plano', onSelect: () => planTask(task.id, undefined) },
            'divider',
            { label: 'Prioridade: urgente', onSelect: () => setPriority(task.id, 'urgent') },
            { label: 'Prioridade: alta', onSelect: () => setPriority(task.id, 'high') },
            { label: 'Prioridade: média', onSelect: () => setPriority(task.id, 'medium') },
            { label: 'Prioridade: nenhuma', onSelect: () => setPriority(task.id, 'none') },
            'divider',
            { label: 'Soltar tarefa', onSelect: () => dropTask(task.id) },
            {
              label: 'Excluir',
              danger: true,
              onSelect: () => {
                deleteTask(task.id);
                toast({ message: 'Tarefa excluída', kind: 'danger' });
              },
            },
          ]}
          trigger={(props) => (
            <button className="iconbtn iconbtn-sm" aria-label="Ações da tarefa" {...props}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <circle cx="2" cy="6" r="1.1" fill="currentColor" />
                <circle cx="6" cy="6" r="1.1" fill="currentColor" />
                <circle cx="10" cy="6" r="1.1" fill="currentColor" />
              </svg>
            </button>
          )}
        />
      </span>
    </motion.li>
  );
}

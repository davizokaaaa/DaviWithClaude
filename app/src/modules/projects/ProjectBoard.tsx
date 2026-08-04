/**
 * Project board — Kanban with native pointer drag, spring drop, WIP limits,
 * and layout animation as cards reflow. Cards lift with a shadow while
 * dragging (a genuinely floating layer, so the shadow is earned).
 */

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Button, Checkbox, Dot, EmptyState, PriorityFlag, Input } from '@/ui/primitives';
import { spring, stagger, staggerItem, riseIn } from '@/lib/motion';
import { fmtMinutes } from '@/lib/dates';
import type { Task } from '@/core/types';

export default function ProjectBoard({ param }: { param?: string }) {
  const project = useData((s) => s.projects.find((p) => p.id === param));
  const tasks = useData((s) => s.tasks);
  const addTask = useData((s) => s.addTask);
  const moveTaskToColumn = useData((s) => s.moveTaskToColumn);
  const completeTask = useData((s) => s.completeTask);
  const reopenTask = useData((s) => s.reopenTask);
  const navigate = useUi((s) => s.navigate);
  const openOverlay = useUi((s) => s.openOverlay);

  const [dragTask, setDragTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [composerCol, setComposerCol] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);

  const columns = project?.columns ?? [];
  const byColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const c of columns) map.set(c.id, []);
    for (const t of tasks) {
      if (t.projectId !== project?.id || t.status === 'dropped') continue;
      const colId = t.columnId && map.has(t.columnId) ? t.columnId : columns[0]?.id;
      if (colId) map.get(colId)!.push(t);
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order);
    return map;
  }, [tasks, project, columns]);

  if (!project) {
    return (
      <div className="view">
        <EmptyState
          title="Projeto não encontrado"
          action={<Button onClick={() => navigate({ view: 'projects' })}>Voltar aos projetos</Button>}
        />
      </div>
    );
  }

  /** Column under the pointer during a drag. */
  const columnFromPoint = (x: number, y: number): string | null => {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      const col = (el as HTMLElement).dataset?.columnId;
      if (col) return col;
    }
    return null;
  };

  const onDrop = (task: Task, x: number, y: number) => {
    const colId = columnFromPoint(x, y);
    setDragTask(null);
    setOverColumn(null);
    if (!colId || colId === task.columnId) return;
    const list = byColumn.get(colId) ?? [];
    const maxOrder = list.length ? Math.max(...list.map((t) => t.order)) : 0;
    moveTaskToColumn(task.id, colId, maxOrder + 1);
    const doneCol = columns[columns.length - 1];
    if (doneCol && colId === doneCol.id && task.status !== 'done') completeTask(task.id);
    if (doneCol && colId !== doneCol.id && task.status === 'done') reopenTask(task.id);
  };

  const addToColumn = (colId: string) => {
    if (!composerText.trim()) return;
    addTask({
      title: composerText.trim(),
      status: 'todo',
      projectId: project.id,
      areaId: project.areaId,
      columnId: colId,
      order: Date.now(),
    });
    setComposerText('');
  };

  return (
    <div className="view" style={{ maxWidth: 'none' }}>
      <motion.header className="view-head row between g-4 wrap" variants={riseIn} initial="hidden" animate="show">
        <div className="row g-4">
          <button className="iconbtn iconbtn-md" onClick={() => navigate({ view: 'projects' })} aria-label="Voltar aos projetos">
            ←
          </button>
          <div>
            <div className="row g-3">
              <Dot hue={project.hue} />
              <h2 className="t-title-lg">{project.name}</h2>
            </div>
            {project.description && <p className="t-body-sm ink-subtle" style={{ marginTop: 4 }}>{project.description}</p>}
          </div>
        </div>
      </motion.header>

      <div className="board" ref={boardRef}>
        {columns.map((col) => {
          const list = byColumn.get(col.id) ?? [];
          const openCount = list.filter((t) => t.status !== 'done').length;
          const overWip = col.wipLimit != null && openCount > col.wipLimit;
          return (
            <section
              key={col.id}
              data-column-id={col.id}
              className={clsx('board-col', overColumn === col.id && 'is-over')}
              aria-label={`Coluna ${col.name}`}
            >
              <header className="row g-3 board-col-head">
                <span className="t-body-sm" style={{ fontWeight: 590 }}>{col.name}</span>
                <span className={clsx('t-micro', overWip ? '' : 'ink-faint')} style={overWip ? { color: 'var(--warning)' } : undefined}>
                  {openCount}{col.wipLimit != null && `/${col.wipLimit}`}
                </span>
                {overWip && <span className="t-micro" style={{ color: 'var(--warning)' }}>acima do limite</span>}
                <span className="spacer" />
                <button
                  className="iconbtn iconbtn-sm"
                  aria-label={`Adicionar tarefa em ${col.name}`}
                  onClick={() => setComposerCol(composerCol === col.id ? null : col.id)}
                >
                  +
                </button>
              </header>

              <AnimatePresence>
                {composerCol === col.id && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto', transition: spring.smooth }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', flex: 'none' }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      addToColumn(col.id);
                    }}
                  >
                    <Input
                      autoFocus
                      aria-label="Título da nova tarefa"
                      placeholder="Título da tarefa, ↵ para adicionar"
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setComposerCol(null)}
                      style={{ marginBottom: 'var(--sp-4)' }}
                    />
                  </motion.form>
                )}
              </AnimatePresence>

              <motion.div className="board-cards" variants={stagger()} initial="hidden" animate="show">
                <AnimatePresence initial={false}>
                  {list.map((t) => (
                    <BoardCard
                      key={t.id}
                      task={t}
                      dragging={dragTask?.id === t.id}
                      onDragStart={() => setDragTask(t)}
                      onDrag={(x, y) => setOverColumn(columnFromPoint(x, y))}
                      onDragEnd={(x, y) => onDrop(t, x, y)}
                      onOpen={() => openOverlay({ kind: 'task', taskId: t.id })}
                      onToggle={(checked) => (checked ? completeTask(t.id) : reopenTask(t.id))}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({
  task, dragging, onDragStart, onDrag, onDragEnd, onOpen, onToggle,
}: {
  task: Task;
  dragging: boolean;
  onDragStart: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onOpen: () => void;
  onToggle: (checked: boolean) => void;
}) {
  const done = task.status === 'done';
  const subDone = task.subtasks.filter((s) => s.done).length;
  return (
    <motion.article
      layout
      layoutId={`card:${task.id}`}
      variants={staggerItem}
      drag
      dragSnapToOrigin
      dragElastic={0.12}
      dragMomentum={false}
      whileDrag={{ scale: 1.04, rotate: 1.2, zIndex: 30, boxShadow: 'var(--shadow-drag)', cursor: 'grabbing' }}
      onDragStart={onDragStart}
      onDrag={(_, info) => onDrag(info.point.x, info.point.y)}
      onDragEnd={(_, info) => onDragEnd(info.point.x, info.point.y)}
      transition={spring.smooth}
      className={clsx('board-card', done && 'is-done', dragging && 'is-dragging')}
      onClick={() => !dragging && onOpen()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      aria-label={task.title}
    >
      <div className="row-start g-4">
        <Checkbox size="sm" checked={done} onChange={onToggle} label={task.title} />
        <span className={clsx('t-body-sm spacer', done && 'ink-faint')} style={done ? { textDecoration: 'line-through' } : undefined}>
          {task.title}
        </span>
      </div>
      {(task.priority !== 'none' || task.estimate != null || task.subtasks.length > 0 || task.tags.length > 0) && (
        <div className="row g-3 wrap" style={{ marginTop: 'var(--sp-3)', paddingLeft: 23 }}>
          <PriorityFlag priority={task.priority} />
          {task.estimate != null && <span className="t-micro ink-faint">{fmtMinutes(task.estimate)}</span>}
          {task.subtasks.length > 0 && (
            <span className="t-micro ink-faint">{subDone}/{task.subtasks.length}</span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} className="t-micro ink-faint">#{tag}</span>
          ))}
        </div>
      )}
    </motion.article>
  );
}

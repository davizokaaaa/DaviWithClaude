/** Projects overview — progress, status, and a clean path into each board. */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Button, Dot, ProgressBar, Segmented, EmptyState } from '@/ui/primitives';
import { stagger, staggerItem, liftable, riseIn } from '@/lib/motion';
import { humanDay } from '@/lib/dates';
import type { ProjectStatus } from '@/core/types';

export default function ProjectsView() {
  const projects = useData((s) => s.projects);
  const tasks = useData((s) => s.tasks);
  const areas = useData((s) => s.areas);
  const addProject = useData((s) => s.addProject);
  const navigate = useUi((s) => s.navigate);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const visible = useMemo(
    () =>
      projects
        .filter((p) => !p.parentId)
        .filter((p) => (filter === 'active' ? p.status === 'active' || p.status === 'planned' : true))
        .sort((a, b) => a.order - b.order),
    [projects, filter],
  );

  const statusLabel: Record<ProjectStatus, string> = {
    active: 'Active', planned: 'Planned', paused: 'Paused', done: 'Done',
  };

  return (
    <div className="view">
      <motion.header className="view-head row between g-4 wrap" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Projects</h2>
          <p className="view-sub">Every commitment with a finish line.</p>
        </div>
        <div className="row g-4">
          <Segmented
            layoutNs="projects-filter"
            label="Filter projects"
            value={filter}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'all', label: 'All' },
            ]}
            onChange={setFilter}
          />
          <Button
            variant="primary"
            onClick={() => {
              const area = areas[0];
              if (!area) return;
              const p = addProject({ name: 'New project', areaId: area.id });
              navigate({ view: 'project', param: p.id });
            }}
          >
            + New project
          </Button>
        </div>
      </motion.header>

      {visible.length === 0 ? (
        <EmptyState title="No projects here" hint="Create a project to give bigger work a home and a board." />
      ) : (
        <motion.div className="grid-3" variants={stagger(0.02, 0.04)} initial="hidden" animate="show">
          {visible.map((p) => {
            const projTasks = tasks.filter((t) => t.projectId === p.id && t.status !== 'dropped');
            const done = projTasks.filter((t) => t.status === 'done').length;
            const progress = projTasks.length ? done / projTasks.length : 0;
            const area = areas.find((a) => a.id === p.areaId);
            const subprojects = projects.filter((x) => x.parentId === p.id);
            return (
              <motion.button
                key={p.id}
                variants={staggerItem}
                {...liftable}
                className="panel panel-pad col g-4"
                style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={() => navigate({ view: 'project', param: p.id })}
              >
                <div className="row g-3">
                  <Dot hue={p.hue} />
                  <span className="t-subtitle truncate spacer">{p.name}</span>
                  <span className="t-micro ink-faint">{statusLabel[p.status]}</span>
                </div>
                {p.description && <p className="t-body-sm ink-subtle clamp-2">{p.description}</p>}
                <ProgressBar value={progress} hue={p.hue} />
                <div className="row between t-caption ink-faint">
                  <span>{done}/{projTasks.length} tasks</span>
                  <span className="row g-3">
                    {subprojects.length > 0 && <span>{subprojects.length} sub</span>}
                    {area && <span>{area.name}</span>}
                    {p.targetDate && <span>→ {humanDay(p.targetDate)}</span>}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

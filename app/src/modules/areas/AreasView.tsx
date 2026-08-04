/** Áreas da Vida — onde a atenção realmente foi vs. onde deveria ter ido. */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { Button, Dot, EmptyState, Input, Select } from '@/ui/primitives';
import { Dialog } from '@/ui/overlays';
import { DistributionBar } from '@/ui/charts';
import { riseIn, stagger, staggerItem } from '@/lib/motion';
import { areaLoad } from '@/core/selectors';
import { fmtMinutes } from '@/lib/dates';
import type { Hue } from '@/core/types';

const HUE_LABEL: Record<Hue, string> = {
  indigo: 'azul-tinta', green: 'verde', amber: 'latão', rose: 'terracota',
  blue: 'azul', purple: 'violeta', teal: 'petróleo', graphite: 'pedra',
};
const ICONS = ['◆', '♥', '◉', '✦', '▲', '❖', '☾', '✎'];

export default function AreasView() {
  const areas = useData((s) => s.areas);
  const blocks = useData((s) => s.blocks);
  const goals = useData((s) => s.goals);
  const projects = useData((s) => s.projects);
  const tasks = useData((s) => s.tasks);
  const addArea = useData((s) => s.addArea);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [hue, setHue] = useState<Hue>('indigo');
  const [icon, setIcon] = useState('◆');
  const [hours, setHours] = useState('');

  const load = useMemo(() => areaLoad({ blocks, areas }, 7), [blocks, areas]);
  const totalPlanned = [...load.values()].reduce((s, v) => s + v, 0);

  return (
    <div className="view view-narrow">
      <motion.header className="view-head row between g-4" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Áreas da Vida</h2>
          <p className="view-sub">A atenção da semana, área por área — intenção vs. realidade.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Nova área</Button>
      </motion.header>

      {areas.length === 0 && (
        <EmptyState
          icon={<span aria-hidden>❖</span>}
          title="Nenhuma área ainda"
          hint="Áreas são os grandes territórios da sua vida — Trabalho, Saúde, Aprendizado. Metas e projetos vivem dentro delas."
          action={<Button variant="primary" onClick={() => setAdding(true)}>Criar a primeira área</Button>}
        />
      )}

      {totalPlanned > 0 && (
        <motion.section className="panel panel-pad" style={{ marginBottom: 'var(--stack-gap)' }} variants={riseIn} initial="hidden" animate="show">
          <div className="panel-head"><h3 className="panel-title">Equilíbrio da semana</h3></div>
          <DistributionBar
            segments={areas
              .filter((a) => (load.get(a.id) ?? 0) > 0)
              .map((a) => ({ label: a.name, value: load.get(a.id) ?? 0, hue: a.hue }))}
          />
          <div className="row g-5 wrap" style={{ marginTop: 'var(--sp-4)' }}>
            {areas.map((a) => {
              const v = load.get(a.id) ?? 0;
              if (!v) return null;
              return (
                <span key={a.id} className="row g-2 t-caption ink-subtle">
                  <Dot hue={a.hue} />
                  {a.name} · {fmtMinutes(v)}
                </span>
              );
            })}
          </div>
        </motion.section>
      )}

      <motion.div className="grid-2" variants={stagger(0.02, 0.05)} initial="hidden" animate="show">
        {areas.map((a) => {
          const areaGoals = goals.filter((g) => g.areaId === a.id);
          const areaProjects = projects.filter((p) => p.areaId === a.id && p.status === 'active');
          const openTasks = tasks.filter((t) => t.areaId === a.id && t.status !== 'done' && t.status !== 'dropped').length;
          const weekMinutes = load.get(a.id) ?? 0;
          const intended = (a.intendedHours ?? 0) * 60;
          return (
            <motion.section key={a.id} variants={staggerItem} className="panel panel-pad col g-4">
              <div className="row g-4">
                <span
                  style={{
                    width: 34, height: 34, borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center',
                    background: `color-mix(in oklab, var(--hue-${a.hue}) 18%, transparent)`,
                    color: `var(--hue-${a.hue})`, fontSize: 14, flex: 'none',
                  }}
                  aria-hidden
                >
                  {a.icon}
                </span>
                <div className="col">
                  <span className="t-subtitle">{a.name}</span>
                  <span className="t-micro ink-faint">
                    {fmtMinutes(weekMinutes)} nesta semana{intended > 0 && ` · intenção ${fmtMinutes(intended)}`}
                  </span>
                </div>
              </div>
              <div className="row g-5 t-caption ink-subtle wrap">
                <span>{areaProjects.length} projeto{areaProjects.length !== 1 ? 's' : ''} ativo{areaProjects.length !== 1 ? 's' : ''}</span>
                <span>{areaGoals.length} meta{areaGoals.length !== 1 ? 's' : ''}</span>
                <span>{openTasks} tarefa{openTasks !== 1 ? 's' : ''} aberta{openTasks !== 1 ? 's' : ''}</span>
              </div>
              {intended > 0 && weekMinutes < intended * 0.5 && (
                <p className="t-caption" style={{ color: 'var(--warning)' }}>
                  Bem abaixo da intenção nesta semana.
                </p>
              )}
            </motion.section>
          );
        })}
      </motion.div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Nova área" width={400}>
        <div className="col g-5">
          <Input autoFocus label="Nome" placeholder="Trabalho, Saúde, Aprendizado…" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid-2" style={{ gap: 'var(--sp-5)' }}>
            <Select label="Ícone" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
            <Select label="Cor" value={hue} onChange={(e) => setHue(e.target.value as Hue)}>
              {(Object.keys(HUE_LABEL) as Hue[]).map((h) => (
                <option key={h} value={h}>{HUE_LABEL[h]}</option>
              ))}
            </Select>
          </div>
          <Input
            label="Horas semanais pretendidas (opcional)"
            type="number"
            min={0}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => {
                if (!name.trim()) return;
                addArea({ name: name.trim(), icon, hue, intendedHours: hours ? Number(hours) : undefined });
                setName('');
                setHours('');
                setAdding(false);
              }}
            >
              Criar área
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

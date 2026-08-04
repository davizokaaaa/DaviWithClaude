/** Metas & OKRs — resultados-chave editáveis inline; o progresso é calculado, nunca digitado. */

import { useState } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { useData } from '@/core/store/data';
import { Button, Dot, EmptyState, Input, ProgressBar, ProgressRing, Select } from '@/ui/primitives';
import { Dialog } from '@/ui/overlays';
import { AnimatedNumber } from '@/ui/charts';
import { riseIn, stagger, staggerItem } from '@/lib/motion';
import { goalProgress } from '@/core/selectors';
import { humanDay } from '@/lib/dates';
import type { Goal, GoalStatus } from '@/core/types';

const STATUS_META: Record<GoalStatus, { label: string; color: string }> = {
  'on-track': { label: 'No rumo', color: 'var(--success)' },
  'at-risk': { label: 'Em risco', color: 'var(--warning)' },
  behind: { label: 'Atrasada', color: 'var(--danger)' },
  achieved: { label: 'Alcançada', color: 'var(--success)' },
  paused: { label: 'Pausada', color: 'var(--ink-faint)' },
};

export default function GoalsView() {
  const goals = useData((s) => s.goals);
  const areas = useData((s) => s.areas);
  const projects = useData((s) => s.projects);
  const updateKeyResult = useData((s) => s.updateKeyResult);
  const addGoal = useData((s) => s.addGoal);
  const addKeyResult = useData((s) => s.addKeyResult);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [areaId, setAreaId] = useState('');
  const [horizon, setHorizon] = useState<Goal['horizon']>('quarter');

  return (
    <div className="view view-narrow">
      <motion.header className="view-head row between g-4" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Metas</h2>
          <p className="view-sub">Direção primeiro. Progresso se mede por resultados-chave, não por impressão.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)} disabled={areas.length === 0}>+ Nova meta</Button>
      </motion.header>

      {goals.length === 0 && (
        <EmptyState
          icon={<span aria-hidden>◈</span>}
          title="Nenhuma meta ainda"
          hint={areas.length === 0
            ? 'Crie primeiro uma Área da Vida — toda meta pertence a uma área.'
            : 'Defina uma direção e dois ou três resultados-chave mensuráveis.'}
          action={areas.length > 0 ? <Button variant="primary" onClick={() => setAdding(true)}>Criar a primeira meta</Button> : undefined}
        />
      )}

      <motion.div className="col g-6" variants={stagger(0.02, 0.06)} initial="hidden" animate="show">
        {goals.map((g) => {
          const progress = goalProgress(g);
          const area = areas.find((a) => a.id === g.areaId);
          const linked = projects.filter((p) => p.goalId === g.id);
          const meta = STATUS_META[g.status];
          return (
            <motion.section key={g.id} variants={staggerItem} className="panel panel-pad">
              <div className="row-start g-6">
                <ProgressRing value={progress} size={52} stroke={4} hue={area?.hue}>
                  <span className="t-caption" style={{ fontWeight: 590 }}>
                    <AnimatedNumber value={Math.round(progress * 100)} />
                  </span>
                </ProgressRing>
                <div className="col g-1 spacer" style={{ minWidth: 0 }}>
                  <div className="row g-4 wrap">
                    <h3 className="t-subtitle">{g.name}</h3>
                    <span className="t-micro" style={{ color: meta.color, fontWeight: 590 }}>{meta.label}</span>
                  </div>
                  {g.why && <p className="t-body-sm ink-subtle">{g.why}</p>}
                  <div className="row g-4 t-caption ink-faint wrap">
                    {area && (
                      <span className="row g-2"><Dot hue={area.hue} />{area.name}</span>
                    )}
                    <span>{g.horizon === 'quarter' ? 'Neste trimestre' : g.horizon === 'year' ? 'Neste ano' : 'Longo prazo'}</span>
                    {g.targetDate && <span>→ {humanDay(g.targetDate)}</span>}
                    {linked.length > 0 && <span>{linked.length} projeto{linked.length > 1 ? 's' : ''} vinculado{linked.length > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </div>

              <div className="col g-4" style={{ marginTop: 'var(--sp-6)' }}>
                {g.keyResults.map((kr) => {
                  const span = kr.target - kr.start;
                  const p = span === 0 ? 1 : Math.max(0, Math.min(1, (kr.current - kr.start) / span));
                  return (
                    <div key={kr.id} className="col g-2">
                      <div className="row between g-4">
                        <span className="t-body-sm truncate">{kr.name}</span>
                        <span className={clsx('t-caption', 'row', 'g-2')} style={{ flex: 'none' }}>
                          <input
                            className="input"
                            style={{ width: 76, height: 24, textAlign: 'right', padding: '0 8px', fontSize: 12 }}
                            type="number"
                            step="any"
                            aria-label={`Valor atual de ${kr.name}`}
                            value={kr.current}
                            onChange={(e) => updateKeyResult(g.id, kr.id, Number(e.target.value))}
                          />
                          <span className="ink-faint" style={{ alignSelf: 'center' }}>
                            / {kr.target}{kr.unit ?? ''}
                          </span>
                        </span>
                      </div>
                      <ProgressBar value={p} hue={area?.hue} />
                    </div>
                  );
                })}
                <NewKeyResult onAdd={(krName, target, unit) => addKeyResult(g.id, { name: krName, target, unit })} />
              </div>
            </motion.section>
          );
        })}
      </motion.div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Nova meta" width={440}>
        <div className="col g-5">
          <Input autoFocus label="Meta" placeholder="Publicar o primeiro produto" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Por quê (opcional)" placeholder="O que muda quando isso acontecer?" value={why} onChange={(e) => setWhy(e.target.value)} />
          <div className="grid-2" style={{ gap: 'var(--sp-5)' }}>
            <Select label="Área" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">Escolha…</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <Select label="Horizonte" value={horizon} onChange={(e) => setHorizon(e.target.value as Goal['horizon'])}>
              <option value="quarter">Trimestre</option>
              <option value="year">Ano</option>
              <option value="long">Longo prazo</option>
            </Select>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => {
                if (!name.trim() || !areaId) return;
                addGoal({ name: name.trim(), why: why.trim() || undefined, areaId, horizon });
                setName('');
                setWhy('');
                setAdding(false);
              }}
            >
              Criar meta
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/** Inline composer: um resultado-chave mensurável por vez. */
function NewKeyResult({ onAdd }: { onAdd: (name: string, target: number, unit?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');

  if (!open) {
    return (
      <button className="t-caption ink-faint" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
        + resultado-chave
      </button>
    );
  }
  return (
    <form
      className="row g-3 wrap"
      onSubmit={(e) => {
        e.preventDefault();
        const t = Number(target);
        if (!name.trim() || !t) return;
        onAdd(name.trim(), t, unit.trim() || undefined);
        setName('');
        setTarget('');
        setUnit('');
        setOpen(false);
      }}
    >
      <Input aria-label="Resultado-chave" placeholder="Ex.: clientes ativos" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 2, minWidth: 160, height: 30 }} />
      <Input aria-label="Alvo" type="number" placeholder="Alvo" value={target} onChange={(e) => setTarget(e.target.value)} style={{ width: 90, height: 30 }} />
      <Input aria-label="Unidade" placeholder="un." value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: 70, height: 30 }} />
      <Button type="submit" size="sm" variant="ghost">Adicionar</Button>
    </form>
  );
}

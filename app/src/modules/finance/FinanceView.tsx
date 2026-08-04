/** Finance — a monthly overview (flows, savings rate, goals), not bookkeeping. */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { Button, Dot, Input, ProgressBar, Select } from '@/ui/primitives';
import { AnimatedNumber, DistributionBar } from '@/ui/charts';
import { Dialog } from '@/ui/overlays';
import { riseIn, stagger, staggerItem } from '@/lib/motion';
import type { MoneyFlow } from '@/core/types';

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function FinanceView() {
  const flows = useData((s) => s.flows);
  const savings = useData((s) => s.savings);
  const updateFlow = useData((s) => s.updateFlow);
  const addFlow = useData((s) => s.addFlow);
  const deleteFlow = useData((s) => s.deleteFlow);
  const updateSavings = useData((s) => s.updateSavings);
  const addSavings = useData((s) => s.addSavings);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', amount: '', kind: 'variable' as MoneyFlow['kind'] });

  const income = useMemo(() => flows.filter((f) => f.amount > 0).reduce((s, f) => s + f.amount, 0), [flows]);
  const spending = useMemo(() => flows.filter((f) => f.amount < 0 && f.kind !== 'saving').reduce((s, f) => s - f.amount, 0), [flows]);
  const saved = useMemo(() => flows.filter((f) => f.kind === 'saving').reduce((s, f) => s - f.amount, 0), [flows]);
  const free = income - spending - saved;
  const savingsRate = income > 0 ? saved / income : 0;

  const groups: { kind: MoneyFlow['kind']; label: string }[] = [
    { kind: 'income', label: 'Renda' },
    { kind: 'fixed', label: 'Custos fixos' },
    { kind: 'variable', label: 'Gastos variáveis' },
    { kind: 'saving', label: 'Poupança e investimentos' },
  ];

  return (
    <div className="view view-narrow">
      <motion.header className="view-head row between g-4" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Finance</h2>
          <p className="view-sub">A forma mensal do seu dinheiro — direção, não contabilidade.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Novo fluxo</Button>
      </motion.header>

      <motion.section className="panel panel-pad" variants={riseIn} initial="hidden" animate="show" style={{ marginBottom: 'var(--stack-gap)' }}>
        <div className="grid-4" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="stat">
            <span className="stat-value"><AnimatedNumber value={income} format={fmt} /></span>
            <span className="stat-label">renda mensal</span>
          </div>
          <div className="stat">
            <span className="stat-value"><AnimatedNumber value={spending} format={fmt} /></span>
            <span className="stat-label">gastos</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              <AnimatedNumber value={Math.round(savingsRate * 100)} format={(n) => `${Math.round(n)}%`} />
            </span>
            <span className="stat-label">taxa de poupança</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={free < 0 ? { color: 'var(--danger)' } : undefined}>
              <AnimatedNumber value={free} format={fmt} />
            </span>
            <span className="stat-label">sem destino</span>
          </div>
        </div>
        <DistributionBar
          segments={[
            { label: 'Fixos', value: flows.filter((f) => f.kind === 'fixed').reduce((s, f) => s - f.amount, 0), hue: 'indigo' },
            { label: 'Variáveis', value: flows.filter((f) => f.kind === 'variable').reduce((s, f) => s - f.amount, 0), hue: 'amber' },
            { label: 'Poupança', value: saved, hue: 'green' },
            { label: 'Livre', value: Math.max(0, free), hue: 'graphite' },
          ]}
        />
      </motion.section>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <motion.section className="panel" variants={stagger(0.02, 0.04)} initial="hidden" animate="show">
          {groups.map(({ kind, label }) => {
            const items = flows.filter((f) => f.kind === kind);
            if (!items.length) return null;
            return (
              <div key={kind} style={{ padding: 'var(--sp-5) var(--sp-6)', borderBottom: '1px solid var(--hairline-soft)' }}>
                <p className="t-eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>{label}</p>
                <div className="col g-2">
                  {items.map((f) => (
                    <motion.div key={f.id} variants={staggerItem} className="row g-4" style={{ minHeight: 30 }}>
                      <Dot hue={f.hue} />
                      <span className="t-body-sm spacer truncate">{f.name}</span>
                      <input
                        className="input"
                        style={{ width: 92, height: 26, textAlign: 'right', fontSize: 12 }}
                        type="number"
                        aria-label={`Valor de ${f.name}`}
                        value={Math.abs(f.amount)}
                        onChange={(e) => {
                          const v = Math.abs(Number(e.target.value));
                          updateFlow(f.id, { amount: f.amount >= 0 ? v : -v });
                        }}
                      />
                      <button className="iconbtn iconbtn-sm" aria-label={`Remover ${f.name}`} onClick={() => deleteFlow(f.id)}>
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.section>

        <motion.section className="panel panel-pad col g-5" variants={stagger(0.05, 0.06)} initial="hidden" animate="show">
          <h3 className="panel-title">Objetivos de poupança</h3>
          {savings.length === 0 && (
            <p className="t-body-sm ink-faint">Nenhum objetivo ainda — crie o primeiro abaixo.</p>
          )}
          {savings.map((sv) => (
            <motion.div key={sv.id} variants={staggerItem} className="col g-2">
              <div className="row between g-4">
                <span className="t-body-sm" style={{ fontWeight: 500 }}>{sv.name}</span>
                <span className="t-caption ink-faint">
                  {fmt(sv.current)} / {fmt(sv.target)}
                </span>
              </div>
              <ProgressBar value={sv.current / sv.target} hue={sv.hue} />
              <input
                className="input"
                style={{ width: 110, height: 26, fontSize: 12 }}
                type="number"
                aria-label={`Valor atual de ${sv.name}`}
                value={sv.current}
                onChange={(e) => updateSavings(sv.id, { current: Number(e.target.value) })}
              />
            </motion.div>
          ))}
          <NewSavings onAdd={(name, target) => addSavings({ name, target, current: 0, hue: 'teal' })} />
        </motion.section>
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Novo fluxo mensal" width={380}>
        <div className="col g-5">
          <Input autoFocus label="Nome" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input label="Valor mensal" type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          <Select label="Tipo" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as MoneyFlow['kind'] })}>
            <option value="income">Renda</option>
            <option value="fixed">Custo fixo</option>
            <option value="variable">Gasto variável</option>
            <option value="saving">Poupança / investimento</option>
          </Select>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => {
                const amount = Math.abs(Number(draft.amount));
                if (!draft.name.trim() || !amount) return;
                addFlow({
                  name: draft.name.trim(),
                  amount: draft.kind === 'income' ? amount : -amount,
                  kind: draft.kind,
                  hue: draft.kind === 'income' ? 'green' : draft.kind === 'saving' ? 'teal' : 'amber',
                });
                setDraft({ name: '', amount: '', kind: 'variable' });
                setAdding(false);
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/** Composer inline: um objetivo de poupança com nome e alvo. */
function NewSavings({ onAdd }: { onAdd: (name: string, target: number) => void }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  return (
    <form
      className="row g-3 wrap"
      onSubmit={(e) => {
        e.preventDefault();
        const t = Number(target);
        if (!name.trim() || !t) return;
        onAdd(name.trim(), t);
        setName('');
        setTarget('');
      }}
    >
      <Input aria-label="Objetivo" placeholder="Ex.: reserva de emergência" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 2, minWidth: 150, height: 30 }} />
      <Input aria-label="Alvo" type="number" placeholder="Alvo" value={target} onChange={(e) => setTarget(e.target.value)} style={{ width: 100, height: 30 }} />
      <Button type="submit" size="sm" variant="ghost">Adicionar</Button>
    </form>
  );
}

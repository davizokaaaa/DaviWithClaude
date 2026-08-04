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
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function FinanceView() {
  const flows = useData((s) => s.flows);
  const savings = useData((s) => s.savings);
  const updateFlow = useData((s) => s.updateFlow);
  const addFlow = useData((s) => s.addFlow);
  const deleteFlow = useData((s) => s.deleteFlow);
  const updateSavings = useData((s) => s.updateSavings);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', amount: '', kind: 'variable' as MoneyFlow['kind'] });

  const income = useMemo(() => flows.filter((f) => f.amount > 0).reduce((s, f) => s + f.amount, 0), [flows]);
  const spending = useMemo(() => flows.filter((f) => f.amount < 0 && f.kind !== 'saving').reduce((s, f) => s - f.amount, 0), [flows]);
  const saved = useMemo(() => flows.filter((f) => f.kind === 'saving').reduce((s, f) => s - f.amount, 0), [flows]);
  const free = income - spending - saved;
  const savingsRate = income > 0 ? saved / income : 0;

  const groups: { kind: MoneyFlow['kind']; label: string }[] = [
    { kind: 'income', label: 'Income' },
    { kind: 'fixed', label: 'Fixed costs' },
    { kind: 'variable', label: 'Variable spending' },
    { kind: 'saving', label: 'Savings & investing' },
  ];

  return (
    <div className="view view-narrow">
      <motion.header className="view-head row between g-4" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Finance</h2>
          <p className="view-sub">The monthly shape of your money — direction, not bookkeeping.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>+ Add flow</Button>
      </motion.header>

      <motion.section className="panel panel-pad" variants={riseIn} initial="hidden" animate="show" style={{ marginBottom: 'var(--stack-gap)' }}>
        <div className="grid-4" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="stat">
            <span className="stat-value"><AnimatedNumber value={income} format={fmt} /></span>
            <span className="stat-label">monthly income</span>
          </div>
          <div className="stat">
            <span className="stat-value"><AnimatedNumber value={spending} format={fmt} /></span>
            <span className="stat-label">spending</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              <AnimatedNumber value={Math.round(savingsRate * 100)} format={(n) => `${Math.round(n)}%`} />
            </span>
            <span className="stat-label">savings rate</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={free < 0 ? { color: 'var(--danger)' } : undefined}>
              <AnimatedNumber value={free} format={fmt} />
            </span>
            <span className="stat-label">unallocated</span>
          </div>
        </div>
        <DistributionBar
          segments={[
            { label: 'Fixed', value: flows.filter((f) => f.kind === 'fixed').reduce((s, f) => s - f.amount, 0), hue: 'indigo' },
            { label: 'Variable', value: flows.filter((f) => f.kind === 'variable').reduce((s, f) => s - f.amount, 0), hue: 'amber' },
            { label: 'Savings', value: saved, hue: 'green' },
            { label: 'Free', value: Math.max(0, free), hue: 'graphite' },
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
                        aria-label={`${f.name} amount`}
                        value={Math.abs(f.amount)}
                        onChange={(e) => {
                          const v = Math.abs(Number(e.target.value));
                          updateFlow(f.id, { amount: f.amount >= 0 ? v : -v });
                        }}
                      />
                      <button className="iconbtn iconbtn-sm" aria-label={`Remove ${f.name}`} onClick={() => deleteFlow(f.id)}>
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
          <h3 className="panel-title">Savings goals</h3>
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
                aria-label={`${sv.name} current amount`}
                value={sv.current}
                onChange={(e) => updateSavings(sv.id, { current: Number(e.target.value) })}
              />
            </motion.div>
          ))}
        </motion.section>
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Add money flow" width={380}>
        <div className="col g-5">
          <Input autoFocus label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input label="Monthly amount" type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          <Select label="Type" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as MoneyFlow['kind'] })}>
            <option value="income">Income</option>
            <option value="fixed">Fixed cost</option>
            <option value="variable">Variable spending</option>
            <option value="saving">Saving / investing</option>
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
              Add
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

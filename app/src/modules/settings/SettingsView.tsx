/** Settings — appearance, modules (the anti-bloat lever), focus, and data. */

import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useSettings, useUi } from '@/core/store/ui';
import { Button, Segmented, Switch, Input } from '@/ui/primitives';
import { riseIn, stagger, staggerItem, spring } from '@/lib/motion';
import type { AccentPref, ModuleFlags } from '@/core/types';

const ACCENTS: { id: AccentPref; label: string }[] = [
  { id: 'indigo', label: 'Ink Navy' },
  { id: 'evergreen', label: 'Forest' },
  { id: 'amber', label: 'Brass' },
  { id: 'rose', label: 'Terracotta' },
  { id: 'graphite', label: 'Stone' },
];

const MODULES: { key: keyof ModuleFlags; label: string; hint: string }[] = [
  { key: 'focus', label: 'Focus', hint: 'Pomodoro and deep-work sessions' },
  { key: 'habits', label: 'Habits', hint: 'Habit tracker with streak freezes' },
  { key: 'goals', label: 'Goals', hint: 'OKRs and key results' },
  { key: 'knowledge', label: 'Notes', hint: 'Knowledge base, journal, reading list' },
  { key: 'finance', label: 'Finance', hint: 'Monthly money overview' },
  { key: 'reviews', label: 'Reviews', hint: 'Weekly to annual reviews' },
];

export default function SettingsView() {
  const settings = useSettings();
  const resetToSeed = useData((s) => s.resetToSeed);
  const toast = useUi((s) => s.toast);

  return (
    <div className="view view-narrow">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Settings</h2>
        <p className="view-sub">Meridian should fit you — not the other way around.</p>
      </motion.header>

      <motion.div className="col g-6" variants={stagger(0.02, 0.05)} initial="hidden" animate="show">
        <motion.section variants={staggerItem} className="panel panel-pad col g-6">
          <h3 className="panel-title">Appearance</h3>
          <div className="row between g-4 wrap">
            <span className="t-body-sm">Theme</span>
            <Segmented
              layoutNs="theme"
              label="Theme"
              value={settings.theme}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              onChange={settings.setTheme}
            />
          </div>
          <div className="row between g-4 wrap">
            <span className="t-body-sm">Accent</span>
            <div className="row g-3" role="radiogroup" aria-label="Accent color">
              {ACCENTS.map((a) => (
                <motion.button
                  key={a.id}
                  role="radio"
                  aria-checked={settings.accent === a.id}
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => settings.setAccent(a.id)}
                  whileTap={{ scale: 0.85 }}
                  transition={spring.bouncy}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 'var(--r-full)',
                    background: `var(--${a.id === 'evergreen' ? 'evergreen' : a.id}-500)`,
                    border: settings.accent === a.id ? '2px solid var(--ink)' : '2px solid transparent',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="row between g-4 wrap">
            <span className="t-body-sm">Density</span>
            <Segmented
              layoutNs="density"
              label="Density"
              value={settings.density}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ]}
              onChange={settings.setDensity}
            />
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="panel panel-pad col g-5">
          <div>
            <h3 className="panel-title">Modules</h3>
            <p className="t-caption ink-faint" style={{ marginTop: 4 }}>
              Turn off what you don't use. Less surface, more focus.
            </p>
          </div>
          {MODULES.map((m) => (
            <div key={m.key} className="row between g-4">
              <div className="col">
                <span className="t-body-sm" style={{ fontWeight: 500 }}>{m.label}</span>
                <span className="t-micro ink-faint">{m.hint}</span>
              </div>
              <Switch
                checked={settings.modules[m.key]}
                onChange={(v) => settings.setModule(m.key, v)}
                label={`${m.label} module`}
              />
            </div>
          ))}
        </motion.section>

        <motion.section variants={staggerItem} className="panel panel-pad col g-5">
          <h3 className="panel-title">Focus timer</h3>
          <div className="grid-3" style={{ gap: 'var(--sp-5)' }}>
            <Input
              label="Work (min)"
              type="number"
              min={5}
              value={settings.pomodoro.work}
              onChange={(e) => settings.setPomodoro({ work: Number(e.target.value) || 25 })}
            />
            <Input
              label="Break (min)"
              type="number"
              min={1}
              value={settings.pomodoro.break}
              onChange={(e) => settings.setPomodoro({ break: Number(e.target.value) || 5 })}
            />
            <Input
              label="Long break (min)"
              type="number"
              min={5}
              value={settings.pomodoro.longBreak}
              onChange={(e) => settings.setPomodoro({ longBreak: Number(e.target.value) || 15 })}
            />
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="panel panel-pad col g-4">
          <h3 className="panel-title">Data</h3>
          <p className="t-body-sm ink-subtle">
            Everything lives in your browser's local storage. No account, no server, no telemetry.
          </p>
          <div className="row g-4">
            <Button
              onClick={() => {
                const data = localStorage.getItem('meridian.data');
                if (!data) return;
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meridian-export-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ message: 'Workspace exported', kind: 'success' });
              }}
            >
              Export workspace
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Reset the workspace to the demo seed? Your data will be replaced.')) {
                  resetToSeed();
                  toast({ message: 'Workspace reset to seed', kind: 'danger' });
                }
              }}
            >
              Reset to demo data
            </Button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

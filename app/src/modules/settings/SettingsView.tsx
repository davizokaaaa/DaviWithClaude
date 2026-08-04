/** Settings — appearance, modules (the anti-bloat lever), focus, and data. */

import { motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useSettings, useUi } from '@/core/store/ui';
import { Button, Segmented, Switch, Input } from '@/ui/primitives';
import { riseIn, stagger, staggerItem, spring } from '@/lib/motion';
import type { AccentPref, ModuleFlags } from '@/core/types';

const ACCENTS: { id: AccentPref; label: string }[] = [
  { id: 'indigo', label: 'Azul-tinta' },
  { id: 'evergreen', label: 'Floresta' },
  { id: 'amber', label: 'Latão' },
  { id: 'rose', label: 'Terracota' },
  { id: 'graphite', label: 'Pedra' },
];

const MODULES: { key: keyof ModuleFlags; label: string; hint: string }[] = [
  { key: 'focus', label: 'Foco', hint: 'Pomodoro e sessões de trabalho profundo' },
  { key: 'habits', label: 'Hábitos', hint: 'Rastreador de hábitos com congelamento de sequências' },
  { key: 'goals', label: 'Metas', hint: 'OKRs e resultados-chave' },
  { key: 'knowledge', label: 'Notas', hint: 'Base de conhecimento, diário, lista de leituras' },
  { key: 'finance', label: 'Finanças', hint: 'Visão mensal do dinheiro' },
  { key: 'reviews', label: 'Revisões', hint: 'Revisões da semanal à anual' },
];

export default function SettingsView() {
  const settings = useSettings();
  const resetToSeed = useData((s) => s.resetToSeed);
  const toast = useUi((s) => s.toast);

  return (
    <div className="view view-narrow">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Settings</h2>
        <p className="view-sub">O Meridian deve se ajustar a você — não o contrário.</p>
      </motion.header>

      <motion.div className="col g-6" variants={stagger(0.02, 0.05)} initial="hidden" animate="show">
        <motion.section variants={staggerItem} className="panel panel-pad col g-6">
          <h3 className="panel-title">Aparência</h3>
          <div className="row between g-4 wrap">
            <span className="t-body-sm">Tema</span>
            <Segmented
              layoutNs="theme"
              label="Tema"
              value={settings.theme}
              options={[
                { value: 'system', label: 'Sistema' },
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
              ]}
              onChange={settings.setTheme}
            />
          </div>
          <div className="row between g-4 wrap">
            <span className="t-body-sm">Cor de destaque</span>
            <div className="row g-3" role="radiogroup" aria-label="Cor de destaque">
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
            <span className="t-body-sm">Densidade</span>
            <Segmented
              layoutNs="density"
              label="Densidade"
              value={settings.density}
              options={[
                { value: 'comfortable', label: 'Confortável' },
                { value: 'compact', label: 'Compacta' },
              ]}
              onChange={settings.setDensity}
            />
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="panel panel-pad col g-5">
          <div>
            <h3 className="panel-title">Módulos</h3>
            <p className="t-caption ink-faint" style={{ marginTop: 4 }}>
              Desligue o que você não usa. Menos superfície, mais foco.
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
                label={`Módulo ${m.label}`}
              />
            </div>
          ))}
        </motion.section>

        <motion.section variants={staggerItem} className="panel panel-pad col g-5">
          <h3 className="panel-title">Timer de foco</h3>
          <div className="grid-3" style={{ gap: 'var(--sp-5)' }}>
            <Input
              label="Trabalho (min)"
              type="number"
              min={5}
              value={settings.pomodoro.work}
              onChange={(e) => settings.setPomodoro({ work: Number(e.target.value) || 25 })}
            />
            <Input
              label="Pausa (min)"
              type="number"
              min={1}
              value={settings.pomodoro.break}
              onChange={(e) => settings.setPomodoro({ break: Number(e.target.value) || 5 })}
            />
            <Input
              label="Pausa longa (min)"
              type="number"
              min={5}
              value={settings.pomodoro.longBreak}
              onChange={(e) => settings.setPomodoro({ longBreak: Number(e.target.value) || 15 })}
            />
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="panel panel-pad col g-4">
          <h3 className="panel-title">Dados</h3>
          <p className="t-body-sm ink-subtle">
            Tudo vive no armazenamento local do seu navegador. Sem conta, sem servidor, sem telemetria.
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
                toast({ message: 'Espaço exportado', kind: 'success' });
              }}
            >
              Exportar dados
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Apagar tudo e começar do zero? Seus dados serão removidos.')) {
                  resetToSeed();
                  toast({ message: 'Espaço zerado', kind: 'danger' });
                }
              }}
            >
              Começar do zero
            </Button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

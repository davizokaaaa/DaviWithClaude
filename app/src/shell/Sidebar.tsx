/** Sidebar navigation + mobile dock. The active item's background slides
 *  between items via a shared layoutId — the Linear signature move. */

import { motion } from 'motion/react';
import clsx from 'clsx';
import { spring } from '@/lib/motion';
import { useUi, useSettings } from '@/core/store/ui';
import { useData } from '@/core/store/data';
import type { ViewId } from '@/core/types';

interface NavDef {
  view: ViewId;
  label: string;
  icon: string;
  section: 'plan' | 'organize' | 'grow';
  moduleKey?: 'finance' | 'habits' | 'knowledge' | 'goals' | 'reviews' | 'focus';
}

const NAV: NavDef[] = [
  { view: 'today', label: 'Hoje', icon: '☀', section: 'plan' },
  { view: 'inbox', label: 'Entrada', icon: '⊙', section: 'plan' },
  { view: 'upcoming', label: 'Próximos', icon: '⤳', section: 'plan' },
  { view: 'calendar', label: 'Calendário', icon: '▦', section: 'plan' },
  { view: 'focus', label: 'Foco', icon: '◎', section: 'plan', moduleKey: 'focus' },

  { view: 'projects', label: 'Projetos', icon: '▣', section: 'organize' },
  { view: 'timeline', label: 'Linha do Tempo', icon: '≡', section: 'organize' },
  { view: 'matrix', label: 'Matriz', icon: '⊞', section: 'organize' },
  { view: 'notes', label: 'Notas', icon: '✎', section: 'organize', moduleKey: 'knowledge' },

  { view: 'dashboard', label: 'Painel', icon: '◧', section: 'grow' },
  { view: 'goals', label: 'Metas', icon: '◈', section: 'grow', moduleKey: 'goals' },
  { view: 'habits', label: 'Hábitos', icon: '↻', section: 'grow', moduleKey: 'habits' },
  { view: 'areas', label: 'Áreas da Vida', icon: '❖', section: 'grow' },
  { view: 'finance', label: 'Finanças', icon: '▲', section: 'grow', moduleKey: 'finance' },
  { view: 'reviews', label: 'Revisões', icon: '✓', section: 'grow', moduleKey: 'reviews' },
];

const SECTIONS: { id: NavDef['section']; label: string }[] = [
  { id: 'plan', label: 'Planejar' },
  { id: 'organize', label: 'Organizar' },
  { id: 'grow', label: 'Evoluir' },
];

export function Sidebar() {
  const route = useUi((s) => s.route);
  const navigate = useUi((s) => s.navigate);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const modules = useSettings((s) => s.modules);
  const inboxCount = useData((s) => s.tasks.filter((t) => t.status === 'inbox').length);

  const visible = NAV.filter((n) => !n.moduleKey || modules[n.moduleKey]);

  return (
    <nav className={clsx('sidebar', collapsed && 'is-collapsed')} aria-label="Navegação principal">
      <div className="sidebar-head">
        <span className="sidebar-logo" aria-hidden>M</span>
        {!collapsed && <span className="sidebar-wordmark">Meridian</span>}
      </div>
      <div className="sidebar-nav">
        {SECTIONS.map((section) => {
          const items = visible.filter((n) => n.section === section.id);
          if (!items.length) return null;
          return (
            <div key={section.id} className="col" style={{ gap: 1 }}>
              {!collapsed && <p className="t-eyebrow sidebar-section">{section.label}</p>}
              {items.map((item) => {
                const active =
                  route.view === item.view || (item.view === 'projects' && route.view === 'project');
                return (
                  <button
                    key={item.view}
                    className={clsx('navitem', active && 'is-active')}
                    onClick={() => navigate({ view: item.view })}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && (
                      <motion.span className="navitem-bg" layoutId="nav-active" transition={spring.smooth} />
                    )}
                    <span className="navitem-icon" aria-hidden>{item.icon}</span>
                    {!collapsed && <span className="navitem-label">{item.label}</span>}
                    {!collapsed && item.view === 'inbox' && inboxCount > 0 && (
                      <span className="navitem-count">{inboxCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="sidebar-foot">
        <button
          className={clsx('navitem', route.view === 'settings' && 'is-active')}
          onClick={() => navigate({ view: 'settings' })}
          title={collapsed ? 'Ajustes' : undefined}
        >
          {route.view === 'settings' && (
            <motion.span className="navitem-bg" layoutId="nav-active" transition={spring.smooth} />
          )}
          <span className="navitem-icon" aria-hidden>⚙</span>
          {!collapsed && <span className="navitem-label">Ajustes</span>}
        </button>
      </div>
    </nav>
  );
}

/** Bottom dock for small screens: the five daily-driver views. */
export function MobileDock() {
  const route = useUi((s) => s.route);
  const navigate = useUi((s) => s.navigate);
  const items: { view: ViewId; label: string; icon: string }[] = [
    { view: 'today', label: 'Hoje', icon: '☀' },
    { view: 'inbox', label: 'Entrada', icon: '⊙' },
    { view: 'calendar', label: 'Calendário', icon: '▦' },
    { view: 'projects', label: 'Projetos', icon: '▣' },
    { view: 'dashboard', label: 'Mais', icon: '◧' },
  ];
  return (
    <div className="mobiledock" role="navigation" aria-label="Navegação rápida">
      {items.map((i) => (
        <button
          key={i.view}
          className={clsx('mobiledock-item', route.view === i.view && 'is-active')}
          onClick={() => navigate({ view: i.view })}
        >
          <span className="mobiledock-icon" aria-hidden>{i.icon}</span>
          {i.label}
        </button>
      ))}
    </div>
  );
}

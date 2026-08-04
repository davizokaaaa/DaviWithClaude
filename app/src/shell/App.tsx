/** Application shell: layout, routing, global hotkeys, appearance, overlays. */

import { Suspense, useEffect } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { VIEWS } from '@/modules/registry';
import { Sidebar, MobileDock } from '@/shell/Sidebar';
import { CommandPalette, SearchGlyph } from '@/ui/CommandPalette';
import { QuickCapture } from '@/ui/QuickCapture';
import { ToastHost } from '@/ui/overlays';
import { TaskDetailHost } from '@/modules/tasks/TaskDetail';
import { ShortcutsDialog } from '@/shell/ShortcutsDialog';
import { PlanningRitual, ShutdownRitual } from '@/modules/rituals/Rituals';
import { applyAppearance, useSettings, useUi } from '@/core/store/ui';
import { useHotkeys, modLabel } from '@/lib/hooks/useHotkeys';
import { viewIn } from '@/lib/motion';
import type { ViewId } from '@/core/types';

function ViewSkeleton() {
  return (
    <div className="view" aria-busy="true" aria-label="Loading view">
      <div className="skeleton" style={{ width: 220, height: 34, marginBottom: 24 }} />
      <div className="skeleton" style={{ width: '100%', height: 96, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: '100%', height: 96, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: '70%', height: 96 }} />
    </div>
  );
}

export function App() {
  const route = useUi((s) => s.route);
  const navigate = useUi((s) => s.navigate);
  const openOverlay = useUi((s) => s.openOverlay);
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const density = useSettings((s) => s.density);

  useEffect(() => {
    applyAppearance({ theme, accent, density });
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyAppearance({ theme, accent, density });
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme, accent, density]);

  const goto = (view: ViewId) => () => navigate({ view });
  useHotkeys(
    [
      { combo: 'mod+k', handler: () => openOverlay({ kind: 'palette' }), allowInInput: true },
      { combo: 'shift+mod+n', handler: () => openOverlay({ kind: 'capture' }), allowInInput: true },
      { combo: '?', handler: () => openOverlay({ kind: 'shortcuts' }) },
      { combo: 'g t', handler: goto('today') },
      { combo: 'g i', handler: goto('inbox') },
      { combo: 'g u', handler: goto('upcoming') },
      { combo: 'g c', handler: goto('calendar') },
      { combo: 'g p', handler: goto('projects') },
      { combo: 'g f', handler: goto('focus') },
      { combo: 'g h', handler: goto('habits') },
      { combo: 'g g', handler: goto('goals') },
      { combo: 'g n', handler: goto('notes') },
      { combo: 'g d', handler: goto('dashboard') },
    ],
    [],
  );

  const def = VIEWS[route.view] ?? VIEWS.today;
  const View = def.component;

  return (
    <LayoutGroup>
      <div className="shell">
        <a href="#main-content" className="sr-only skip-link">Skip to content</a>
        <Sidebar />
        <div className="main">
          <header className="topbar">
            <h1 className="topbar-title">{def.title}</h1>
            <span className="spacer" />
            <button className="searchbtn" onClick={() => openOverlay({ kind: 'palette' })}>
              <SearchGlyph />
              <span className="searchbtn-label">Search or jump to…</span>
              <kbd className="kbd">{modLabel} K</kbd>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openOverlay({ kind: 'capture' })}
              title={`Quick capture (${modLabel}⇧N)`}
            >
              + New
            </button>
          </header>
          <main className="content" id="main-content" tabIndex={-1}>
            <AnimatePresence mode="wait">
              <motion.div
                key={route.view + (route.param ?? '')}
                variants={viewIn}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <Suspense fallback={<ViewSkeleton />}>
                  <View param={route.param} />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <MobileDock />
      </div>

      {/* Floating layers */}
      <CommandPalette />
      <QuickCapture />
      <TaskDetailHost />
      <ShortcutsDialog />
      <PlanningRitual />
      <ShutdownRitual />
      <ToastHost />
    </LayoutGroup>
  );
}

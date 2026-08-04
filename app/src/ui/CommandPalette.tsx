/**
 * ⌘K Command Palette — navigation, actions, and instant search over tasks,
 * projects and notes in one surface. Fuzzy subsequence matching, grouped
 * results, full keyboard model.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import { paletteIn, scrimIn } from '@/lib/motion';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { useSettings } from '@/core/store/ui';
import { modLabel } from '@/lib/hooks/useHotkeys';
import type { Route } from '@/core/types';

interface Command {
  id: string;
  group: string;
  title: string;
  hint?: string;
  kbd?: string;
  run: () => void;
}

/** Fuzzy subsequence score: lower is better; null = no match. */
function fuzzy(query: string, text: string): number | null {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let lastHit = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += lastHit >= 0 ? ti - lastHit - 1 : ti * 0.5;
      lastHit = ti;
      qi++;
    }
  }
  if (qi < q.length) return null;
  return score + (t.length - q.length) * 0.01;
}

export function CommandPalette() {
  const overlay = useUi((s) => s.overlay);
  const close = useUi((s) => s.closeOverlay);
  const open = overlay?.kind === 'palette';
  const navigate = useUi((s) => s.navigate);
  const openOverlay = useUi((s) => s.openOverlay);
  const toast = useUi((s) => s.toast);
  const modules = useSettings((s) => s.modules);
  const setTheme = useSettings((s) => s.setTheme);

  const tasks = useData((s) => s.tasks);
  const projects = useData((s) => s.projects);
  const notes = useData((s) => s.notes);
  const completeTask = useData((s) => s.completeTask);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const go = (route: Route) => {
    navigate(route);
    close();
  };

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      { id: 'nav-today', group: 'Go to', title: 'Today', kbd: 'G T', run: () => go({ view: 'today' }) },
      { id: 'nav-inbox', group: 'Go to', title: 'Inbox', kbd: 'G I', run: () => go({ view: 'inbox' }) },
      { id: 'nav-upcoming', group: 'Go to', title: 'Upcoming', kbd: 'G U', run: () => go({ view: 'upcoming' }) },
      { id: 'nav-cal', group: 'Go to', title: 'Calendar', kbd: 'G C', run: () => go({ view: 'calendar' }) },
      { id: 'nav-projects', group: 'Go to', title: 'Projects', kbd: 'G P', run: () => go({ view: 'projects' }) },
      { id: 'nav-matrix', group: 'Go to', title: 'Eisenhower Matrix', run: () => go({ view: 'matrix' }) },
      { id: 'nav-timeline', group: 'Go to', title: 'Timeline', run: () => go({ view: 'timeline' }) },
      ...(modules.focus ? [{ id: 'nav-focus', group: 'Go to', title: 'Focus', kbd: 'G F', run: () => go({ view: 'focus' }) }] : []),
      ...(modules.habits ? [{ id: 'nav-habits', group: 'Go to', title: 'Habits', kbd: 'G H', run: () => go({ view: 'habits' }) }] : []),
      ...(modules.goals ? [{ id: 'nav-goals', group: 'Go to', title: 'Goals', kbd: 'G G', run: () => go({ view: 'goals' }) }] : []),
      ...(modules.knowledge ? [{ id: 'nav-notes', group: 'Go to', title: 'Notes', kbd: 'G N', run: () => go({ view: 'notes' }) }] : []),
      ...(modules.finance ? [{ id: 'nav-fin', group: 'Go to', title: 'Finance', run: () => go({ view: 'finance' }) }] : []),
      ...(modules.reviews ? [{ id: 'nav-rev', group: 'Go to', title: 'Reviews', run: () => go({ view: 'reviews' }) }] : []),
      { id: 'nav-dash', group: 'Go to', title: 'Dashboard', kbd: 'G D', run: () => go({ view: 'dashboard' }) },
      { id: 'nav-settings', group: 'Go to', title: 'Settings', run: () => go({ view: 'settings' }) },
    ];
    const actions: Command[] = [
      { id: 'act-capture', group: 'Actions', title: 'Quick capture', hint: 'Add a task from anywhere', kbd: `${modLabel}⇧N`, run: () => openOverlay({ kind: 'capture' }) },
      { id: 'act-plan', group: 'Actions', title: 'Plan today', hint: 'Guided daily planning', run: () => openOverlay({ kind: 'planning' }) },
      { id: 'act-shutdown', group: 'Actions', title: 'Daily shutdown', hint: 'Close the day deliberately', run: () => openOverlay({ kind: 'shutdown' }) },
      { id: 'act-shortcuts', group: 'Actions', title: 'Keyboard shortcuts', kbd: '?', run: () => openOverlay({ kind: 'shortcuts' }) },
      { id: 'act-dark', group: 'Actions', title: 'Switch to dark theme', run: () => { setTheme('dark'); close(); } },
      { id: 'act-light', group: 'Actions', title: 'Switch to light theme', run: () => { setTheme('light'); close(); } },
    ];
    // Content search only when there's a query — keeps the default list calm.
    const content: Command[] = query
      ? [
          ...tasks
            .filter((t) => t.status !== 'done' && t.status !== 'dropped')
            .map((t) => ({
              id: `task-${t.id}`,
              group: 'Tasks',
              title: t.title,
              hint: 'Open task',
              run: () => {
                openOverlay({ kind: 'task', taskId: t.id });
              },
            })),
          ...tasks
            .filter((t) => t.status !== 'done' && t.status !== 'dropped')
            .slice(0, 50)
            .map((t) => ({
              id: `done-${t.id}`,
              group: 'Tasks',
              title: `Complete: ${t.title}`,
              run: () => {
                completeTask(t.id);
                toast({ message: 'Completed', kind: 'success' });
                close();
              },
            })),
          ...projects.map((p) => ({
            id: `proj-${p.id}`,
            group: 'Projects',
            title: p.name,
            hint: 'Open project',
            run: () => go({ view: 'project', param: p.id }),
          })),
          ...notes.map((n) => ({
            id: `note-${n.id}`,
            group: 'Notes',
            title: n.title,
            hint: n.kind,
            run: () => go({ view: 'notes', param: n.id }),
          })),
        ]
      : [];
    return [...actions, ...nav, ...content];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tasks, projects, notes, modules]);

  const results = useMemo(() => {
    const scored = commands
      .map((c) => ({ c, s: fuzzy(query, c.title) }))
      .filter((x): x is { c: Command; s: number } => x.s !== null)
      .sort((a, b) => a.s - b.s)
      .slice(0, 32)
      .map((x) => x.c);
    return scored;
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const r of results) {
      const list = map.get(r.group) ?? [];
      list.push(r);
      map.set(r.group, list);
    }
    return [...map.entries()];
  }, [results]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === 'Escape') {
      close();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay-root" style={{ zIndex: 'var(--z-palette)', alignItems: 'flex-start' }}>
          <motion.div className="scrim" variants={scrimIn} initial="hidden" animate="show" exit="exit" onClick={close} />
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            variants={paletteIn}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="palette-input-row">
              <SearchGlyph />
              <input
                ref={inputRef}
                className="palette-input"
                placeholder="Search or run a command…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Search commands"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
              />
              <kbd className="kbd">esc</kbd>
            </div>
            <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
              {grouped.length === 0 && (
                <p className="palette-empty">Nothing matches “{query}”.</p>
              )}
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <p className="palette-group">{group}</p>
                  {items.map((item) => {
                    const idx = results.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={idx === active}
                        data-active={idx === active}
                        className={clsx('palette-item', idx === active && 'is-active')}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => item.run()}
                      >
                        <span className="truncate">{item.title}</span>
                        {item.hint && <span className="palette-hint truncate">{item.hint}</span>}
                        {item.kbd && <kbd className="kbd">{item.kbd}</kbd>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function SearchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden style={{ color: 'var(--ink-faint)', flex: 'none' }}>
      <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5 12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

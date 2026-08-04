/**
 * Quick Capture (⌘⇧N): one input, natural-language parsing, zero friction.
 * "review PR !high today 45m #launch @atlas" → fully structured task.
 * Every parsed token is reflected back as a chip before saving — the system
 * never guesses silently.
 */

import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { paletteIn, scrimIn, spring } from '@/lib/motion';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Chip, Dot } from '@/ui/primitives';
import { addDaysKey, humanDay, todayKey } from '@/lib/dates';
import type { Priority } from '@/core/types';

interface Parsed {
  title: string;
  priority?: Priority;
  plannedFor?: string;
  estimate?: number;
  tags: string[];
  projectId?: string;
  projectName?: string;
}

const PRIORITY_TOKENS: Record<string, Priority> = {
  '!urgent': 'urgent', '!high': 'high', '!medium': 'medium', '!med': 'medium', '!low': 'low',
};

export function QuickCapture() {
  const overlay = useUi((s) => s.overlay);
  const open = overlay?.kind === 'capture';
  const close = useUi((s) => s.closeOverlay);
  const toast = useUi((s) => s.toast);
  const addTask = useData((s) => s.addTask);
  const projects = useData((s) => s.projects);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo<Parsed>(() => {
    let title = text;
    const out: Parsed = { title: '', tags: [] };

    for (const [token, pri] of Object.entries(PRIORITY_TOKENS)) {
      if (title.toLowerCase().includes(token)) {
        out.priority = pri;
        title = title.replace(new RegExp(token.replace('!', '\\!'), 'i'), '');
      }
    }

    const today = todayKey();
    const dateTokens: [RegExp, () => string][] = [
      [/\btoday\b/i, () => today],
      [/\btomorrow\b/i, () => addDaysKey(today, 1)],
      [/\bnext week\b/i, () => addDaysKey(today, 7)],
    ];
    for (const [re, get] of dateTokens) {
      if (re.test(title)) {
        out.plannedFor = get();
        title = title.replace(re, '');
        break;
      }
    }

    const est = title.match(/\b(\d+)\s*(m|min|h)\b/i);
    if (est) {
      const n = parseInt(est[1], 10);
      out.estimate = est[2].toLowerCase() === 'h' ? n * 60 : n;
      title = title.replace(est[0], '');
    }

    const tagMatches = title.match(/#[\w-]+/g);
    if (tagMatches) {
      out.tags = tagMatches.map((t) => t.slice(1));
      for (const t of tagMatches) title = title.replace(t, '');
    }

    const projMatch = title.match(/@([\w-]+)/);
    if (projMatch) {
      const q = projMatch[1].toLowerCase();
      const proj = projects.find((p) => p.name.toLowerCase().includes(q));
      if (proj) {
        out.projectId = proj.id;
        out.projectName = proj.name;
        title = title.replace(projMatch[0], '');
      }
    }

    out.title = title.replace(/\s{2,}/g, ' ').trim();
    return out;
  }, [text, projects]);

  const save = () => {
    if (!parsed.title) return;
    const proj = projects.find((p) => p.id === parsed.projectId);
    addTask({
      title: parsed.title,
      status: parsed.plannedFor ? 'todo' : 'inbox',
      priority: parsed.priority ?? 'none',
      plannedFor: parsed.plannedFor,
      estimate: parsed.estimate,
      tags: parsed.tags,
      projectId: parsed.projectId,
      areaId: proj?.areaId,
      columnId: proj?.columns[0]?.id,
    });
    toast({
      message: parsed.plannedFor ? `Added to ${humanDay(parsed.plannedFor)}` : 'Captured to Inbox',
      kind: 'success',
    });
    setText('');
    close();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay-root" style={{ zIndex: 'var(--z-palette)', alignItems: 'flex-start' }}>
          <motion.div className="scrim" variants={scrimIn} initial="hidden" animate="show" exit="exit" onClick={close} />
          <motion.div
            className="palette capture"
            role="dialog"
            aria-modal="true"
            aria-label="Quick capture"
            variants={paletteIn}
            initial="hidden"
            animate="show"
            exit="exit"
            onAnimationComplete={() => inputRef.current?.focus()}
          >
            <div className="palette-input-row">
              <PlusGlyph />
              <input
                ref={inputRef}
                className="palette-input"
                placeholder="Capture a task…  try “Draft spec !high tomorrow 45m #launch @atlas”"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save();
                  if (e.key === 'Escape') close();
                }}
                aria-label="Task title"
              />
            </div>
            <AnimatePresence>
              {(parsed.priority || parsed.plannedFor || parsed.estimate || parsed.tags.length > 0 || parsed.projectName) && (
                <motion.div
                  className="capture-chips"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto', transition: spring.smooth }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="row g-3 wrap" style={{ padding: 'var(--sp-4) var(--sp-6) var(--sp-5)' }}>
                    {parsed.plannedFor && <Chip active>{humanDay(parsed.plannedFor)}</Chip>}
                    {parsed.priority && <Chip active>{parsed.priority}</Chip>}
                    {parsed.estimate && <Chip active>{parsed.estimate}m</Chip>}
                    {parsed.projectName && (
                      <Chip active>
                        <Dot hue="indigo" />
                        {parsed.projectName}
                      </Chip>
                    )}
                    {parsed.tags.map((t) => (
                      <Chip key={t}>#{t}</Chip>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="capture-foot">
              <span className="t-micro ink-faint">
                <kbd className="kbd">↵</kbd> save · <kbd className="kbd">esc</kbd> dismiss · goes to {parsed.plannedFor ? 'your day plan' : 'Inbox'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function PlusGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden style={{ color: 'var(--accent)', flex: 'none' }}>
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

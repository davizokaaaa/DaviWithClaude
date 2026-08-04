/**
 * Global keyboard layer.
 *
 * One listener, one registry. Single-key shortcuts are suppressed while the
 * user is typing; chords (mod+K) always fire. Registration order is LIFO so
 * overlays can shadow the app underneath them.
 */

import { useEffect } from 'react';

export interface Hotkey {
  /** e.g. 'mod+k', 'shift+mod+n', 'g t' (sequence), 't' */
  combo: string;
  handler: (e: KeyboardEvent) => void;
  /** fire even when an input is focused */
  allowInInput?: boolean;
}

type Entry = Hotkey & { id: number };

const registry: Entry[] = [];
let nextId = 0;
let pendingSequence = '';
let sequenceTimer = 0;

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform);
export const modLabel = isMac ? '⌘' : 'Ctrl';

function comboMatches(combo: string, e: KeyboardEvent): boolean {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const needMod = parts.includes('mod');
  const needShift = parts.includes('shift');
  const needAlt = parts.includes('alt');
  const mod = isMac ? e.metaKey : e.ctrlKey;
  if (needMod !== mod) return false;
  if (needShift !== e.shiftKey) return false;
  if (needAlt !== e.altKey) return false;
  return e.key.toLowerCase() === key;
}

function inEditable(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  return (
    el.isContentEditable ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  );
}

function onKeyDown(e: KeyboardEvent) {
  const editing = inEditable(e);

  // Sequences like 'g t': only when not typing, no modifiers.
  if (!editing && !e.metaKey && !e.ctrlKey && !e.altKey && /^[a-z?]$/i.test(e.key)) {
    const token = e.key.toLowerCase();
    const candidate = pendingSequence ? `${pendingSequence} ${token}` : token;
    // Walk newest-first so overlays win.
    for (let i = registry.length - 1; i >= 0; i--) {
      const entry = registry[i];
      if (entry.combo === candidate) {
        e.preventDefault();
        pendingSequence = '';
        window.clearTimeout(sequenceTimer);
        entry.handler(e);
        return;
      }
    }
    const hasPrefix = registry.some((r) => r.combo.startsWith(`${candidate} `));
    if (hasPrefix) {
      e.preventDefault();
      pendingSequence = candidate;
      window.clearTimeout(sequenceTimer);
      sequenceTimer = window.setTimeout(() => (pendingSequence = ''), 900);
      return;
    }
    pendingSequence = '';
  }

  for (let i = registry.length - 1; i >= 0; i--) {
    const entry = registry[i];
    if (entry.combo.includes(' ')) continue; // sequences handled above
    if (editing && !entry.allowInInput && !entry.combo.includes('mod')) continue;
    if (comboMatches(entry.combo, e)) {
      e.preventDefault();
      entry.handler(e);
      return;
    }
  }
}

let listening = false;
function ensureListener() {
  if (!listening && typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown);
    listening = true;
  }
}

export function useHotkeys(hotkeys: Hotkey[], deps: unknown[] = []) {
  useEffect(() => {
    ensureListener();
    const entries = hotkeys.map((h) => ({ ...h, id: nextId++ }));
    registry.push(...entries);
    return () => {
      for (const e of entries) {
        const idx = registry.findIndex((r) => r.id === e.id);
        if (idx >= 0) registry.splice(idx, 1);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

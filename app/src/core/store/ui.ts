/** Ephemeral UI state: routing, overlays, toasts, focus timer. Never persisted
 *  except settings (separate store below) and the route (sessionStorage). */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccentPref, DensityPref, ID, ModuleFlags, Route, ThemePref } from '@/core/types';
import { uid } from '@/lib/id';

/* ── Settings (persisted) ─────────────────────────────────────────────── */

interface SettingsState {
  theme: ThemePref;
  accent: AccentPref;
  density: DensityPref;
  modules: ModuleFlags;
  /** Pomodoro lengths in minutes */
  pomodoro: { work: number; break: number; longBreak: number };
  weekStartsMonday: boolean;
  setTheme: (t: ThemePref) => void;
  setAccent: (a: AccentPref) => void;
  setDensity: (d: DensityPref) => void;
  setModule: (key: keyof ModuleFlags, on: boolean) => void;
  setPomodoro: (p: Partial<SettingsState['pomodoro']>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      accent: 'indigo',
      density: 'comfortable',
      modules: { finance: true, habits: true, knowledge: true, goals: true, reviews: true, focus: true },
      pomodoro: { work: 25, break: 5, longBreak: 15 },
      weekStartsMonday: true,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
      setModule: (key, on) => set((s) => ({ modules: { ...s.modules, [key]: on } })),
      setPomodoro: (p) => set((s) => ({ pomodoro: { ...s.pomodoro, ...p } })),
    }),
    { name: 'meridian.settings', version: 1 },
  ),
);

/** Applies theme/accent/density to <html> — called from a top-level effect. */
export function applyAppearance(s: Pick<SettingsState, 'theme' | 'accent' | 'density'>) {
  const root = document.documentElement;
  const dark =
    s.theme === 'dark' ||
    (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.accent = s.accent;
  root.dataset.density = s.density;
}

/* ── Toasts ───────────────────────────────────────────────────────────── */

export interface Toast {
  id: ID;
  message: string;
  kind?: 'default' | 'success' | 'danger';
  /** Optional single action (e.g. Undo). */
  action?: { label: string; onAction: () => void };
}

/* ── Route + overlays ─────────────────────────────────────────────────── */

export type OverlayId =
  | { kind: 'palette' }
  | { kind: 'capture' }
  | { kind: 'task'; taskId: ID }
  | { kind: 'shortcuts' }
  | { kind: 'planning' }
  | { kind: 'shutdown' };

interface UiState {
  route: Route;
  navigate: (route: Route) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  overlay: OverlayId | null;
  openOverlay: (o: OverlayId) => void;
  closeOverlay: () => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: ID) => void;

  /** Live focus timer — ticking state lives here so any view can render it. */
  focus: {
    sessionId: ID | null;
    endsAt: number | null;
    paused: boolean;
    pausedRemaining: number | null;
  };
  setFocus: (f: Partial<UiState['focus']>) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      route: { view: 'today' },
      navigate: (route) => set({ route, overlay: null }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      overlay: null,
      openOverlay: (overlay) => set({ overlay }),
      closeOverlay: () => set({ overlay: null }),

      toasts: [],
      toast: (t) => {
        const id = uid('toast');
        set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
        window.setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
        }, t.action ? 6000 : 3600);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

      focus: { sessionId: null, endsAt: null, paused: false, pausedRemaining: null },
      setFocus: (f) => set((s) => ({ focus: { ...s.focus, ...f } })),
    }),
    {
      name: 'meridian.ui',
      version: 1,
      storage: {
        getItem: (name) => {
          const raw = sessionStorage.getItem(name);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      // Only the route and sidebar survive a reload; overlays and toasts don't.
      partialize: (s) =>
        ({ route: s.route, sidebarCollapsed: s.sidebarCollapsed }) as UiState,
    },
  ),
);

/**
 * The motion language.
 *
 * Two rules, applied everywhere:
 *  1. Anything that behaves like an object — a card being dragged, a panel
 *     sliding, something scaling under the cursor — uses a SPRING. Physics is
 *     what makes an interface feel tactile rather than animated.
 *  2. Anything that is purely a change of state — opacity, colour, a skeleton
 *     shimmer — uses a duration + easing curve. Springs on opacity look mushy.
 *
 * Nothing appears or disappears instantly: every variant here defines an exit.
 */

import type { Transition, Variants } from 'motion/react';

/* ── Springs ──────────────────────────────────────────────────────────── */

export const spring = {
  /** Default for layout shifts and panel movement. Settles without wobble. */
  smooth: { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 },
  /** Buttons, checkboxes, small scale feedback. Quick and crisp. */
  snappy: { type: 'spring', stiffness: 600, damping: 32, mass: 0.7 },
  /** Drag release, magic-button style overshoot. Has a deliberate bounce. */
  bouncy: { type: 'spring', stiffness: 460, damping: 20, mass: 0.8 },
  /** Big surfaces — dialogs, drawers, route transitions. */
  gentle: { type: 'spring', stiffness: 260, damping: 30, mass: 1 },
  /** Numbers, rings, progress. Slow enough to read the change. */
  measured: { type: 'spring', stiffness: 140, damping: 24, mass: 1 },
} satisfies Record<string, Transition>;

/* ── Duration-based ───────────────────────────────────────────────────── */

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  snap: [0.16, 1, 0.3, 1],
  entrance: [0.05, 0.7, 0.1, 1],
} as const;

export const fade = {
  fast: { duration: 0.14, ease: ease.out },
  base: { duration: 0.2, ease: ease.out },
  slow: { duration: 0.32, ease: ease.out },
} satisfies Record<string, Transition>;

/* ── Variants ─────────────────────────────────────────────────────────── */

/** Content entering a region that already exists. Rises 6px, never more. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: spring.smooth },
  exit: { opacity: 0, y: -4, transition: fade.fast },
};

/** A whole view swapping in. Slightly larger travel than riseIn. */
export const viewIn: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.994 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...spring.gentle, opacity: fade.base },
  },
  exit: { opacity: 0, y: -6, scale: 0.996, transition: fade.fast },
};

/**
 * List container. 22ms per child is the sweet spot — enough that the eye reads
 * the list as arriving in order, little enough that it never feels like waiting.
 */
export const stagger = (delayChildren = 0.02, staggerChildren = 0.022): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
  exit: { transition: { staggerChildren: 0.012, staggerDirection: -1 } },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: spring.smooth },
  exit: { opacity: 0, y: -4, transition: fade.fast },
};

/** Popovers, dropdowns, tooltips. Scales from its own anchor edge. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.97, y: -2, transition: fade.fast },
};

export const scrimIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: fade.base },
  exit: { opacity: 0, transition: fade.fast },
};

export const dialogIn: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.gentle },
  exit: { opacity: 0, scale: 0.985, y: 6, transition: fade.fast },
};

/** The command palette drops in from slightly above and overshoots a hair. */
export const paletteIn: Variants = {
  hidden: { opacity: 0, scale: 0.965, y: -12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 480, damping: 32, mass: 0.8 },
  },
  exit: { opacity: 0, scale: 0.98, y: -8, transition: { duration: 0.12, ease: ease.out } },
};

export const drawerIn = (side: 'right' | 'left' | 'bottom' = 'right'): Variants => {
  if (side === 'bottom') {
    return {
      hidden: { y: '100%' },
      show: { y: 0, transition: spring.gentle },
      exit: { y: '100%', transition: { duration: 0.22, ease: ease.inOut } },
    };
  }
  const from = side === 'left' ? '-100%' : '100%';
  return {
    hidden: { x: from, opacity: 0.6 },
    show: { x: 0, opacity: 1, transition: spring.gentle },
    exit: { x: from, opacity: 0.6, transition: { duration: 0.22, ease: ease.inOut } },
  };
};

/** Toasts arrive from the bottom edge and leave sideways — never the same path. */
export const toastIn: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, x: 24, scale: 0.97, transition: fade.fast },
};

/* ── Interaction presets ──────────────────────────────────────────────── */

/** Applied to every pressable surface. Tiny numbers on purpose. */
export const pressable = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.975 },
  transition: spring.snappy,
} as const;

export const pressableSubtle = {
  whileTap: { scale: 0.985 },
  transition: spring.snappy,
} as const;

/** Cards that lift toward the cursor rather than growing. */
export const liftable = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.995 },
  transition: spring.snappy,
} as const;

/* ── Helpers ──────────────────────────────────────────────────────────── */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Shared layout-animation id namespace, so ids never collide across modules. */
export const layoutId = (namespace: string, id: string) => `${namespace}:${id}`;

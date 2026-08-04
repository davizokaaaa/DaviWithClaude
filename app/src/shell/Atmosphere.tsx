/**
 * The Living Gallery's air.
 *
 * One canvas behind each room's content, painting that room's artistic
 * influence as pure atmosphere: composition, rhythm, geometry and light are
 * extracted from the movement — never the artwork itself. Rules:
 *
 *  - Felt, not seen. Peak alpha stays under ~0.06; if a shape can be pointed
 *    at, it is too loud.
 *  - Slow. Periods are measured in tens of seconds; nothing pulses.
 *  - Cheap. Canvas 2D, stateless scenes (pure functions of time), 30fps cap,
 *    DPR capped at 1.5, halted when the tab hides. Reduced motion renders a
 *    single still frame.
 */

import { useEffect, useRef } from 'react';
import type { ViewId } from '@/core/types';
import { prefersReducedMotion } from '@/lib/motion';

type Scene = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dark: boolean) => void;

const TAU = Math.PI * 2;
/** Deterministic per-index noise, so scenes are stable across mounts. */
const n1 = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* Museum pigments (match tokens.css primitives). */
const NAVY = '77, 109, 153';
const FOREST = '71, 119, 90';
const BRASS = '168, 135, 60';
const CLAY = '178, 95, 61';
const STONE = '117, 114, 106';
const VIOLET = '131, 104, 170';
const RED = '194, 85, 69';
const LILY_GREEN = '103, 148, 120';
const LILY_BLUE = '109, 151, 200';
const LILY_ROSE = '221, 162, 133';

const a = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`;

/* ── Scenes ──────────────────────────────────────────────────────────── */

/** Today — first light. A single warm glow climbing through the morning. */
const today: Scene = (ctx, w, h, t) => {
  const y = h * (0.85 - 0.1 * Math.sin(t / 60));
  const g = ctx.createRadialGradient(w * 0.22, y, 0, w * 0.22, y, Math.max(w, h) * 0.5);
  g.addColorStop(0, a(BRASS, 0.05));
  g.addColorStop(1, a(BRASS, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
};

/** Dashboard — Bauhaus. Circle, square, diagonal: geometry at rest. */
const dashboard: Scene = (ctx, w, h, t) => {
  ctx.lineWidth = 1;
  ctx.strokeStyle = a(NAVY, 0.05);
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.3, h * (0.34 + 0.02 * Math.sin(t / 41)), 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = a(BRASS, 0.04);
  const s = h * 0.42;
  ctx.save();
  ctx.translate(w * 0.18, h * 0.72);
  ctx.rotate(0.06 * Math.sin(t / 67));
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.restore();
  ctx.strokeStyle = a(RED, 0.035);
  ctx.beginPath();
  const drift = 0.04 * Math.sin(t / 53);
  ctx.moveTo(w * (0.1 + drift), h);
  ctx.lineTo(w * (0.9 + drift), 0);
  ctx.stroke();
};

/** Calendar — Mondrian. Rules sliding by millimetres; two quiet planes. */
const calendar: Scene = (ctx, w, h, t) => {
  const vx = [0.22, 0.48, 0.8].map((p, i) => w * (p + 0.015 * Math.sin(t / (47 + i * 13) + i)));
  const hy = [0.3, 0.68].map((p, i) => h * (p + 0.015 * Math.cos(t / (59 + i * 11) + i)));
  ctx.fillStyle = a(NAVY, 0.035 + 0.012 * Math.sin(t / 37));
  ctx.fillRect(vx[1], 0, vx[2] - vx[1], hy[0]);
  ctx.fillStyle = a(RED, 0.025 + 0.01 * Math.cos(t / 43));
  ctx.fillRect(0, hy[1], vx[0], h - hy[1]);
  ctx.strokeStyle = a(STONE, 0.06);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const x of vx) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (const y of hy) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();
};

/** Goals — Kandinsky. Circles in orbit; lines appear where they agree. */
const goals: Scene = (ctx, w, h, t) => {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 7; i++) {
    const cx = w * (0.15 + 0.7 * n1(i));
    const cy = h * (0.15 + 0.7 * n1(i + 20));
    const or = Math.min(w, h) * (0.05 + 0.1 * n1(i + 40));
    const sp = 0.008 + 0.006 * n1(i + 60);
    const x = cx + or * Math.cos(t * sp * TAU + i);
    const y = cy + or * Math.sin(t * sp * TAU + i * 1.7);
    const r = 6 + 26 * n1(i + 80);
    pts.push([x, y, r]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = a([VIOLET, NAVY, BRASS][i % 3], 0.055);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = a(STONE, 0.04);
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < Math.min(w, h) * 0.3) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); }
    }
  ctx.stroke();
};

/** Focus — Zen. A ripple every so often, widening into stillness. */
const focus: Scene = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h * 0.44;
  for (let i = 0; i < 3; i++) {
    const phase = ((t / 26 + i / 3) % 1 + 1) % 1;
    const r = phase * Math.min(w, h) * 0.55;
    ctx.lineWidth = 1;
    ctx.strokeStyle = a(STONE, 0.06 * (1 - phase));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
  }
};

/** Notes — Monet. Water: soft pools of colour drifting into one another. */
const notes: Scene = (ctx, w, h, t) => {
  const blobs = [LILY_GREEN, LILY_BLUE, LILY_ROSE, LILY_GREEN, LILY_BLUE];
  blobs.forEach((c, i) => {
    const x = w * (0.2 + 0.6 * n1(i + 3)) + w * 0.06 * Math.sin(t / (31 + 7 * i) + i * 2);
    const y = h * (0.2 + 0.6 * n1(i + 9)) + h * 0.06 * Math.cos(t / (37 + 5 * i) + i);
    const r = Math.min(w, h) * (0.24 + 0.1 * n1(i + 15));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, a(c, 0.045));
    g.addColorStop(1, a(c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  });
};

/** Reviews — Art Deco. A brass fan opening from below the page. */
const reviews: Scene = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h * 1.12;
  const rays = 15;
  ctx.lineWidth = 1;
  for (let i = 0; i < rays; i++) {
    const ang = Math.PI + (i / (rays - 1)) * Math.PI;
    const shimmer = 0.5 + 0.5 * Math.sin(t / 19 + i * 0.8);
    const len = h * (0.85 + 0.1 * shimmer);
    ctx.strokeStyle = a(BRASS, 0.03 + 0.025 * shimmer);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
    ctx.stroke();
  }
};

/** Timeline — Constructivism. Diagonal force, patiently on the move. */
const timeline: Scene = (ctx, w, h, t) => {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.32);
  for (let i = 0; i < 4; i++) {
    const y = (i - 1.5) * h * 0.3;
    const drift = ((t * (4 + i * 2)) % (w * 2)) - w;
    ctx.fillStyle = a(i % 2 ? RED : STONE, 0.035);
    ctx.fillRect(-w + drift, y, w * (0.5 + 0.2 * n1(i)), 8 + 20 * n1(i + 5));
  }
  ctx.restore();
};

/** Habits — the kiln. A patient grid of clay marks, warming in sequence. */
const habits: Scene = (ctx, w, h, t) => {
  const step = 64;
  for (let x = step / 2; x < w; x += step)
    for (let y = step / 2; y < h; y += step) {
      const i = x * 7 + y * 13;
      const warm = 0.5 + 0.5 * Math.sin(t / 23 + (x + y) / 260 + n1(i) * TAU);
      ctx.fillStyle = a(CLAY, 0.02 + 0.03 * warm);
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, TAU);
      ctx.fill();
    }
};

/** Finance — forest. Ledger rules breathing like canopy light. */
const finance: Scene = (ctx, w, h, t) => {
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const baseY = h * (0.2 + i * 0.15);
    ctx.strokeStyle = a(FOREST, 0.045);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const y = baseY + Math.sin(x / 240 + t / (17 + i * 4) + i * 2) * 7;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
};

const SCENES: Partial<Record<ViewId, Scene>> = {
  today, dashboard, calendar, goals, focus, notes, reviews, timeline, habits, finance,
};

/* ── Host ────────────────────────────────────────────────────────────── */

export function Atmosphere({ module }: { module: ViewId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const scene = SCENES[module];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !scene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const still = prefersReducedMotion();
    const start = performance.now();
    let raf = 0;
    let last = 0;
    const frame = (nowMs: number) => {
      if (!document.hidden && nowMs - last >= 33) {
        last = nowMs;
        const dark = document.documentElement.dataset.theme !== 'light';
        ctx.clearRect(0, 0, w, h);
        scene(ctx, w, h, (nowMs - start) / 1000 + 120, dark);
      }
      if (!still) raf = requestAnimationFrame(frame);
    };
    frame(start);
    const onVis = () => { last = 0; };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [scene]);

  if (!scene) return null;
  return <canvas ref={ref} className="atmosphere" aria-hidden />;
}

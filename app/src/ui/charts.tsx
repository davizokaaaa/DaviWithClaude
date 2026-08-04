/**
 * Chart primitives: AnimatedNumber, Sparkline, Bars, Heatmap.
 * Hand-rolled SVG — no chart library. Grid lines use --chart-grid; series
 * colours resolve through hue tokens so themes restyle everything.
 */

import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import clsx from 'clsx';
import { spring } from '@/lib/motion';
import type { DateKey } from '@/core/types';

/* ── Animated counter ────────────────────────────────────────────────── */

export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(v));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { ...spring.measured, type: 'spring' });
    return () => controls.stop();
  }, [value, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}

/* ── Sparkline ───────────────────────────────────────────────────────── */

export function Sparkline({
  points,
  height = 44,
  hue,
  filled = true,
}: {
  points: number[];
  height?: number;
  hue?: string;
  filled?: boolean;
}) {
  const w = 100;
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => [i * step, height - 4 - (p / max) * (height - 10)]);
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L${w} ${height} L0 ${height} Z`;
  const stroke = hue ? `var(--hue-${hue})` : 'var(--accent)';

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
      aria-hidden
    >
      {filled && (
        <motion.path
          d={area}
          fill={stroke}
          opacity={0.1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* ── Bars ────────────────────────────────────────────────────────────── */

export function Bars({
  data,
  height = 72,
  hue,
  labels,
}: {
  data: number[];
  height?: number;
  hue?: string;
  /** shown under first/last bar */
  labels?: [string, string];
}) {
  const max = Math.max(1, ...data);
  const fill = hue ? `var(--hue-${hue})` : 'var(--accent)';
  return (
    <div>
      <div className="bars" style={{ height }} aria-hidden>
        {data.map((v, i) => (
          <div key={i} className="bars-slot">
            <motion.div
              className="bars-bar"
              style={{ background: fill }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(3, (v / max) * 100)}%` }}
              transition={{ ...spring.smooth, delay: i * 0.022 }}
            />
          </div>
        ))}
      </div>
      {labels && (
        <div className="row between t-micro ink-faint" style={{ marginTop: 4 }}>
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}

/* ── Heatmap (habit history) ─────────────────────────────────────────── */

export function Heatmap({
  days,
  value,
  hue = 'green',
  weeks = 16,
}: {
  /** oldest → newest, length = weeks*7 */
  days: DateKey[];
  /** 0..1 intensity per day */
  value: (day: DateKey) => number;
  hue?: string;
  weeks?: number;
}) {
  const cols: DateKey[][] = [];
  for (let wI = 0; wI < weeks; wI++) {
    cols.push(days.slice(wI * 7, wI * 7 + 7));
  }
  return (
    <div className="heatmap" role="img" aria-label="Completion history">
      {cols.map((week, wi) => (
        <div key={wi} className="heatmap-col">
          {week.map((day, di) => {
            const v = value(day);
            return (
              <motion.span
                key={day}
                className={clsx('heatmap-cell', v === 0 && 'is-empty')}
                style={
                  v > 0
                    ? { background: `color-mix(in oklab, var(--hue-${hue}) ${25 + v * 75}%, var(--chart-track))` }
                    : undefined
                }
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring.snappy, delay: (wi * 7 + di) * 0.0035 }}
                title={day}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── Distribution bar (finance / balance) ────────────────────────────── */

export function DistributionBar({
  segments,
}: {
  segments: { label: string; value: number; hue: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="distbar" role="img" aria-label={segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ')}>
      {segments.map((s, i) => (
        <motion.div
          key={s.label}
          className="distbar-seg"
          style={{ background: `var(--hue-${s.hue})` }}
          initial={{ flexGrow: 0 }}
          animate={{ flexGrow: s.value / total }}
          transition={{ ...spring.smooth, delay: i * 0.04 }}
          title={`${s.label}`}
        />
      ))}
    </div>
  );
}

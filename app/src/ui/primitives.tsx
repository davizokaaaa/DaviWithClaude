/**
 * Core primitives: Button, IconButton, Input, Select, Checkbox, chips, badges.
 * Styling lives in ui.css; behaviour and motion live here.
 */

import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import clsx from 'clsx';
import { ease, spring } from '@/lib/motion';

/* ── Button ──────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  /** Keyboard shortcut hint rendered at the trailing edge. */
  kbd?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, children, kbd, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      className={clsx('btn', `btn-${variant}`, `btn-${size}`, className)}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      {...rest}
    >
      {children}
      {kbd && <kbd className="btn-kbd">{kbd}</kbd>}
    </motion.button>
  );
});

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label: string;
  size?: ButtonSize;
  active?: boolean;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', active, className, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      aria-label={label}
      title={label}
      className={clsx('iconbtn', `iconbtn-${size}`, active && 'is-active', className)}
      whileTap={{ scale: 0.92 }}
      transition={spring.snappy}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

/* ── Inputs ──────────────────────────────────────────────────────────── */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, FieldProps>(function Input(
  { label, className, id, ...rest },
  ref,
) {
  const inputId = id ?? (label ? `f_${label.replace(/\W/g, '_')}` : undefined);
  const el = <input ref={ref} id={inputId} className={clsx('input', className)} {...rest} />;
  if (!label) return el;
  return (
    <label className="field" htmlFor={inputId}>
      <span className="field-label">{label}</span>
      {el}
    </label>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, className, children, id, ...rest },
  ref,
) {
  const selectId = id ?? (label ? `s_${label.replace(/\W/g, '_')}` : undefined);
  const el = (
    <span className="select-wrap">
      <select ref={ref} id={selectId} className={clsx('select', className)} {...rest}>
        {children}
      </select>
      <svg className="select-caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
  if (!label) return el;
  return (
    <label className="field" htmlFor={selectId}>
      <span className="field-label">{label}</span>
      {el}
    </label>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, InputHTMLAttributes<HTMLTextAreaElement> & { label?: string; rows?: number }>(
  function Textarea({ label, className, id, ...rest }, ref) {
    const taId = id ?? (label ? `t_${label.replace(/\W/g, '_')}` : undefined);
    const el = <textarea ref={ref} id={taId} className={clsx('input', 'textarea', className)} {...rest} />;
    if (!label) return el;
    return (
      <label className="field" htmlFor={taId}>
        <span className="field-label">{label}</span>
        {el}
      </label>
    );
  },
);

/* ── Checkbox — the completion moment, so it gets real motion ────────── */

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /** Larger hit target for task rows */
  size?: 'sm' | 'md';
}

export function Checkbox({ checked, onChange, label, size = 'md' }: CheckboxProps) {
  /* The completion burst: a soft ring that blooms outward the moment a box is
     ticked by the user — never on mount, never on untick. */
  const wasChecked = useRef(checked);
  const [burstKey, setBurstKey] = useState(0);
  useEffect(() => {
    if (checked && !wasChecked.current) setBurstKey((k) => k + 1);
    wasChecked.current = checked;
  }, [checked]);

  return (
    <motion.button
      role="checkbox"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'Mark incomplete' : 'Mark complete')}
      className={clsx('checkbox', `checkbox-${size}`, checked && 'is-checked')}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      whileTap={{ scale: 0.85 }}
      transition={spring.bouncy}
    >
      <motion.svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
        <motion.path
          d="M2.5 6.2 5 8.6 9.5 3.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>
      {burstKey > 0 && (
        <motion.span
          key={burstKey}
          className="checkbox-burst"
          aria-hidden
          initial={{ opacity: 0.5, scale: 0.5 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.5, ease: ease.out }}
        />
      )}
    </motion.button>
  );
}

/* ── Small display atoms ─────────────────────────────────────────────── */

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Chip({
  hue,
  children,
  onClick,
  active,
}: {
  hue?: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      className={clsx('chip', active && 'is-active')}
      style={hue ? ({ '--chip-hue': `var(--hue-${hue})` } as React.CSSProperties) : undefined}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

export function Dot({ hue, className }: { hue: string; className?: string }) {
  return (
    <span
      className={clsx('dot', className)}
      style={{ background: `var(--hue-${hue})` }}
      aria-hidden
    />
  );
}

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  urgent: { label: 'Urgent', cls: 'pri-urgent' },
  high: { label: 'High', cls: 'pri-high' },
  medium: { label: 'Medium', cls: 'pri-medium' },
  low: { label: 'Low', cls: 'pri-low' },
};

export function PriorityFlag({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;
  return (
    <span className={clsx('priflag', meta.cls)} title={`${meta.label} priority`}>
      <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
        <path d="M2.5 1.5v9M2.5 1.8c2-.9 4-.9 6 .2l1 .5-.6 4c-2-1.1-4-1.1-6.4-.2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">{meta.label} priority</span>
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      className="empty"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.smooth}
    >
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {action && <div className="empty-action">{action}</div>}
    </motion.div>
  );
}

/* ── Segmented control ───────────────────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  layoutNs,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
  /** unique namespace for the sliding thumb's layoutId */
  layoutNs: string;
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          className={clsx('segmented-item', value === opt.value && 'is-active')}
          onClick={() => onChange(opt.value)}
        >
          {value === opt.value && (
            <motion.span
              className="segmented-thumb"
              layoutId={`seg:${layoutNs}`}
              transition={spring.snappy}
            />
          )}
          <span className="segmented-label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Toggle switch ───────────────────────────────────────────────────── */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={clsx('switch', checked && 'is-on')}
      onClick={() => onChange(!checked)}
    >
      <motion.span className="switch-thumb" layout transition={spring.snappy} />
    </button>
  );
}

/* ── Progress ring — the habit/goal reward moment ────────────────────── */

export function ProgressRing({
  value,
  size = 40,
  stroke = 3.5,
  hue,
  children,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  hue?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hue ? `var(--hue-${hue})` : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={spring.measured}
        />
      </svg>
      {children && <div className="ring-content">{children}</div>}
    </div>
  );
}

/* ── Linear progress bar ─────────────────────────────────────────────── */

export function ProgressBar({ value, hue }: { value: number; hue?: string }) {
  return (
    <div className="progressbar" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="progressbar-fill"
        style={{ background: hue ? `var(--hue-${hue})` : 'var(--accent)' }}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={spring.measured}
      />
    </div>
  );
}

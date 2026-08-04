/**
 * Floating layers: Dialog, Drawer, Popover (anchored menu), Tooltip, Toast.
 * These are the only surfaces allowed to cast shadows.
 */

import {
  useCallback, useEffect, useId, useRef, useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import { dialogIn, drawerIn, fade, popIn, scrimIn, spring, toastIn } from '@/lib/motion';
import { useUi, type Toast } from '@/core/store/ui';

/* ── Focus trap + escape, shared by dialog/drawer ────────────────────── */

function useDismissable(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;
    // Move focus in after the entrance animation starts.
    const t = window.setTimeout(() => {
      const target = node?.querySelector<HTMLElement>(
        '[autofocus], input, textarea, select, button:not([data-dismiss])',
      );
      (target ?? node)?.focus();
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && node) {
        const focusables = Array.from(
          node.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

/* ── Dialog ──────────────────────────────────────────────────────────── */

export function Dialog({
  open,
  onClose,
  title,
  width = 480,
  children,
  hideTitle,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
  hideTitle?: boolean;
}) {
  const ref = useDismissable(open, onClose);
  const titleId = useId();
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay-root" style={{ zIndex: 'var(--z-dialog)' }}>
          <motion.div
            className="scrim"
            variants={scrimIn}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="dialog"
            style={{ maxWidth: width }}
            variants={dialogIn}
            initial="hidden"
            animate="show"
            exit="exit"
            tabIndex={-1}
          >
            <h2 id={titleId} className={clsx('dialog-title', hideTitle && 'sr-only')}>
              {title}
            </h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────── */

export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  width = 420,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'right' | 'left' | 'bottom';
  width?: number;
  children: ReactNode;
}) {
  const ref = useDismissable(open, onClose);
  const titleId = useId();
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay-root" style={{ zIndex: 'var(--z-drawer)' }}>
          <motion.div className="scrim" variants={scrimIn} initial="hidden" animate="show" exit="exit" onClick={onClose} />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={clsx('drawer', `drawer-${side}`)}
            style={side !== 'bottom' ? { width } : undefined}
            variants={drawerIn(side)}
            initial="hidden"
            animate="show"
            exit="exit"
            tabIndex={-1}
          >
            <header className="drawer-head">
              <h2 id={titleId} className="t-subtitle">{title}</h2>
              <button className="iconbtn iconbtn-sm" onClick={onClose} aria-label="Close" data-dismiss>
                <CloseGlyph />
              </button>
            </header>
            <div className="drawer-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function CloseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path d="M2.5 2.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ── Popover / context menu ──────────────────────────────────────────── */

interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  kbd?: string;
  icon?: ReactNode;
}

export function Menu({
  trigger,
  items,
  label,
  align = 'start',
}: {
  trigger: (props: { onClick: (e: React.MouseEvent) => void; 'aria-expanded': boolean }) => ReactNode;
  items: (MenuItem | 'divider')[];
  label: string;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const openAt = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: align === 'end' ? rect.right : rect.left, y: rect.bottom + 6 });
    setOpen(true);
  }, [align]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const btns = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('.menu-item') ?? []);
        const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === 'ArrowDown' ? btns[(idx + 1) % btns.length] : btns[(idx - 1 + btns.length) % btns.length];
        next?.focus();
      }
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => menuRef.current?.querySelector<HTMLButtonElement>('.menu-item')?.focus(), 30);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <>
      {trigger({ onClick: openAt, 'aria-expanded': open })}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              aria-label={label}
              className="menu"
              style={{
                left: Math.min(pos.x, window.innerWidth - 230),
                top: Math.min(pos.y, window.innerHeight - 40 * items.length - 20),
                transform: align === 'end' ? 'translateX(-100%)' : undefined,
                zIndex: 'var(--z-popover)',
              }}
              variants={popIn}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {items.map((item, i) =>
                item === 'divider' ? (
                  <hr key={i} className="menu-divider" />
                ) : (
                  <button
                    key={item.label}
                    role="menuitem"
                    className={clsx('menu-item', item.danger && 'is-danger')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      item.onSelect();
                    }}
                  >
                    {item.icon && <span className="menu-icon">{item.icon}</span>}
                    <span className="spacer truncate">{item.label}</span>
                    {item.kbd && <kbd className="kbd">{item.kbd}</kbd>}
                  </button>
                ),
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/* ── Tooltip ─────────────────────────────────────────────────────────── */

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timer = useRef<number>(0);

  return (
    <span
      className="tooltip-anchor"
      onMouseEnter={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
        timer.current = window.setTimeout(() => setShow(true), 450);
      }}
      onMouseLeave={() => {
        window.clearTimeout(timer.current);
        setShow(false);
      }}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {show && (
            <motion.span
              role="tooltip"
              className="tooltip"
              style={{ left: pos.x, top: pos.y, zIndex: 'var(--z-toast)' }}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: spring.snappy }}
              exit={{ opacity: 0, y: 2, transition: fade.fast }}
            >
              {content}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
}

/* ── Toasts ──────────────────────────────────────────────────────────── */

export function ToastHost() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  return createPortal(
    <div className="toast-host" role="region" aria-live="polite" aria-label="Notifications">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      className={clsx('toast', toast.kind && `toast-${toast.kind}`)}
      variants={toastIn}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={spring.snappy}
    >
      <span className="toast-msg">{toast.message}</span>
      {toast.action && (
        <button
          className="toast-action"
          onClick={() => {
            toast.action?.onAction();
            onDismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        <CloseGlyph />
      </button>
    </motion.div>
  );
}

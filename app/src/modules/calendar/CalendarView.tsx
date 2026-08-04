/**
 * Calendar — week time-grid with time blocks, a live "now" line, click-to-add
 * blocks, and drag-to-move. Time-blocking is a first-class planning act.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Button, Input, Select } from '@/ui/primitives';
import { Dialog } from '@/ui/overlays';
import { spring, riseIn } from '@/lib/motion';
import { addDaysKey, fmtClock, fromKey, keyIsToday, minutesNow, weekKeys, format } from '@/lib/dates';
import type { DateKey, Minutes, TimeBlock } from '@/core/types';

const DAY_START: Minutes = 6 * 60;
const DAY_END: Minutes = 22 * 60;
const PX_PER_MIN = 1.05;
const SNAP = 15;

export default function CalendarView() {
  const blocks = useData((s) => s.blocks);
  const addBlock = useData((s) => s.addBlock);
  const updateBlock = useData((s) => s.updateBlock);
  const deleteBlock = useData((s) => s.deleteBlock);
  const toast = useUi((s) => s.toast);

  const [anchor, setAnchor] = useState(() => new Date());
  const [draft, setDraft] = useState<{ date: DateKey; start: Minutes } | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDuration, setDraftDuration] = useState(60);
  const [nowTick, setNowTick] = useState(minutesNow());
  const gridRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => weekKeys(anchor), [anchor]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(minutesNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Scroll the grid so 8:00 sits near the top on mount.
  useEffect(() => {
    gridRef.current?.scrollTo({ top: (8 * 60 - DAY_START) * PX_PER_MIN });
  }, []);

  const hours: Minutes[] = [];
  for (let m = DAY_START; m < DAY_END; m += 60) hours.push(m);

  const blocksFor = (day: DateKey) =>
    blocks.filter((b) => b.date === day).sort((a, b) => a.start - b.start);

  const onGridClick = (day: DateKey, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.cal-block')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const raw = DAY_START + y / PX_PER_MIN;
    const start = Math.round(raw / SNAP) * SNAP;
    setDraft({ date: day, start });
    setDraftTitle('');
    setDraftDuration(60);
  };

  const saveDraft = () => {
    if (!draft || !draftTitle.trim()) return;
    addBlock({ date: draft.date, start: draft.start, duration: draftDuration, title: draftTitle.trim(), kind: 'task', hue: 'indigo' });
    setDraft(null);
    toast({ message: `Blocked ${fmtClock(draft.start)}–${fmtClock(draft.start + draftDuration)}`, kind: 'success' });
  };

  return (
    <div className="view" style={{ maxWidth: 'none', paddingBottom: 'var(--sp-8)' }}>
      <motion.header className="view-head row between g-4 wrap" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">{format(fromKey(days[0]), 'MMMM yyyy')}</h2>
          <p className="view-sub">Click any slot to block time. Drag blocks to move them.</p>
        </div>
        <div className="row g-3">
          <Button size="sm" onClick={() => setAnchor((d) => new Date(d.getTime() - 7 * 86400000))} aria-label="Previous week">←</Button>
          <Button size="sm" onClick={() => setAnchor(new Date())}>Today</Button>
          <Button size="sm" onClick={() => setAnchor((d) => new Date(d.getTime() + 7 * 86400000))} aria-label="Next week">→</Button>
        </div>
      </motion.header>

      <div className="panel cal" >
        <div className="cal-head">
          <div className="cal-gutter" />
          {days.map((day) => (
            <div key={day} className={clsx('cal-day-head', keyIsToday(day) && 'is-today')}>
              <span className="t-micro ink-faint">{format(fromKey(day), 'EEE')}</span>
              <span className={clsx('cal-day-num', keyIsToday(day) && 'is-today')}>
                {format(fromKey(day), 'd')}
              </span>
            </div>
          ))}
        </div>
        <div className="cal-scroll" ref={gridRef}>
          <div className="cal-grid" style={{ height: (DAY_END - DAY_START) * PX_PER_MIN }}>
            <div className="cal-gutter">
              {hours.map((m) => (
                <span key={m} className="cal-hour t-micro ink-faint" style={{ top: (m - DAY_START) * PX_PER_MIN }}>
                  {fmtClock(m)}
                </span>
              ))}
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="cal-col"
                onClick={(e) => onGridClick(day, e)}
                role="button"
                tabIndex={-1}
                aria-label={`Schedule for ${day}`}
              >
                {hours.map((m) => (
                  <span key={m} className="cal-line" style={{ top: (m - DAY_START) * PX_PER_MIN }} aria-hidden />
                ))}
                {keyIsToday(day) && nowTick >= DAY_START && nowTick <= DAY_END && (
                  <motion.span
                    className="cal-now"
                    style={{ top: (nowTick - DAY_START) * PX_PER_MIN }}
                    layout
                    transition={spring.measured}
                    aria-hidden
                  />
                )}
                <AnimatePresence initial={false}>
                  {blocksFor(day).map((b) => (
                    <CalBlock
                      key={b.id}
                      block={b}
                      onMove={(startDelta, dayDelta) => {
                        const nextStart = Math.max(DAY_START, Math.min(DAY_END - b.duration, Math.round((b.start + startDelta) / SNAP) * SNAP));
                        const nextDate = dayDelta === 0 ? b.date : addDaysKey(b.date, dayDelta);
                        updateBlock(b.id, { start: nextStart, date: nextDate });
                      }}
                      onDelete={() => deleteBlock(b.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!draft} onClose={() => setDraft(null)} title="Block time" width={380}>
        {draft && (
          <div className="col g-5">
            <p className="t-body-sm ink-subtle" style={{ marginTop: -8 }}>
              {format(fromKey(draft.date), 'EEEE')} · {fmtClock(draft.start)}–{fmtClock(draft.start + draftDuration)}
            </p>
            <Input
              autoFocus
              label="What is this time for?"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveDraft()}
              placeholder="Deep work, workout, review…"
            />
            <Select label="Duration" value={String(draftDuration)} onChange={(e) => setDraftDuration(Number(e.target.value))}>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </Select>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={saveDraft}>Add block</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function CalBlock({
  block,
  onMove,
  onDelete,
}: {
  block: TimeBlock;
  onMove: (startDeltaMinutes: number, dayDelta: number) => void;
  onDelete: () => void;
}) {
  const colWidth = useRef(0);
  return (
    <motion.div
      className={clsx('cal-block', `cal-kind-${block.kind}`)}
      style={{
        top: (block.start - DAY_START) * PX_PER_MIN,
        height: Math.max(24, block.duration * PX_PER_MIN - 2),
        '--block-hue': `var(--hue-${block.hue ?? 'graphite'})`,
      } as React.CSSProperties}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={spring.smooth}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      whileDrag={{ scale: 1.02, zIndex: 20, boxShadow: 'var(--shadow-drag)', cursor: 'grabbing' }}
      onDragStart={(_, info) => {
        const col = (info.point && document.elementFromPoint(info.point.x, info.point.y)?.closest('.cal-col')) as HTMLElement | null;
        colWidth.current = col?.offsetWidth ?? 140;
      }}
      onDragEnd={(_, info) => {
        const dayDelta = Math.round(info.offset.x / Math.max(80, colWidth.current));
        onMove(info.offset.y / PX_PER_MIN, dayDelta);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      title={`${block.title} · ${fmtClock(block.start)}–${fmtClock(block.start + block.duration)} (double-click to remove)`}
      tabIndex={0}
      role="button"
      aria-label={`${block.title}, ${fmtClock(block.start)}`}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') onDelete();
      }}
    >
      <span className="cal-block-title truncate">{block.title}</span>
      {block.duration >= 40 && (
        <span className="cal-block-time">{fmtClock(block.start)}–{fmtClock(block.start + block.duration)}</span>
      )}
    </motion.div>
  );
}

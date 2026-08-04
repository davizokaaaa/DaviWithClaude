/**
 * Focus — Pomodoro and open-ended deep work. The timer state lives in the UI
 * store so it survives navigation; sessions are recorded for the dashboard.
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useSettings, useUi } from '@/core/store/ui';
import { Button, ProgressRing, Segmented, Select } from '@/ui/primitives';
import { AnimatedNumber, Bars } from '@/ui/charts';
import { riseIn, spring } from '@/lib/motion';
import { focusMinutesTrend, isOpen, tasksForDay } from '@/core/selectors';
import { fmtMinutes, todayKey } from '@/lib/dates';

type Mode = 'pomodoro' | 'deep';

export default function FocusView({ param }: { param?: string }) {
  const tasks = useData((s) => s.tasks);
  const sessions = useData((s) => s.sessions);
  const startSession = useData((s) => s.startSession);
  const endSession = useData((s) => s.endSession);
  const pomodoro = useSettings((s) => s.pomodoro);
  const focus = useUi((s) => s.focus);
  const setFocus = useUi((s) => s.setFocus);
  const toast = useUi((s) => s.toast);

  const [mode, setMode] = useState<Mode>('pomodoro');
  const [taskId, setTaskId] = useState<string>(param ?? '');
  const [, tick] = useState(0);

  const running = focus.sessionId !== null;
  const session = sessions.find((s) => s.id === focus.sessionId);

  // 500ms tick keeps the countdown honest without burning CPU.
  useEffect(() => {
    if (!running || focus.paused) return;
    const id = window.setInterval(() => tick((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, [running, focus.paused]);

  const remainingMs = focus.paused
    ? focus.pausedRemaining ?? 0
    : Math.max(0, (focus.endsAt ?? 0) - Date.now());
  const lengthMin = session?.length ?? (mode === 'pomodoro' ? pomodoro.work : 50);
  const progress = running ? 1 - remainingMs / (lengthMin * 60_000) : 0;

  // Session finished?
  useEffect(() => {
    if (running && !focus.paused && remainingMs <= 0 && focus.sessionId) {
      endSession(focus.sessionId, true);
      setFocus({ sessionId: null, endsAt: null, paused: false, pausedRemaining: null });
      toast({ message: 'Focus session complete. Take a real break.', kind: 'success' });
    }
  });

  const start = () => {
    const length = mode === 'pomodoro' ? pomodoro.work : 50;
    const s = startSession({ kind: mode, length, taskId: taskId || undefined, intent: undefined });
    setFocus({ sessionId: s.id, endsAt: Date.now() + length * 60_000, paused: false, pausedRemaining: null });
  };

  const pause = () => {
    if (focus.paused) {
      setFocus({ paused: false, endsAt: Date.now() + (focus.pausedRemaining ?? 0), pausedRemaining: null });
    } else {
      setFocus({ paused: true, pausedRemaining: remainingMs });
    }
  };

  const stop = (completed: boolean) => {
    if (focus.sessionId) endSession(focus.sessionId, completed);
    setFocus({ sessionId: null, endsAt: null, paused: false, pausedRemaining: null });
  };

  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);

  const openToday = useMemo(
    () => tasksForDay(tasks, todayKey()).filter((t) => isOpen(t)),
    [tasks],
  );
  const trend = useMemo(() => focusMinutesTrend(sessions, 14), [sessions]);
  const todayMinutes = trend[trend.length - 1]?.value ?? 0;
  const linkedTask = tasks.find((t) => t.id === (session?.taskId ?? taskId));

  return (
    <div className="view view-narrow">
      <motion.header className="view-head" variants={riseIn} initial="hidden" animate="show">
        <h2 className="view-title">Focus</h2>
        <p className="view-sub">One task, one block of undivided attention.</p>
      </motion.header>

      <section className="panel focus-stage">
        <AnimatePresence mode="wait">
          {!running ? (
            <motion.div
              key="setup"
              className="col g-6"
              style={{ alignItems: 'center' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: spring.smooth }}
              exit={{ opacity: 0, y: -6 }}
            >
              <Segmented
                layoutNs="focus-mode"
                label="Focus mode"
                value={mode}
                options={[
                  { value: 'pomodoro', label: `Pomodoro · ${pomodoro.work}m` },
                  { value: 'deep', label: 'Deep work · 50m' },
                ]}
                onChange={setMode}
              />
              <div style={{ width: 320, maxWidth: '100%' }}>
                <Select aria-label="Focus on task" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                  <option value="">No specific task</option>
                  {openToday.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </Select>
              </div>
              <Button variant="primary" size="lg" onClick={start}>
                Start focusing
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="running"
              className="col g-7"
              style={{ alignItems: 'center' }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1, transition: spring.gentle }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <ProgressRing value={progress} size={200} stroke={5}>
                <div className="col" style={{ alignItems: 'center' }}>
                  <span className="focus-time">
                    {mm}:{String(ss).padStart(2, '0')}
                  </span>
                  {focus.paused && <span className="t-caption ink-faint">paused</span>}
                </div>
              </ProgressRing>
              {linkedTask && (
                <p className="t-subtitle ink-muted truncate" style={{ maxWidth: 420 }}>
                  {linkedTask.title}
                </p>
              )}
              <div className="row g-4">
                <Button onClick={pause}>{focus.paused ? 'Resume' : 'Pause'}</Button>
                <Button variant="ghost" onClick={() => stop(false)}>End early</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="panel panel-pad" style={{ marginTop: 'var(--stack-gap)' }}>
        <div className="panel-head">
          <h3 className="panel-title">Focus this fortnight</h3>
          <span className="t-caption ink-faint">
            today · <AnimatedNumber value={todayMinutes} format={(n) => fmtMinutes(Math.round(n))} />
          </span>
        </div>
        <Bars data={trend.map((p) => p.value)} labels={['2 weeks ago', 'today']} hue="purple" height={64} />
      </section>
    </div>
  );
}

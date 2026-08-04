/**
 * Reviews — weekly, monthly, quarterly, annual. Guided questions, saved
 * answers, and a visible cadence record. The weekly review is the anchor.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useData } from '@/core/store/data';
import { useUi } from '@/core/store/ui';
import { Button, Segmented, Textarea } from '@/ui/primitives';
import { AnimatedNumber } from '@/ui/charts';
import { riseIn, spring } from '@/lib/motion';
import { format } from '@/lib/dates';
import type { ReviewCadence } from '@/core/types';
import { startOfWeek } from 'date-fns';

const QUESTIONS: Record<ReviewCadence, string[]> = {
  daily: [],
  weekly: [
    'What actually moved forward this week?',
    'What did you avoid, and why?',
    'What deserves less of your time next week?',
    'One thing to do differently next week:',
  ],
  monthly: [
    'Which goal moved the most this month — and what caused it?',
    'Where did the month leak time or energy?',
    'What will you say no to next month?',
  ],
  quarterly: [
    'Which goals are still worth pursuing as written?',
    'What systems (not efforts) need to change?',
    'What is the single bet for next quarter?',
  ],
  annual: [
    'What defined this year?',
    'What are you demonstrably better at than a year ago?',
    'What would make next year unambiguously successful?',
  ],
};

function periodKeyFor(cadence: ReviewCadence): string {
  const now = new Date();
  switch (cadence) {
    case 'weekly':
      return `w:${format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')}`;
    case 'monthly':
      return `m:${format(now, 'yyyy-MM')}`;
    case 'quarterly':
      return `q:${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
    case 'annual':
      return `y:${now.getFullYear()}`;
    default:
      return format(now, 'yyyy-MM-dd');
  }
}

const CADENCE_LABEL: Record<Exclude<ReviewCadence, 'daily'>, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export default function ReviewsView() {
  const reviews = useData((s) => s.reviews);
  const saveReview = useData((s) => s.saveReview);
  const tasks = useData((s) => s.tasks);
  const sessions = useData((s) => s.sessions);
  const toast = useUi((s) => s.toast);

  const [cadence, setCadence] = useState<Exclude<ReviewCadence, 'daily'>>('weekly');
  const periodKey = periodKeyFor(cadence);
  const existing = reviews.find((r) => r.cadence === cadence && r.periodKey === periodKey);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const weekStats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      done: tasks.filter((t) => t.completedAt && t.completedAt > weekAgo).length,
      focus: Math.round(
        sessions
          .filter((s) => s.startedAt > weekAgo && s.endedAt)
          .reduce((acc, s) => acc + ((s.endedAt as number) - s.startedAt) / 3600000, 0),
      ),
    };
  }, [tasks, sessions]);

  const current = existing?.answers ?? answers;
  const questions = QUESTIONS[cadence];
  const done = !!existing;

  return (
    <div className="view view-narrow">
      <motion.header className="view-head row between g-4 wrap" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Reviews</h2>
          <p className="view-sub">The system only stays honest if you look back on schedule.</p>
        </div>
        <Segmented
          layoutNs="review-cadence"
          label="Review cadence"
          value={cadence}
          options={(Object.keys(CADENCE_LABEL) as (keyof typeof CADENCE_LABEL)[]).map((c) => ({
            value: c,
            label: CADENCE_LABEL[c],
          }))}
          onChange={(c) => {
            setCadence(c);
            setAnswers({});
          }}
        />
      </motion.header>

      {cadence === 'weekly' && (
        <motion.section className="panel panel-pad row g-8 wrap" style={{ marginBottom: 'var(--stack-gap)' }} variants={riseIn} initial="hidden" animate="show">
          <div className="stat">
            <span className="stat-value"><AnimatedNumber value={weekStats.done} /></span>
            <span className="stat-label">tasks completed, 7 days</span>
          </div>
          <div className="stat">
            <span className="stat-value"><AnimatedNumber value={weekStats.focus} format={(n) => `${Math.round(n)}h`} /></span>
            <span className="stat-label">deliberate focus</span>
          </div>
          <div className="stat">
            <span className="stat-value">{reviews.filter((r) => r.cadence === 'weekly').length}</span>
            <span className="stat-label">weekly reviews kept</span>
          </div>
        </motion.section>
      )}

      <AnimatePresence mode="wait">
        <motion.section
          key={cadence}
          className="panel panel-pad col g-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: spring.smooth }}
          exit={{ opacity: 0, y: -6 }}
        >
          <div className="row between g-4">
            <h3 className="panel-title">{CADENCE_LABEL[cadence]} review · {periodKey.slice(2)}</h3>
            {done && <span className="t-caption" style={{ color: 'var(--success)' }}>✓ completed</span>}
          </div>
          {questions.map((q) => (
            <Textarea
              key={q}
              label={q}
              rows={2}
              value={current[q] ?? ''}
              disabled={done}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
            />
          ))}
          {!done && (
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={() => {
                  saveReview(cadence, periodKey, answers);
                  toast({ message: `${CADENCE_LABEL[cadence]} review saved`, kind: 'success' });
                }}
              >
                Complete review
              </Button>
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      {reviews.filter((r) => r.cadence === cadence).length > 0 && (
        <section style={{ marginTop: 'var(--stack-gap)' }}>
          <p className="t-eyebrow" style={{ marginBottom: 'var(--sp-4)' }}>Past {CADENCE_LABEL[cadence].toLowerCase()} reviews</p>
          <div className="col g-3">
            {reviews
              .filter((r) => r.cadence === cadence)
              .sort((a, b) => b.completedAt - a.completedAt)
              .map((r) => (
                <details key={r.id} className="panel" style={{ padding: 'var(--sp-5) var(--sp-6)' }}>
                  <summary className="t-body-sm" style={{ cursor: 'pointer', fontWeight: 500 }}>
                    {r.periodKey.slice(2)} · {format(new Date(r.completedAt), 'MMM d')}
                  </summary>
                  <div className="col g-4" style={{ marginTop: 'var(--sp-4)' }}>
                    {Object.entries(r.answers).map(([q, a]) => (
                      <div key={q}>
                        <p className="t-caption ink-faint">{q}</p>
                        <p className="t-body-sm ink-muted">{a || '—'}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

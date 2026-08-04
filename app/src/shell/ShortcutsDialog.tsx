/** Keyboard shortcuts reference (?). Shortcuts shown = shortcuts that work. */

import { Dialog } from '@/ui/overlays';
import { Kbd } from '@/ui/primitives';
import { useUi } from '@/core/store/ui';
import { modLabel } from '@/lib/hooks/useHotkeys';

const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Global',
    rows: [
      ['Command palette', `${modLabel} K`],
      ['Quick capture', `${modLabel} ⇧ N`],
      ['This reference', '?'],
    ],
  },
  {
    title: 'Go to',
    rows: [
      ['Today', 'G T'],
      ['Inbox', 'G I'],
      ['Upcoming', 'G U'],
      ['Calendar', 'G C'],
      ['Projects', 'G P'],
      ['Focus', 'G F'],
      ['Habits', 'G H'],
      ['Goals', 'G G'],
      ['Notes', 'G N'],
      ['Dashboard', 'G D'],
    ],
  },
  {
    title: 'Lists',
    rows: [
      ['Open task', '↵'],
      ['Navigate results', '↑ ↓'],
      ['Close any layer', 'Esc'],
    ],
  },
];

export function ShortcutsDialog() {
  const overlay = useUi((s) => s.overlay);
  const close = useUi((s) => s.closeOverlay);
  return (
    <Dialog open={overlay?.kind === 'shortcuts'} onClose={close} title="Keyboard shortcuts" width={560}>
      <div className="grid-2" style={{ gap: 'var(--sp-8)' }}>
        {GROUPS.map((g) => (
          <section key={g.title}>
            <p className="t-eyebrow" style={{ marginBottom: 'var(--sp-4)' }}>{g.title}</p>
            <div className="col g-3">
              {g.rows.map(([label, keys]) => (
                <div key={label} className="row between g-4">
                  <span className="t-body-sm ink-muted">{label}</span>
                  <span className="row g-1">
                    {keys.split(' ').map((k, i) => (
                      <Kbd key={i}>{k}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  );
}

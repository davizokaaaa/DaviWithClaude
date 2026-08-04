/**
 * Notes — knowledge base, journal, meeting notes, bookmarks and reading list
 * in one surface with a master-detail layout and instant filtering.
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import { useData } from '@/core/store/data';
import { Button, Chip, EmptyState, Select } from '@/ui/primitives';
import { riseIn, stagger, staggerItem, fade } from '@/lib/motion';
import { format } from '@/lib/dates';
import type { NoteKind } from '@/core/types';

const KIND_META: Record<NoteKind | 'all', string> = {
  all: 'Todas',
  note: 'Notas',
  journal: 'Diário',
  meeting: 'Reuniões',
  bookmark: 'Favoritos',
  reading: 'Leituras',
};

export default function NotesView({ param }: { param?: string }) {
  const notes = useData((s) => s.notes);
  const addNote = useData((s) => s.addNote);
  const updateNote = useData((s) => s.updateNote);
  const deleteNote = useData((s) => s.deleteNote);

  const [kind, setKind] = useState<NoteKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(param ?? null);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return notes
      .filter((n) => kind === 'all' || n.kind === kind)
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
  }, [notes, kind, query]);

  const active = notes.find((n) => n.id === activeId) ?? visible[0];

  return (
    <div className="view" style={{ maxWidth: 'none' }}>
      <motion.header className="view-head row between g-4 wrap" variants={riseIn} initial="hidden" animate="show">
        <div>
          <h2 className="view-title">Notes</h2>
          <p className="view-sub">Tudo o que você sabe, a uma busca de distância.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            const n = addNote({ title: 'Sem título', kind: kind === 'all' ? 'note' : kind });
            setActiveId(n.id);
          }}
        >
          + Nova nota
        </Button>
      </motion.header>

      <div className="notes-layout">
        <aside className="col g-4">
          <input
            className="input"
            placeholder="Filtrar notas…"
            aria-label="Filtrar notas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="row g-2 wrap">
            {(Object.keys(KIND_META) as (NoteKind | 'all')[]).map((k) => (
              <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
                {KIND_META[k]}
              </Chip>
            ))}
          </div>
          <motion.div className="col panel" style={{ padding: 'var(--sp-3)', maxHeight: '58vh', overflowY: 'auto' }} variants={stagger()} initial="hidden" animate="show">
            <AnimatePresence initial={false}>
              {visible.map((n) => (
                <motion.button
                  key={n.id}
                  variants={staggerItem}
                  layout="position"
                  className={clsx('note-item', active?.id === n.id && 'is-active')}
                  onClick={() => setActiveId(n.id)}
                >
                  <span className="row g-3">
                    {n.pinned && <span aria-label="Fixada" style={{ fontSize: 10 }}>★</span>}
                    <span className="t-body-sm truncate" style={{ fontWeight: 500 }}>{n.title}</span>
                  </span>
                  <span className="t-micro ink-faint truncate">
                    {KIND_META[n.kind]} · {format(new Date(n.updatedAt), 'MMM d')}
                    {n.readingStatus && ` · ${({ 'to-read': 'a ler', reading: 'lendo', read: 'lida' } as const)[n.readingStatus]}`}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
            {visible.length === 0 && <p className="t-body-sm ink-faint" style={{ padding: 'var(--sp-5)' }}>Nada encontrado.</p>}
          </motion.div>
        </aside>

        <AnimatePresence mode="wait">
          {active ? (
            <motion.section
              key={active.id}
              className="panel panel-pad col g-5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={fade.base}
            >
              <div className="row g-3 wrap">
                <Select
                  aria-label="Tipo de nota"
                  value={active.kind}
                  onChange={(e) => updateNote(active.id, { kind: e.target.value as NoteKind })}
                  style={{ width: 130 }}
                >
                  {(Object.keys(KIND_META) as (NoteKind | 'all')[]).filter((k) => k !== 'all').map((k) => (
                    <option key={k} value={k}>{KIND_META[k]}</option>
                  ))}
                </Select>
                {(active.kind === 'bookmark' || active.kind === 'reading') && (
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 160 }}
                    placeholder="https://…"
                    aria-label="URL"
                    value={active.url ?? ''}
                    onChange={(e) => updateNote(active.id, { url: e.target.value })}
                  />
                )}
                {active.kind === 'reading' && (
                  <Select
                    aria-label="Status de leitura"
                    value={active.readingStatus ?? 'to-read'}
                    onChange={(e) => updateNote(active.id, { readingStatus: e.target.value as 'to-read' | 'reading' | 'read' })}
                    style={{ width: 110 }}
                  >
                    <option value="to-read">A ler</option>
                    <option value="reading">Lendo</option>
                    <option value="read">Lida</option>
                  </Select>
                )}
                <span className="spacer" />
                <Button size="sm" variant="ghost" onClick={() => updateNote(active.id, { pinned: !active.pinned })}>
                  {active.pinned ? '★ Fixada' : '☆ Fixar'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => { deleteNote(active.id); setActiveId(null); }}>
                  Excluir
                </Button>
              </div>
              <input
                className="note-editor-title"
                aria-label="Título da nota"
                value={active.title}
                onChange={(e) => updateNote(active.id, { title: e.target.value })}
                placeholder="Sem título"
              />
              <textarea
                className="note-editor-body"
                aria-label="Corpo da nota"
                value={active.body}
                onChange={(e) => updateNote(active.id, { body: e.target.value })}
                placeholder="Escreva. Tudo é salvo automaticamente."
              />
              <p className="t-micro ink-faint">
                Editada {format(new Date(active.updatedAt), "d 'de' MMM, HH:mm")} · salva automaticamente
              </p>
            </motion.section>
          ) : (
            <EmptyState title="Nenhuma nota selecionada" hint="Escolha uma nota à esquerda ou crie uma nova." />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

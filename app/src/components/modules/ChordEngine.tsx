'use client';
import { useState, useEffect } from 'react';
import { useProjectStore, Section } from '@/store/projectStore';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { playNote, getScaleNotes, NOTES } from '@/lib/audio';
import { exportChordsMidi } from '@/lib/midi';

const CHORD_TYPES = ['min', 'maj', 'dim', 'aug', 'sus2', 'sus4', 'dom7', 'maj7', 'min7', 'min9', 'maj9', 'add9'];
const ROMAN = ['i', 'ii', 'III', 'iv', 'V', 'VI', 'VII'];

const SUGGESTIONS: Record<string, { label: string; chords: string[] }[]> = {
  dark_boom_bap: [
    { label: 'Dilla-style', chords: ['i', 'VI', 'III', 'VII'] },
    { label: 'Premier-flavored', chords: ['i', 'iv', 'V', 'i'] },
    { label: 'Gritty movement', chords: ['i', 'bVII', 'bVI', 'V'] },
  ],
  trap: [
    { label: 'Metro-energy', chords: ['i', 'VI', 'III', 'VII'] },
    { label: 'Dark loop', chords: ['i', 'bVII', 'i', 'bVI'] },
    { label: 'Cinematic', chords: ['i', 'III', 'VI', 'VII'] },
  ],
  horror_cinematic: [
    { label: 'Psycho strings', chords: ['i', 'bII', 'i', 'dim'] },
    { label: 'Tritone terror', chords: ['i', 'bV', 'bII', 'i'] },
    { label: 'Horror walk', chords: ['i', 'bvii', 'bVI', 'bV'] },
  ],
};

const CHORD_COLORS: Record<string, string> = {
  i: '#bf00ff', ii: '#76d6d5', III: '#e9c349', iv: '#76d6d5',
  V: '#e9c349', VI: '#ff6b9d', VII: '#ff6b1a', bII: '#ff3333',
  bV: '#ff3333', bVI: '#ff6b9d', bVII: '#ff6b1a', dim: '#8b0000',
};

interface ChordBlock {
  root: string;
  type: string;
  roman: string;
}

const EXT_INTERVALS: Record<string, number[]> = {
  maj7: [11], min7: [10], dom7: [10], maj9: [11, 14], min9: [10, 13], add9: [14], '11th': [10, 17], '13th': [10, 21],
};

export function ChordEngine() {
  const { activeSection, key, scale, vibe, bpm, setChordSlot } = useProjectStore();
  const [chords, setChords] = useState<ChordBlock[]>([
    { root: key, type: 'min', roman: 'i' },
  ]);
  const [activeExts, setActiveExts] = useState<Set<string>>(new Set());

  useEffect(() => {
    chords.forEach((c, i) => setChordSlot(activeSection, i, { root: c.root, type: c.type, inversion: 0 }));
  }, [chords, activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const scaleNotes = getScaleNotes(key, scale);

  const addChord = () => {
    const nextRoot = scaleNotes[chords.length % scaleNotes.length]?.replace(/\d/, '') || key;
    setChords(prev => [...prev, { root: nextRoot, type: 'min', roman: ROMAN[chords.length % ROMAN.length] }]);
  };

  const removeChord = (idx: number) => setChords(prev => prev.filter((_, i) => i !== idx));

  const updateChord = (idx: number, patch: Partial<ChordBlock>) => {
    setChords(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  const previewChord = (chord: ChordBlock) => {
    const noteIdx = NOTES.indexOf(chord.root);
    const notes = [
      `${chord.root}3`,
      `${NOTES[(noteIdx + 4) % 12]}3`,
      `${NOTES[(noteIdx + 7) % 12]}4`,
    ];
    const extNotes = Array.from(activeExts).flatMap(ext =>
      (EXT_INTERVALS[ext] ?? []).map(iv => `${NOTES[(noteIdx + iv) % 12]}4`)
    );
    [...notes, ...extNotes].forEach((n, i) => setTimeout(() => playNote(n, '2n', 'pad'), i * 15));
  };

  const previewSection = () => {
    chords.forEach((chord, i) => setTimeout(() => previewChord(chord), i * 1400));
  };

  const toggleExt = (ext: string) => setActiveExts(prev => {
    const next = new Set(prev);
    next.has(ext) ? next.delete(ext) : next.add(ext);
    return next;
  });

  const suggestions = SUGGESTIONS[vibe] || SUGGESTIONS.trap;

  return (
    <div className="flex gap-4 h-full p-4 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center gap-4 shrink-0">
          <SectionTabs />
          <div className="ml-auto flex items-center gap-2 text-xs text-white/40">
            <span className="text-teal font-bold">{key}</span>
            <span>{scale.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Chord lane */}
        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
          {chords.map((chord, idx) => (
            <ChordCard
              key={idx}
              chord={chord}
              onUpdate={p => updateChord(idx, p)}
              onRemove={() => removeChord(idx)}
              onPreview={() => previewChord(chord)}
            />
          ))}
          <button
            onClick={addChord}
            className="w-24 h-32 rounded-xl border-2 border-dashed border-white/10 text-white/20 text-2xl hover:border-purple/40 hover:text-purple/40 transition-all cursor-pointer shrink-0"
          >+</button>
        </div>

        {/* Scale degree reference */}
        <div className="flex-1 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">SCALE NOTES IN {key}</div>
          <div className="flex flex-wrap gap-2 mb-6">
            {scaleNotes.map(n => (
              <button
                key={n}
                onClick={() => playNote(n, '2n', 'melody')}
                className="px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all hover:scale-105"
                style={{ background: '#1c1b1e', border: '1px solid #353437', color: '#76d6d5' }}
              >
                {n}
              </button>
            ))}
          </div>

          {/* AI Suggestions */}
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">AI SUGGESTIONS FOR {vibe.replace(/_/g, ' ')}</div>
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setChords(s.chords.map((r, ri) => ({ root: scaleNotes[ri]?.replace(/\d/, '') || key, type: 'min', roman: r })))}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all text-left"
                style={{ background: '#1c1b1e', border: '1px solid #353437' }}
              >
                <span className="text-[9px] text-white/40 uppercase w-28 shrink-0">{s.label}</span>
                <div className="flex gap-2">
                  {s.chords.map((c, ci) => (
                    <span key={ci} className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: `${CHORD_COLORS[c] || '#bf00ff'}22`, color: CHORD_COLORS[c] || '#bf00ff' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-56 shrink-0 flex flex-col gap-3">
        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">EXTENSIONS</div>
          <div className="flex flex-wrap gap-1">
            {['maj7', 'min7', 'dom7', 'maj9', 'min9', 'add9', '11th', '13th'].map(ext => {
              const on = activeExts.has(ext);
              return (
                <button key={ext} onClick={() => toggleExt(ext)}
                  className="text-[9px] px-2 py-1 rounded cursor-pointer transition-all border font-bold"
                  style={{ background: on ? '#bf00ff22' : 'transparent', borderColor: on ? '#bf00ff' : '#353437', color: on ? '#bf00ff' : '#ffffff50' }}>
                  {ext}
                </button>
              );
            })}
          </div>
          {activeExts.size > 0 && (
            <div className="text-[7px] text-white/20 mt-2 uppercase tracking-wider">active on next preview</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={previewSection} className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-purple/20 border border-purple/40 text-purple hover:bg-purple/30 transition-all">
            PREVIEW SECTION
          </button>
          <button onClick={() => exportChordsMidi(chords, bpm)} className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all">
            EXPORT MIDI
          </button>
        </div>
      </div>
    </div>
  );
}

function ChordCard({ chord, onUpdate, onRemove, onPreview }: {
  chord: ChordBlock;
  onUpdate: (p: Partial<ChordBlock>) => void;
  onRemove: () => void;
  onPreview: () => void;
}) {
  const color = CHORD_COLORS[chord.roman] || '#bf00ff';
  return (
    <div
      className="w-24 h-32 rounded-xl shrink-0 flex flex-col p-2 cursor-pointer transition-all hover:scale-105"
      style={{ background: `${color}15`, border: `1px solid ${color}44`, boxShadow: `0 0 12px ${color}22` }}
      onClick={onPreview}
    >
      <div className="flex justify-between mb-1">
        <select
          value={chord.roman}
          onClick={e => e.stopPropagation()}
          onChange={e => onUpdate({ roman: e.target.value })}
          className="text-[9px] bg-transparent font-bold cursor-pointer outline-none"
          style={{ color }}
        >
          {ROMAN.map(r => <option key={r} value={r} className="bg-surface-low">{r}</option>)}
        </select>
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-white/20 hover:text-red text-xs cursor-pointer">×</button>
      </div>
      <div className="text-lg font-black text-center mt-1" style={{ color }}>
        {chord.root}
      </div>
      <select
        value={chord.type}
        onClick={e => e.stopPropagation()}
        onChange={e => onUpdate({ type: e.target.value })}
        className="text-[9px] bg-transparent text-center cursor-pointer outline-none mt-1 text-white/60"
      >
        {CHORD_TYPES.map(t => <option key={t} value={t} className="bg-surface-low">{t}</option>)}
      </select>
      <select
        value={chord.root}
        onClick={e => e.stopPropagation()}
        onChange={e => onUpdate({ root: e.target.value })}
        className="text-[9px] bg-transparent text-center cursor-pointer outline-none mt-auto text-white/40"
      >
        {NOTES.map(n => <option key={n} value={n} className="bg-surface-low">{n}</option>)}
      </select>
    </div>
  );
}

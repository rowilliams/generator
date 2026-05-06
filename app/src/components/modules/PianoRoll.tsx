'use client';
import { useState, useRef, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { playNote, getScaleNotes, NOTES } from '@/lib/audio';

type Tool = 'select' | 'draw' | 'erase';

interface Note {
  id: string;
  pitch: string;      // e.g. "C4"
  step: number;       // 0–63 (4 bars × 16 steps)
  length: number;     // in steps (1 = 16th note)
  velocity: number;   // 0–127
}

const OCTAVES = [6, 5, 4, 3, 2];
const ALL_PITCHES: string[] = OCTAVES.flatMap(oct =>
  [...NOTES].reverse().map(n => `${n}${oct}`)
);
const STEP_W = 20;
const ROW_H = 14;

const DARK_TOOLS = [
  { label: 'REHARMONIZE DARK', desc: 'Shift chords to tritone/dim7' },
  { label: 'GHOST NOTES', desc: 'Add subtle chromatic ghosts' },
  { label: 'PITCH DRIFT', desc: 'Micro-detune for unease' },
  { label: 'INTERVAL SHIFT', desc: 'Move by dark intervals' },
];

const MOTIF_TOOLS = [
  { label: 'REPEAT', action: 'repeat' },
  { label: 'INVERT', action: 'invert' },
  { label: 'RETROGRADE', action: 'retrograde' },
  { label: 'TRANSPOSE ↑', action: 'transpose_up' },
  { label: 'TRANSPOSE ↓', action: 'transpose_dn' },
  { label: 'HARMONIZE', action: 'harmonize' },
];

export function PianoRoll() {
  const { key, scale, vibe, loopBars } = useProjectStore();
  const STEPS = loopBars * 16;
  const [notes, setNotes] = useState<Note[]>([]);
  const [tool, setTool] = useState<Tool>('draw');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawing, setDrawing] = useState<Note | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const scaleNotes = useMemo(() => getScaleNotes(key, scale, 4).map(n => n.replace(/\d/, '')), [key, scale]);

  const isInScale = (pitch: string) => {
    const noteName = pitch.replace(/\d/, '');
    return scaleNotes.includes(noteName);
  };

  const pitchIdx = (pitch: string) => ALL_PITCHES.indexOf(pitch);

  const startDraw = useCallback((pitch: string, step: number) => {
    if (tool === 'erase') {
      setNotes(prev => prev.filter(n => !(n.pitch === pitch && step >= n.step && step < n.step + n.length)));
      return;
    }
    if (tool === 'draw') {
      const id = `${Date.now()}-${Math.random()}`;
      const n: Note = { id, pitch, step, length: 1, velocity: 100 };
      setDrawing(n);
      setNotes(prev => [...prev, n]);
      playNote(pitch, '16n', 'melody');
    }
  }, [tool]);

  const extendDraw = useCallback((step: number) => {
    if (!drawing) return;
    setNotes(prev => prev.map(n =>
      n.id === drawing.id
        ? { ...n, length: Math.max(1, step - n.step + 1) }
        : n
    ));
  }, [drawing]);

  const endDraw = useCallback(() => setDrawing(null), []);

  const applyMotif = (action: string) => {
    const selected = notes.filter(n => selectedIds.has(n.id));
    if (selected.length === 0) return;

    setNotes(prev => {
      const others = prev.filter(n => !selectedIds.has(n.id));
      let modified: Note[] = [];

      if (action === 'repeat') {
        const maxStep = Math.max(...selected.map(n => n.step + n.length));
        const offset = maxStep - Math.min(...selected.map(n => n.step));
        modified = [
          ...selected,
          ...selected.map(n => ({ ...n, id: `${n.id}-rep`, step: n.step + offset })),
        ];
      } else if (action === 'invert') {
        const midPitch = Math.round(selected.reduce((s, n) => s + pitchIdx(n.pitch), 0) / selected.length);
        modified = selected.map(n => {
          const delta = pitchIdx(n.pitch) - midPitch;
          const newPitch = ALL_PITCHES[Math.max(0, Math.min(ALL_PITCHES.length - 1, midPitch - delta))];
          return { ...n, pitch: newPitch };
        });
      } else if (action === 'retrograde') {
        const minStep = Math.min(...selected.map(n => n.step));
        const maxStep = Math.max(...selected.map(n => n.step + n.length));
        modified = selected.map(n => ({
          ...n,
          step: minStep + (maxStep - (n.step + n.length)),
        }));
      } else if (action === 'transpose_up') {
        modified = selected.map(n => {
          const idx = pitchIdx(n.pitch);
          return { ...n, pitch: ALL_PITCHES[Math.max(0, idx - 1)] };
        });
      } else if (action === 'transpose_dn') {
        modified = selected.map(n => {
          const idx = pitchIdx(n.pitch);
          return { ...n, pitch: ALL_PITCHES[Math.min(ALL_PITCHES.length - 1, idx + 1)] };
        });
      } else if (action === 'harmonize') {
        const harmony = selected.map(n => {
          const idx = pitchIdx(n.pitch);
          return { ...n, id: `${n.id}-h`, pitch: ALL_PITCHES[Math.min(ALL_PITCHES.length - 1, idx + 4)] };
        });
        modified = [...selected, ...harmony];
      } else {
        modified = selected;
      }

      return [...others, ...modified];
    });
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-hidden">
      {/* Top controls */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <SectionTabs />
        <div className="flex gap-1 ml-auto">
          {(['select', 'draw', 'erase'] as Tool[]).map(t => (
            <button key={t} onClick={() => setTool(t)}
              className="px-3 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
              style={{
                background: tool === t ? '#bf00ff33' : '#252428',
                border: `1px solid ${tool === t ? '#bf00ff' : '#353437'}`,
                color: tool === t ? '#bf00ff' : '#ffffff55',
              }}
            >{t}</button>
          ))}
        </div>
        <button
          onClick={() => setNotes([])}
          className="px-3 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all bg-surface-high border border-white/10 text-white/40 hover:text-white/70"
        >CLEAR</button>
      </div>

      <div className="flex flex-1 overflow-hidden gap-3">
        {/* Piano roll grid */}
        <div className="flex flex-1 overflow-auto" ref={gridRef}>
          {/* Key strip */}
          <div className="shrink-0 flex flex-col" style={{ width: 48 }}>
            {ALL_PITCHES.map(pitch => {
              const noteName = pitch.replace(/\d/, '');
              const isBlack = noteName.includes('#');
              const inScale = isInScale(pitch);
              return (
                <div
                  key={pitch}
                  onClick={() => playNote(pitch, '8n', 'melody')}
                  className="flex items-center justify-end pr-1 cursor-pointer select-none shrink-0 transition-opacity hover:opacity-70"
                  style={{
                    height: ROW_H,
                    background: isBlack ? '#111' : '#1c1b1e',
                    borderBottom: '1px solid #0d0d0e',
                    fontSize: 8,
                    color: inScale ? '#76d6d5' : isBlack ? '#444' : '#333',
                    fontWeight: 'bold',
                  }}
                >
                  {noteName === 'C' || noteName === 'F' || noteName === 'A' ? pitch : ''}
                </div>
              );
            })}
          </div>

          {/* Step grid */}
          <div
            className="relative select-none"
            style={{ width: STEPS * STEP_W, flexShrink: 0 }}
            onMouseLeave={endDraw}
            onMouseUp={endDraw}
          >
            {/* Row backgrounds */}
            {ALL_PITCHES.map((pitch, ri) => {
              const noteName = pitch.replace(/\d/, '');
              const isBlack = noteName.includes('#');
              const inScale = isInScale(pitch);
              return (
                <div
                  key={pitch}
                  className="absolute left-0 right-0 flex"
                  style={{ top: ri * ROW_H, height: ROW_H }}
                >
                  {Array.from({ length: STEPS }).map((_, si) => {
                    const isBarStart = si % 16 === 0;
                    const isBeat = si % 4 === 0;
                    return (
                      <div
                        key={si}
                        className="cursor-crosshair"
                        style={{
                          width: STEP_W,
                          height: ROW_H,
                          background: inScale
                            ? isBlack ? '#161519' : '#1a1922'
                            : isBlack ? '#111' : '#131315',
                          borderRight: `1px solid ${isBarStart ? '#353437' : isBeat ? '#252428' : '#1a1920'}`,
                          borderBottom: '1px solid #0f0f11',
                          boxSizing: 'border-box',
                        }}
                        onMouseDown={() => startDraw(pitch, si)}
                        onMouseEnter={() => { if (drawing) extendDraw(si); }}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Bar markers */}
            {Array.from({ length: loopBars }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 text-[8px] text-white/20 font-bold pointer-events-none"
                style={{ left: i * 16 * STEP_W + 2 }}
              >
                {i + 1}
              </div>
            ))}

            {/* Note blocks */}
            {notes.map(n => {
              const ri = pitchIdx(n.pitch);
              const inScale = isInScale(n.pitch);
              const color = inScale ? '#76d6d5' : '#ff6b9d';
              const selected = selectedIds.has(n.id);
              return (
                <div
                  key={n.id}
                  className="absolute rounded-sm pointer-events-auto cursor-pointer"
                  style={{
                    top: ri * ROW_H + 1,
                    left: n.step * STEP_W + 1,
                    width: n.length * STEP_W - 2,
                    height: ROW_H - 2,
                    background: selected ? `${color}cc` : `${color}99`,
                    border: `1px solid ${color}`,
                    boxShadow: `0 0 6px ${color}66`,
                    zIndex: 10,
                  }}
                  onMouseDown={e => {
                    e.stopPropagation();
                    if (tool === 'select') {
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.has(n.id) ? next.delete(n.id) : next.add(n.id);
                        return next;
                      });
                    } else if (tool === 'erase') {
                      setNotes(prev => prev.filter(x => x.id !== n.id));
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-48 shrink-0 flex flex-col gap-3">
          {/* Motif tools */}
          <div className="bg-surface-low rounded-xl p-3">
            <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">MOTIF TOOLS</div>
            <div className="flex flex-col gap-1">
              {MOTIF_TOOLS.map(m => (
                <button
                  key={m.action}
                  onClick={() => applyMotif(m.action)}
                  className="text-[9px] px-2 py-1.5 rounded cursor-pointer hover:bg-teal/20 transition-all border border-white/5 text-white/50 hover:text-teal hover:border-teal/30 text-left uppercase tracking-wider font-bold"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dark/Horror tools */}
          <div className="bg-surface-low rounded-xl p-3">
            <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold" style={{ color: '#8b0000' }}>
              DARK / HORROR
            </div>
            <div className="flex flex-col gap-1">
              {DARK_TOOLS.map(t => (
                <button
                  key={t.label}
                  title={t.desc}
                  className="text-[8px] px-2 py-1.5 rounded cursor-pointer transition-all border text-left uppercase tracking-wider font-bold"
                  style={{ borderColor: '#8b000044', color: '#cc333388', background: '#8b000011' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ff3333'; (e.currentTarget as HTMLElement).style.background = '#8b000022'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#cc333388'; (e.currentTarget as HTMLElement).style.background = '#8b000011'; }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scale info */}
          <div className="bg-surface-low rounded-xl p-3">
            <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">SCALE GUIDE</div>
            <div className="flex flex-wrap gap-1">
              {scaleNotes.map(n => (
                <span key={n} className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: '#76d6d522', color: '#76d6d5', border: '1px solid #76d6d544' }}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Export */}
          <button className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all mt-auto">
            EXPORT MIDI
          </button>
        </div>
      </div>

      {/* Velocity lane */}
      <div className="shrink-0 h-14 bg-surface-low rounded-xl overflow-hidden relative" style={{ marginLeft: 48 + 12 + 192 + 12 > 0 ? 0 : 0 }}>
        <div className="text-[8px] uppercase tracking-widest text-white/20 font-bold absolute top-1 left-2">VELOCITY</div>
        <div className="flex h-full items-end px-1 pt-4 gap-px overflow-hidden">
          {Array.from({ length: STEPS }).map((_, si) => {
            const stepNotes = notes.filter(n => n.step === si);
            const vel = stepNotes.length ? Math.max(...stepNotes.map(n => n.velocity)) : 0;
            return (
              <div
                key={si}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${vel / 127 * 100}%`,
                  minHeight: vel ? 2 : 0,
                  background: vel ? '#bf00ff' : 'transparent',
                  boxShadow: vel ? '0 0 4px #bf00ff88' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

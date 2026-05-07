'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';

type TrackId = 'drums' | 'bass' | 'guitar' | 'melody' | 'chords' | 'synth' | 'vocal' | 'orch';
type SectionType = 'intro' | 'verse' | 'pre_chorus' | 'chorus' | 'bridge' | 'outro';
interface Section { id: string; type: SectionType; bars: 4 | 8 | 16; tracks: Set<TrackId> }

const SECTION_COLORS: Record<SectionType, string> = {
  intro: '#7090b0', verse: '#76d6d5', pre_chorus: '#e9c349',
  chorus: '#bf00ff', bridge: '#ff6b1a', outro: '#7090b0',
};

const SECTION_LABELS: Record<SectionType, string> = {
  intro: 'INTRO', verse: 'VERSE', pre_chorus: 'PRE-CHORUS',
  chorus: 'CHORUS', bridge: 'BRIDGE', outro: 'OUTRO',
};

const DEFAULT_TRACKS: Record<SectionType, TrackId[]> = {
  intro: ['drums', 'bass'],
  verse: ['drums', 'bass', 'guitar', 'melody'],
  pre_chorus: ['drums', 'bass', 'guitar', 'chords', 'synth'],
  chorus: ['drums', 'bass', 'guitar', 'melody', 'chords', 'synth', 'vocal'],
  bridge: ['bass', 'chords', 'orch'],
  outro: ['drums', 'bass'],
};

const TRACKS: { id: TrackId; label: string; icon: string; color: string }[] = [
  { id: 'drums',  label: 'DRUMS',  icon: '⬡', color: '#ff3333' },
  { id: 'bass',   label: 'BASS',   icon: '〜', color: '#7a00a6' },
  { id: 'guitar', label: 'GUITAR', icon: '♪', color: '#ff6b1a' },
  { id: 'melody', label: 'MELODY', icon: '♫', color: '#76d6d5' },
  { id: 'chords', label: 'CHORDS', icon: '⧖', color: '#e9c349' },
  { id: 'synth',  label: 'SYNTH',  icon: '∿', color: '#bf00ff' },
  { id: 'vocal',  label: 'VOCAL',  icon: '⊕', color: '#ff6b9d' },
  { id: 'orch',   label: 'ORCH',   icon: '♬', color: '#9b59b6' },
];

let _uid = 0;
const uid = () => `s${++_uid}`;

const makeSection = (type: SectionType, bars: 4 | 8 | 16 = 8): Section => ({
  id: uid(), type, bars, tracks: new Set(DEFAULT_TRACKS[type]),
});

const DEFAULT_SECTIONS: Section[] = [
  makeSection('intro', 4), makeSection('verse', 8), makeSection('pre_chorus', 4),
  makeSection('chorus', 8), makeSection('verse', 8), makeSection('chorus', 8),
  makeSection('bridge', 4), makeSection('outro', 4),
];

function formatDuration(totalBars: number, bpm: number): string {
  const secs = Math.round((totalBars * 4 * 60) / bpm);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimelineEngine() {
  const { bpm } = useProjectStore();
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [activeId, setActiveId] = useState<string>(DEFAULT_SECTIONS[0].id);

  const activeIdx = sections.findIndex(s => s.id === activeId);
  const activeSection = sections[activeIdx] ?? sections[0];

  const updateSection = (id: string, patch: Partial<Omit<Section, 'id' | 'tracks'>> & { tracks?: Set<TrackId> }) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const toggleCell = (sectionId: string, trackId: TrackId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const next = new Set(s.tracks);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      return { ...s, tracks: next };
    }));
  };

  const addSection = () => {
    const ns = makeSection('verse', 8);
    setSections(prev => [...prev, ns]);
    setActiveId(ns.id);
  };

  const removeSection = () => {
    if (sections.length <= 1) return;
    const newSecs = sections.filter(s => s.id !== activeId);
    setSections(newSecs);
    const ni = Math.min(activeIdx, newSecs.length - 1);
    setActiveId(newSecs[ni].id);
  };

  const copySection = () => {
    const ns: Section = { ...activeSection, id: uid(), tracks: new Set(activeSection.tracks) };
    setSections(prev => {
      const next = [...prev];
      next.splice(activeIdx + 1, 0, ns);
      return next;
    });
    setActiveId(ns.id);
  };

  const moveSection = (dir: -1 | 1) => {
    const ni = activeIdx + dir;
    if (ni < 0 || ni >= sections.length) return;
    setSections(prev => {
      const next = [...prev];
      [next[activeIdx], next[ni]] = [next[ni], next[activeIdx]];
      return next;
    });
  };

  const setBars = (bars: 4 | 8 | 16) => updateSection(activeId, { bars });

  const totalBars = sections.reduce((a, s) => a + s.bars, 0);
  const safeBpm = bpm || 120;
  const duration = formatDuration(totalBars, safeBpm);

  const btnBase = 'px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer';
  const accentBtn = `${btnBase} border border-[#7090b0]/40 text-[#7090b0] hover:bg-[#7090b0]/10`;
  const dimBtn = `${btnBase} border border-white/10 text-white/40 hover:bg-white/5`;

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-hidden" style={{ background: '#1c1b1e' }}>

      {/* TOP: Section Manager */}
      <div className="shrink-0 flex flex-col gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {sections.map(sec => {
            const color = SECTION_COLORS[sec.type];
            const isActive = sec.id === activeId;
            return (
              <div
                key={sec.id}
                onClick={() => setActiveId(sec.id)}
                className="shrink-0 min-w-24 rounded-lg p-2 cursor-pointer transition-all"
                style={{
                  background: isActive ? '#252428' : '#131315',
                  borderLeft: `3px solid ${color}`,
                  border: isActive ? `1px solid ${color}60` : '1px solid transparent',
                  borderLeftWidth: '3px',
                  borderLeftColor: color,
                  boxShadow: isActive ? `0 0 10px ${color}30` : 'none',
                }}
              >
                <div className="text-[8px] font-black uppercase" style={{ color }}>{SECTION_LABELS[sec.type]}</div>
                <div className="text-[7px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {sec.bars} bars
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={addSection} className={accentBtn}>+ ADD SECTION</button>
          <button onClick={removeSection} disabled={sections.length <= 1}
            className={`${btnBase} border border-[#ff3333]/40 text-[#ff3333] hover:bg-[#ff3333]/10 disabled:opacity-30 disabled:cursor-not-allowed`}>
            ✕ REMOVE
          </button>
          <div className="flex gap-0.5 ml-1">
            {([4, 8, 16] as const).map(b => (
              <button key={b} onClick={() => setBars(b)}
                className={`${btnBase} ${activeSection?.bars === b ? 'bg-[#7090b0]/20 border-[#7090b0]/60 text-[#7090b0]' : dimBtn}`}>
                {b}
              </button>
            ))}
          </div>
          <button onClick={() => moveSection(-1)} disabled={activeIdx <= 0} className={`${dimBtn} disabled:opacity-30`}>←</button>
          <button onClick={() => moveSection(1)} disabled={activeIdx >= sections.length - 1} className={`${dimBtn} disabled:opacity-30`}>→</button>
        </div>
      </div>

      {/* CENTER: Arrangement Grid */}
      <div className="flex-1 overflow-auto rounded-xl" style={{ background: '#131315', scrollbarWidth: 'thin' }}>
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex sticky top-0 z-10" style={{ background: '#0a0a0c' }}>
            <div className="w-16 shrink-0" />
            {sections.map(sec => {
              const color = SECTION_COLORS[sec.type];
              const colW = Math.min(96, sec.bars * 8);
              return (
                <div key={sec.id} className="shrink-0 px-1 py-1 text-center cursor-pointer"
                  style={{ minWidth: `${colW}px`, borderBottom: `2px solid ${color}` }}
                  onClick={() => setActiveId(sec.id)}>
                  <div className="text-[7px] font-black uppercase leading-tight" style={{ color }}>{SECTION_LABELS[sec.type]}</div>
                </div>
              );
            })}
          </div>

          {/* Track rows */}
          {TRACKS.map((track, ti) => (
            <div key={track.id} className="flex items-center"
              style={{ background: ti % 2 === 0 ? '#131315' : '#1c1b1e' }}>
              <div className="w-16 shrink-0 flex items-center gap-1 px-1.5 py-2">
                <span className="text-[10px]" style={{ color: track.color }}>{track.icon}</span>
                <span className="text-[8px] font-black uppercase leading-tight" style={{ color: track.color }}>{track.label}</span>
              </div>
              {sections.map(sec => {
                const active = sec.tracks.has(track.id);
                const colW = Math.min(96, sec.bars * 8);
                return (
                  <div key={sec.id} className="shrink-0 p-0.5 cursor-pointer"
                    style={{ minWidth: `${colW}px`, height: '32px' }}
                    onClick={() => toggleCell(sec.id, track.id)}>
                    <div className="w-full h-full rounded transition-all"
                      style={{
                        background: active ? `${track.color}30` : 'transparent',
                        border: active ? `1px solid ${track.color}80` : '1px solid rgba(255,255,255,0.05)',
                      }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM: Section Info + Controls */}
      <div className="shrink-0 rounded-xl p-3 flex flex-col gap-2" style={{ background: '#131315', border: '1px solid rgba(255,255,255,0.06)' }}>
        {activeSection && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded"
                style={{ background: `${SECTION_COLORS[activeSection.type]}20`, color: SECTION_COLORS[activeSection.type], border: `1px solid ${SECTION_COLORS[activeSection.type]}50` }}>
                {SECTION_LABELS[activeSection.type]}
              </span>
              <span className="text-[8px] text-white/40 font-bold">{activeSection.bars} BARS</span>
              <span className="text-[8px] text-white/40 font-bold">{activeSection.tracks.size} TRACKS</span>
              <button onClick={copySection} className={`${accentBtn} ml-auto`}>COPY SECTION</button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {TRACKS.map(track => {
                const on = activeSection.tracks.has(track.id);
                return (
                  <button key={track.id} onClick={() => toggleCell(activeSection.id, track.id)}
                    className="text-[8px] font-black uppercase px-2 py-0.5 rounded cursor-pointer transition-all"
                    style={{
                      background: on ? `${track.color}25` : 'transparent',
                      border: `1px solid ${on ? track.color + '70' : 'rgba(255,255,255,0.1)'}`,
                      color: on ? track.color : 'rgba(255,255,255,0.3)',
                    }}>
                    {track.icon} {track.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Song Stats bar */}
      <div className="shrink-0 flex gap-4 text-[8px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <span>TOTAL BARS: {totalBars}</span>
        <span>DURATION: {duration} @ {safeBpm}BPM</span>
        <span>SECTIONS: {sections.length}</span>
      </div>
    </div>
  );
}

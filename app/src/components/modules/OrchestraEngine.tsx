'use client';
import { useState, useCallback } from 'react';
import { loadTone } from '@/lib/audio';

type SectionId = 'strings' | 'brass' | 'woodwinds' | 'percussion';
type Dynamics = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';
type Articulation = 'legato' | 'staccato' | 'pizzicato' | 'tremolo' | 'col legno';

interface Instrument {
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  dynamics: Dynamics;
}

const SECTION_META: Record<SectionId, { label: string; color: string; icon: string; chord: string[] }> = {
  strings:    { label: 'STRINGS',    color: '#9b59b6', icon: '🎻', chord: ['C4','E4','G4'] },
  brass:      { label: 'BRASS',      color: '#e9c349', icon: '🎺', chord: ['C3','E3','G3'] },
  woodwinds:  { label: 'WOODWINDS',  color: '#76d6d5', icon: '🪗', chord: ['C5','E5','G5'] },
  percussion: { label: 'PERCUSSION', color: '#ff6b1a', icon: '🥁', chord: ['C2','G2'] },
};

const SECTION_INSTRUMENTS: Record<SectionId, string[]> = {
  strings:    ['Violin I', 'Violin II', 'Viola', 'Cello', 'Double Bass'],
  brass:      ['French Horn', 'Trumpet', 'Trombone', 'Tuba'],
  woodwinds:  ['Flute', 'Oboe', 'Clarinet', 'Bassoon'],
  percussion: ['Timpani', 'Snare', 'Crash Cymbal', 'Xylophone'],
};

const ARTICULATIONS: Articulation[] = ['legato', 'staccato', 'pizzicato', 'tremolo', 'col legno'];
const DYNAMICS_LIST: Dynamics[] = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];

function makeInstruments(): Record<SectionId, Instrument[]> {
  const result = {} as Record<SectionId, Instrument[]>;
  for (const [sid, names] of Object.entries(SECTION_INSTRUMENTS) as [SectionId, string[]][]) {
    result[sid] = names.map(name => ({ name, volume: 75, muted: false, solo: false, dynamics: 'mf' }));
  }
  return result;
}

export function OrchestraEngine() {
  const [activeSection, setActiveSection] = useState<SectionId>('strings');
  const [articulation, setArticulation] = useState<Articulation>('legato');
  const [instruments, setInstruments] = useState<Record<SectionId, Instrument[]>>(makeInstruments);

  const updateInstrument = useCallback((section: SectionId, index: number, patch: Partial<Instrument>) => {
    setInstruments(prev => {
      const copy = [...prev[section]];
      copy[index] = { ...copy[index], ...patch };
      return { ...prev, [section]: copy };
    });
  }, []);

  const toggleMute = useCallback((section: SectionId, index: number) => {
    setInstruments(prev => {
      const copy = [...prev[section]];
      copy[index] = { ...copy[index], muted: !copy[index].muted };
      return { ...prev, [section]: copy };
    });
  }, []);

  const toggleSolo = useCallback((section: SectionId, index: number) => {
    setInstruments(prev => {
      const wasSolo = prev[section][index].solo;
      const copy = prev[section].map((inst, i) => ({ ...inst, solo: !wasSolo && i === index }));
      return { ...prev, [section]: copy };
    });
  }, []);

  const anySolo = (section: SectionId) => instruments[section].some(i => i.solo);

  const previewSection = async () => {
    const T = await loadTone();
    if (!T) return;
    await T.start();
    const { chord } = SECTION_META[activeSection];
    const synth = new T.PolySynth(T.Synth, {
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.0 },
      volume: -12,
    }).toDestination();
    synth.triggerAttackRelease(chord, 1.5);
    setTimeout(() => synth.dispose(), 4000);
  };

  const meta = SECTION_META[activeSection];
  const sectionInstruments = instruments[activeSection];
  const activeCount = sectionInstruments.filter(i => !i.muted).length;
  const hasSolo = anySolo(activeSection);

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden" style={{ background: '#0a0a0c', color: '#e0e0e0' }}>

      {/* LEFT SIDEBAR */}
      <div className="w-40 shrink-0 flex flex-col gap-2" style={{ background: '#1c1b1e', borderRadius: 12, padding: 10 }}>
        <div className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: '#9b59b6' }}>
          ORCHESTRA
        </div>
        {(Object.keys(SECTION_META) as SectionId[]).map(sid => {
          const m = SECTION_META[sid];
          const active = sid === activeSection;
          return (
            <button
              key={sid}
              onClick={() => setActiveSection(sid)}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-all"
              style={{
                background: active ? '#252428' : '#131315',
                border: `1.5px solid ${active ? m.color : '#353437'}`,
                boxShadow: active ? `0 0 8px ${m.color}55` : 'none',
                cursor: 'pointer',
                color: active ? m.color : '#7090b0',
              }}
            >
              <span style={{ fontSize: 14 }}>{m.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-wider">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* CENTER PANEL */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {/* Articulation row */}
        <div className="flex gap-1 shrink-0 flex-wrap" style={{ background: '#1c1b1e', borderRadius: 10, padding: 8 }}>
          <span className="text-[7px] font-black uppercase tracking-widest self-center mr-1" style={{ color: '#7090b0' }}>ART:</span>
          {ARTICULATIONS.map(art => {
            const active = art === articulation;
            return (
              <button
                key={art}
                onClick={() => setArticulation(art)}
                className="text-[7px] font-black uppercase tracking-wider rounded px-2 py-1"
                style={{
                  background: active ? '#252428' : '#131315',
                  border: `1px solid ${active ? meta.color : '#353437'}`,
                  color: active ? meta.color : '#7090b0',
                  cursor: 'pointer',
                  boxShadow: active ? `0 0 6px ${meta.color}44` : 'none',
                }}
              >
                {art}
              </button>
            );
          })}
        </div>

        {/* Instrument cards */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
          {sectionInstruments.map((inst, idx) => {
            const isSoloed = hasSolo && !inst.solo;
            return (
              <div
                key={inst.name}
                className="rounded-xl p-2"
                style={{
                  background: '#1c1b1e',
                  border: `1px solid ${inst.solo ? meta.color : '#252428'}`,
                  opacity: isSoloed ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                  boxShadow: inst.solo ? `0 0 8px ${meta.color}44` : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider flex-1" style={{ color: meta.color }}>
                    {inst.name}
                  </span>
                  <button
                    onClick={() => toggleMute(activeSection, idx)}
                    className="text-[7px] font-black uppercase rounded px-1 py-0.5"
                    style={{
                      background: inst.muted ? '#ff3333' : '#252428',
                      border: `1px solid ${inst.muted ? '#ff3333' : '#353437'}`,
                      color: inst.muted ? '#fff' : '#7090b0',
                      cursor: 'pointer',
                    }}
                  >M</button>
                  <button
                    onClick={() => toggleSolo(activeSection, idx)}
                    className="text-[7px] font-black uppercase rounded px-1 py-0.5"
                    style={{
                      background: inst.solo ? meta.color : '#252428',
                      border: `1px solid ${inst.solo ? meta.color : '#353437'}`,
                      color: inst.solo ? '#000' : '#7090b0',
                      cursor: 'pointer',
                    }}
                  >S</button>
                </div>

                {/* Dynamics */}
                <div className="flex gap-1 items-center mb-1">
                  <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: '#7090b0' }}>DYN:</span>
                  {DYNAMICS_LIST.map(dyn => {
                    const active = inst.dynamics === dyn;
                    return (
                      <button
                        key={dyn}
                        onClick={() => updateInstrument(activeSection, idx, { dynamics: dyn })}
                        className="text-[6px] font-black rounded"
                        style={{
                          width: 18, height: 14,
                          background: active ? meta.color : '#131315',
                          border: `1px solid ${active ? meta.color : '#353437'}`,
                          color: active ? '#000' : '#7090b0',
                          cursor: 'pointer',
                        }}
                      >{dyn}</button>
                    );
                  })}
                </div>

                {/* Volume fader */}
                <div className="flex items-center gap-2">
                  <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: '#7090b0' }}>VOL</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={inst.volume}
                    onChange={e => updateInstrument(activeSection, idx, { volume: Number(e.target.value) })}
                    className="flex-1 h-1 rounded-full appearance-none"
                    style={{ accentColor: meta.color }}
                  />
                  <span className="text-[7px] font-black w-6 text-right" style={{ color: meta.color }}>
                    {inst.volume}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-44 shrink-0 flex flex-col gap-2" style={{ background: '#1c1b1e', borderRadius: 12, padding: 10 }}>
        <div className="text-[8px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
          SECTION INFO
        </div>

        {/* Stats */}
        <div className="rounded-lg p-2" style={{ background: '#131315', border: '1px solid #252428' }}>
          <div className="text-[7px] font-black uppercase tracking-wider mb-1" style={{ color: '#7090b0' }}>ACTIVE</div>
          <div className="text-[14px] font-black" style={{ color: meta.color }}>{activeCount}</div>
          <div className="text-[6px] font-black uppercase tracking-wider mt-1" style={{ color: '#7090b0' }}>ARTICULATION</div>
          <div className="text-[8px] font-black uppercase" style={{ color: '#e0e0e0' }}>{articulation}</div>
        </div>

        {/* Per-instrument dynamics summary */}
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {sectionInstruments.map(inst => (
            <div key={inst.name} className="flex items-center justify-between gap-1">
              <span className="text-[6px] font-black uppercase truncate" style={{ color: '#7090b0', maxWidth: 80 }}>
                {inst.name}
              </span>
              <span
                className="text-[7px] font-black uppercase rounded px-1"
                style={{
                  background: inst.muted ? '#252428' : `${meta.color}22`,
                  color: inst.muted ? '#353437' : meta.color,
                  border: `1px solid ${inst.muted ? '#353437' : `${meta.color}55`}`,
                }}
              >
                {inst.muted ? 'MUT' : inst.dynamics.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={() => alert('Ostinato pattern generated')}
          className="w-full rounded-lg py-2 text-[8px] font-black uppercase tracking-wider"
          style={{
            background: `${meta.color}22`,
            border: `1.5px solid ${meta.color}`,
            color: meta.color,
            cursor: 'pointer',
            boxShadow: `0 0 8px ${meta.color}33`,
          }}
        >
          GENERATE OSTINATO
        </button>

        <button
          onClick={previewSection}
          className="w-full rounded-lg py-2 text-[8px] font-black uppercase tracking-wider"
          style={{
            background: '#252428',
            border: '1.5px solid #353437',
            color: '#76d6d5',
            cursor: 'pointer',
          }}
        >
          PREVIEW SECTION
        </button>
      </div>
    </div>
  );
}

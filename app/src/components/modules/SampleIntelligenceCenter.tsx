'use client';
import { useState, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';

interface DetectedInfo {
  bpm: number | null;
  key: string | null;
  chord: string | null;
  stems: string[];
}

interface OutputBlock {
  id: string;
  label: string;
  type: 'midi' | 'stem' | 'chord';
  color: string;
}

type ZoneType = 'midi' | 'audio' | 'vocal';

interface DroppedFile {
  name: string;
  zone: ZoneType;
}

const STEM_TYPES = ['DRUMS', 'BASS', 'MELODY', 'VOCALS', 'OTHER'];

const ZONE_CONFIG: Record<ZoneType, { label: string; icon: string; color: string; accept: string }> = {
  midi:  { label: 'MIDI DROP ZONE',  icon: '♫', color: '#bf00ff', accept: '.mid,.midi' },
  audio: { label: 'AUDIO DROP ZONE', icon: '◉', color: '#76d6d5', accept: '.wav,.mp3,.aiff,.flac' },
  vocal: { label: 'VOCAL DROP ZONE', icon: '⊕', color: '#ff6b9d', accept: '.wav,.mp3,.aiff' },
};

export function SampleIntelligenceCenter() {
  const { setBpm, setKey } = useProjectStore();
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [draggingOver, setDraggingOver] = useState<ZoneType | null>(null);
  const [detected, setDetected] = useState<DetectedInfo>({ bpm: null, key: null, chord: null, stems: [] });
  const [analyzing, setAnalyzing] = useState(false);
  const [outputs, setOutputs] = useState<OutputBlock[]>([]);
  const [actionFeedback, setActionFeedback] = useState<Record<string, boolean>>({});
  const fileRefs = useRef<Record<ZoneType, HTMLInputElement | null>>({ midi: null, audio: null, vocal: null });

  const handleDrop = (zone: ZoneType, e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(null);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    setDroppedFiles(prev => [...prev, ...files.map(f => ({ name: f.name, zone }))]);
  };

  const handleFileInput = (zone: ZoneType, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setDroppedFiles(prev => [...prev, ...files.map(f => ({ name: f.name, zone }))]);
  };

  const analyze = () => {
    if (!droppedFiles.length) return;
    setAnalyzing(true);
    setTimeout(() => {
      const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const chords = ['Cm', 'Dm7b5', 'Ebmaj7', 'Fm', 'Gm', 'Abmaj7', 'Bb7'];
      setDetected({
        bpm: Math.floor(Math.random() * 60 + 80),
        key: keys[Math.floor(Math.random() * keys.length)],
        chord: chords[Math.floor(Math.random() * chords.length)],
        stems: STEM_TYPES,
      });
      setOutputs([
        { id: 'midi-out', label: 'EXTRACTED MIDI', type: 'midi', color: '#bf00ff' },
        { id: 'chord-out', label: 'CHORD PROGRESSION', type: 'chord', color: '#e9c349' },
        ...STEM_TYPES.map(s => ({ id: `stem-${s}`, label: `${s} STEM`, type: 'stem' as const, color: '#76d6d5' })),
      ]);
      setAnalyzing(false);
    }, 1800);
  };

  const flashAction = (label: string) => {
    setActionFeedback(prev => ({ ...prev, [label]: true }));
    setTimeout(() => setActionFeedback(prev => ({ ...prev, [label]: false })), 2000);
  };

  const warpToProject = () => {
    if (!detected.bpm || !detected.key) return;
    setBpm(detected.bpm);
    setKey(detected.key);
    flashAction('WARP TO PROJECT');
  };

  const clearAll = () => {
    setDroppedFiles([]);
    setDetected({ bpm: null, key: null, chord: null, stems: [] });
    setOutputs([]);
  };

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden">
      {/* Left: Drop zones + analyze */}
      <div className="flex flex-col gap-3 w-72 shrink-0">
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold shrink-0">SAMPLE INTELLIGENCE CENTER</div>

        {(Object.entries(ZONE_CONFIG) as [ZoneType, typeof ZONE_CONFIG[ZoneType]][]).map(([zone, cfg]) => (
          <div key={zone}
            className="rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 transition-all cursor-pointer relative"
            style={{ borderColor: draggingOver === zone ? cfg.color : '#353437', background: draggingOver === zone ? `${cfg.color}11` : '#1c1b1e', minHeight: 80 }}
            onDragOver={e => { e.preventDefault(); setDraggingOver(zone); }}
            onDragLeave={() => setDraggingOver(null)}
            onDrop={e => handleDrop(zone, e)}
            onClick={() => fileRefs.current[zone]?.click()}>
            <input ref={el => { fileRefs.current[zone] = el; }} type="file" accept={cfg.accept} multiple className="hidden"
              onChange={e => handleFileInput(zone, e)} />
            <span className="text-xl" style={{ color: cfg.color }}>{cfg.icon}</span>
            <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</div>
            <div className="text-[7px] text-white/25">drag & drop or click to browse</div>
            {droppedFiles.filter(f => f.zone === zone).map(f => (
              <div key={f.name} className="text-[7px] font-mono truncate w-full text-center" style={{ color: cfg.color }}>
                {f.name}
              </div>
            ))}
          </div>
        ))}

        <div className="flex gap-2 shrink-0">
          <button onClick={analyze} disabled={!droppedFiles.length || analyzing}
            className="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all"
            style={{ background: droppedFiles.length ? '#76d6d522' : '#1c1b1e', border: `1px solid ${droppedFiles.length ? '#76d6d5' : '#353437'}`, color: droppedFiles.length ? '#76d6d5' : '#ffffff22', boxShadow: droppedFiles.length ? '0 0 12px #76d6d544' : 'none' }}>
            {analyzing ? 'ANALYZING…' : '⊛ ANALYZE'}
          </button>
          <button onClick={clearAll}
            className="px-3 py-2.5 rounded-xl text-[9px] font-bold uppercase cursor-pointer transition-all"
            style={{ background: '#252428', border: '1px solid #353437', color: '#ffffff44' }}>
            CLR
          </button>
        </div>
      </div>

      {/* Center: Detected info */}
      <div className="flex flex-col gap-3 flex-1 overflow-hidden">
        <div className="bg-surface-low rounded-xl p-4 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">DETECTION RESULTS</div>
          {detected.bpm ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-[8px] uppercase text-white/30 mb-1">BPM</div>
                <div className="text-2xl font-black" style={{ color: '#e9c349' }}>{detected.bpm}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] uppercase text-white/30 mb-1">KEY</div>
                <div className="text-2xl font-black" style={{ color: '#76d6d5' }}>{detected.key}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] uppercase text-white/30 mb-1">CHORD</div>
                <div className="text-2xl font-black" style={{ color: '#bf00ff' }}>{detected.chord}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-white/20 text-[9px]">
              {analyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-t-teal border-white/10 animate-spin" />
                  <span>ANALYZING SAMPLE…</span>
                </div>
              ) : 'DROP FILES AND CLICK ANALYZE'}
            </div>
          )}
        </div>

        {/* Stem separation */}
        {detected.stems.length > 0 && (
          <div className="bg-surface-low rounded-xl p-4 shrink-0">
            <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">STEM SEPARATION</div>
            <div className="flex gap-2">
              {detected.stems.map(s => (
                <div key={s} className="flex-1 rounded-lg p-2 text-center"
                  style={{ background: '#76d6d511', border: '1px solid #76d6d533' }}>
                  <div className="text-[8px] font-bold" style={{ color: '#76d6d5' }}>{s}</div>
                  <div className="h-8 mt-1 flex items-end justify-center gap-px">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="w-1 rounded-t-sm" style={{
                        height: `${Math.random() * 80 + 20}%`,
                        background: '#76d6d5',
                        opacity: 0.6,
                      }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output blocks */}
        {outputs.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">OUTPUTS — DRAG TO PROJECT</div>
            <div className="grid grid-cols-2 gap-2">
              {outputs.map(o => (
                <div key={o.id} draggable
                  className="rounded-xl p-3 flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all"
                  style={{ background: `${o.color}11`, border: `1px solid ${o.color}44` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${o.color}22`, border: `1px solid ${o.color}55` }}>
                    <span className="text-xs" style={{ color: o.color }}>
                      {o.type === 'midi' ? '♫' : o.type === 'chord' ? '⧖' : '◎'}
                    </span>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold uppercase" style={{ color: o.color }}>{o.label}</div>
                    <div className="text-[7px] text-white/30">drag to module</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="w-44 shrink-0 flex flex-col gap-2">
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">ACTIONS</div>
        {[
          { label: 'EXTRACT MIDI',    color: '#bf00ff', disabled: !detected.bpm, action: () => flashAction('EXTRACT MIDI') },
          { label: 'DETECT CHORDS',   color: '#e9c349', disabled: !detected.bpm, action: () => flashAction('DETECT CHORDS') },
          { label: 'SEPARATE STEMS',  color: '#76d6d5', disabled: !detected.bpm, action: () => flashAction('SEPARATE STEMS') },
          { label: 'WARP TO PROJECT', color: '#39ff14', disabled: !detected.bpm, action: warpToProject },
          { label: 'KEY MATCH',       color: '#ff6b9d', disabled: !detected.bpm, action: () => { setKey(detected.key!); flashAction('KEY MATCH'); } },
        ].map(a => {
          const done = actionFeedback[a.label];
          return (
            <button key={a.label} disabled={a.disabled} onClick={() => !a.disabled && a.action()}
              className="w-full px-3 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all text-left"
              style={{ background: done ? '#39ff1411' : a.disabled ? '#1c1b1e' : `${a.color}11`, border: `1px solid ${done ? '#39ff14' : a.disabled ? '#353437' : `${a.color}44`}`, color: done ? '#39ff14' : a.disabled ? '#ffffff22' : a.color }}>
              {done ? `✓ ${a.label}` : a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

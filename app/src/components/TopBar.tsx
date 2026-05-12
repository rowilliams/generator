'use client';
import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { startAudioContext, NOTES } from '@/lib/audio';

export function TopBar() {
  const { bpm, key, scale, vibe, loopBars, setBpm, setKey, setLoopBars } = useProjectStore();
  const [playing, setPlaying] = useState(false);

  const handlePlay = async () => {
    await startAudioContext();
    setPlaying(p => !p);
  };

  return (
    <div className="h-12 flex items-center gap-4 px-4 border-b border-white/5 bg-void/80 backdrop-blur-sm shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#bf00ff', textShadow: '0 0 10px #bf00ffaa' }}>
          NEON OBSIDIAN
        </span>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handlePlay}
          className="w-8 h-8 rounded flex items-center justify-center text-sm transition-all cursor-pointer"
          style={{
            background: playing ? '#bf00ff22' : '#252428',
            border: `1px solid ${playing ? '#bf00ff' : '#353437'}`,
            color: playing ? '#bf00ff' : '#ffffff88',
            boxShadow: playing ? '0 0 10px #bf00ff66' : 'none',
          }}
        >
          {playing ? '■' : '▶'}
        </button>
      </div>

      {/* BPM */}
      <div className="flex items-center gap-2 bg-surface-low rounded px-3 py-1.5">
        <span className="text-[9px] text-white/40 uppercase tracking-wider">BPM</span>
        <input
          type="number"
          value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="w-14 bg-transparent text-center font-mono text-sm font-bold text-gold outline-none"
          min={40} max={220}
        />
      </div>

      {/* Key */}
      <div className="flex items-center gap-2 bg-surface-low rounded px-3 py-1.5">
        <span className="text-[9px] text-white/40 uppercase tracking-wider">KEY</span>
        <select
          value={key}
          onChange={e => setKey(e.target.value)}
          className="bg-transparent text-sm font-bold text-teal outline-none cursor-pointer"
        >
          {NOTES.map(k => <option key={k} value={k} className="bg-surface-low">{k}</option>)}
        </select>
      </div>

      {/* Scale */}
      <div className="flex items-center gap-2 bg-surface-low rounded px-2 py-1.5">
        <span className="text-[9px] text-white/40 uppercase tracking-wider">SCALE</span>
        <span className="text-[10px] text-white/70 uppercase">{scale.replace(/_/g, ' ')}</span>
      </div>

      {/* Loop bars */}
      <div className="flex items-center gap-1 bg-surface-low rounded px-2 py-1.5">
        <span className="text-[9px] text-white/40 uppercase tracking-wider mr-1">LOOP</span>
        {([4, 8, 16] as const).map(b => (
          <button key={b} onClick={() => setLoopBars(b)}
            className="px-2 py-0.5 rounded text-[9px] font-black cursor-pointer transition-all"
            style={{ background: loopBars === b ? '#e9c34922' : 'transparent', border: `1px solid ${loopBars === b ? '#e9c349' : 'transparent'}`, color: loopBars === b ? '#e9c349' : '#ffffff44' }}>
            {b}
          </button>
        ))}
        <span className="text-[9px] text-white/40 uppercase tracking-wider">BAR</span>
      </div>

      {/* Vibe */}
      <div
        className="flex items-center gap-2 rounded px-2 py-1 ml-auto"
        style={{ background: '#bf00ff22', border: '1px solid #bf00ff44' }}
      >
        <span className="text-[9px] text-white/40 uppercase tracking-wider">VIBE</span>
        <span className="text-[10px] text-purple font-bold uppercase">{vibe.replace(/_/g, ' ')}</span>
      </div>
    </div>
  );
}

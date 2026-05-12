'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Knob } from '@/components/ui/Knob';
import { loadTone, NOTES, getScaleNotes } from '@/lib/audio';

type Waveform = 'sine' | 'sawtooth' | 'square' | 'triangle';
type FilterType = 'lowpass' | 'highpass' | 'bandpass';
type LfoTarget = 'pitch' | 'filter' | 'amp';
type ArpMode = 'off' | 'up' | 'down' | 'up_down' | 'random';

interface SynthPreset {
  name: string;
  color: string;
  osc1: Waveform;
  osc2: Waveform;
  detune: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  cutoff: number;
  resonance: number;
  filterEnv: number;
  reverbWet: number;
  delayWet: number;
}

const PRESETS: SynthPreset[] = [
  { name: 'DARK PAD',     color: '#bf00ff', osc1: 'sawtooth', osc2: 'sine',     detune: 8,  attack: 80, decay: 50, sustain: 70, release: 80, cutoff: 30, resonance: 20, filterEnv: 40, reverbWet: 70, delayWet: 20 },
  { name: 'TRAP LEAD',    color: '#ff3333', osc1: 'square',   osc2: 'sawtooth', detune: 4,  attack: 0,  decay: 40, sustain: 60, release: 30, cutoff: 70, resonance: 50, filterEnv: 60, reverbWet: 20, delayWet: 10 },
  { name: 'SUB BASS',     color: '#7a00a6', osc1: 'sine',     osc2: 'sine',     detune: 0,  attack: 5,  decay: 30, sustain: 80, release: 20, cutoff: 20, resonance: 10, filterEnv: 20, reverbWet: 10, delayWet: 0  },
  { name: 'PLUCK',        color: '#e9c349', osc1: 'sawtooth', osc2: 'square',   detune: 2,  attack: 0,  decay: 25, sustain: 0,  release: 40, cutoff: 80, resonance: 60, filterEnv: 80, reverbWet: 30, delayWet: 40 },
  { name: 'ACID',         color: '#39ff14', osc1: 'sawtooth', osc2: 'sawtooth', detune: 0,  attack: 5,  decay: 20, sustain: 40, release: 15, cutoff: 50, resonance: 90, filterEnv: 90, reverbWet: 15, delayWet: 20 },
  { name: 'STRINGS',      color: '#76d6d5', osc1: 'sawtooth', osc2: 'sawtooth', detune: 15, attack: 60, decay: 40, sustain: 80, release: 70, cutoff: 55, resonance: 15, filterEnv: 30, reverbWet: 80, delayWet: 30 },
  { name: 'HORROR BELL',  color: '#ff3333', osc1: 'sine',     osc2: 'triangle', detune: 7,  attack: 10, decay: 80, sustain: 20, release: 90, cutoff: 60, resonance: 40, filterEnv: 50, reverbWet: 90, delayWet: 50 },
  { name: 'SUPER SAW',    color: '#ff6b1a', osc1: 'sawtooth', osc2: 'sawtooth', detune: 20, attack: 10, decay: 30, sustain: 75, release: 50, cutoff: 65, resonance: 25, filterEnv: 35, reverbWet: 40, delayWet: 25 },
];

const WAVEFORMS: { id: Waveform; icon: string }[] = [
  { id: 'sine',     icon: '∿' },
  { id: 'sawtooth', icon: '⟋' },
  { id: 'square',   icon: '⊓' },
  { id: 'triangle', icon: '∧' },
];

const KEYS_LAYOUT = [
  { note: 'C', black: false }, { note: 'C#', black: true }, { note: 'D', black: false },
  { note: 'D#', black: true }, { note: 'E', black: false }, { note: 'F', black: false },
  { note: 'F#', black: true }, { note: 'G', black: false }, { note: 'G#', black: true },
  { note: 'A', black: false }, { note: 'A#', black: true }, { note: 'B', black: false },
];

export function SynthEngine() {
  const { bpm, key, scale } = useProjectStore();
  const [preset, setPreset] = useState<SynthPreset>(PRESETS[0]);
  const [osc1Wave, setOsc1Wave] = useState<Waveform>(PRESETS[0].osc1);
  const [osc2Wave, setOsc2Wave] = useState<Waveform>(PRESETS[0].osc2);
  const [detune, setDetune] = useState(PRESETS[0].detune);
  const [attack, setAttack] = useState(PRESETS[0].attack);
  const [decay, setDecay] = useState(PRESETS[0].decay);
  const [sustain, setSustain] = useState(PRESETS[0].sustain);
  const [release, setRelease] = useState(PRESETS[0].release);
  const [cutoff, setCutoff] = useState(PRESETS[0].cutoff);
  const [resonance, setResonance] = useState(PRESETS[0].resonance);
  const [filterEnv, setFilterEnv] = useState(PRESETS[0].filterEnv);
  const [filterType, setFilterType] = useState<FilterType>('lowpass');
  const [reverbWet, setReverbWet] = useState(PRESETS[0].reverbWet);
  const [delayWet, setDelayWet] = useState(PRESETS[0].delayWet);
  const [lfoRate, setLfoRate] = useState(30);
  const [lfoDepth, setLfoDepth] = useState(20);
  const [lfoTarget, setLfoTarget] = useState<LfoTarget>('filter');
  const [arpMode, setArpMode] = useState<ArpMode>('off');
  const [octave, setOctave] = useState(4);
  const [heldNote, setHeldNote] = useState<string | null>(null);

  const applyPreset = (p: SynthPreset) => {
    setPreset(p);
    setOsc1Wave(p.osc1); setOsc2Wave(p.osc2); setDetune(p.detune);
    setAttack(p.attack); setDecay(p.decay); setSustain(p.sustain); setRelease(p.release);
    setCutoff(p.cutoff); setResonance(p.resonance); setFilterEnv(p.filterEnv);
    setReverbWet(p.reverbWet); setDelayWet(p.delayWet);
  };

  const playKey = useCallback(async (note: string) => {
    const T = await loadTone();
    if (!T) return;
    await T.start();
    const pitch = `${note}${octave}`;
    setHeldNote(pitch);

    const env = { attack: attack / 200, decay: decay / 200, sustain: sustain / 100, release: release / 150 };
    const rev = new T.Reverb({ decay: 2.0, wet: reverbWet / 100 }).toDestination();
    const del = new T.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: delayWet / 100 }).connect(rev);
    const filt = new T.Filter({
      type: filterType as BiquadFilterType,
      frequency: 200 + (cutoff / 100) * 15000,
      Q: 1 + (resonance / 100) * 20,
    }).connect(del);

    const osc1 = new T.PolySynth(T.Synth, { oscillator: { type: osc1Wave }, envelope: env, volume: -8 }).connect(filt);
    const osc2 = new T.PolySynth(T.Synth, { oscillator: { type: osc2Wave }, envelope: env, volume: -14 }).connect(filt);
    if (detune > 0) osc2.set({ detune: detune * 10 });

    const arpMs = (60 / bpm / 4) * 1000;
    if (arpMode !== 'off') {
      const raw = getScaleNotes(key, scale, octave);
      let seq: string[];
      if (arpMode === 'up') seq = raw;
      else if (arpMode === 'down') seq = [...raw].reverse();
      else if (arpMode === 'up_down') seq = [...raw, ...[...raw].reverse().slice(1)];
      else seq = [...raw].sort(() => Math.random() - 0.5);
      seq.forEach((n, i) => setTimeout(() => {
        if (!osc1.disposed) osc1.triggerAttackRelease(n, '16n');
        if (!osc2.disposed) osc2.triggerAttackRelease(n, '16n');
      }, i * arpMs));
      setTimeout(() => {
        [osc1, osc2, filt, del, rev].forEach(n => { try { n.dispose(); } catch {} });
        setHeldNote(null);
      }, seq.length * arpMs + 500);
    } else {
      osc1.triggerAttackRelease(pitch, '4n');
      osc2.triggerAttackRelease(pitch, '4n');
      const disposeMs = Math.max(2000, (release / 150) * 1000 + 1000);
      setTimeout(() => {
        [osc1, osc2, filt, del, rev].forEach(n => { try { n.dispose(); } catch {} });
        setHeldNote(null);
      }, disposeMs);
    }
  }, [osc1Wave, osc2Wave, detune, attack, decay, sustain, release, cutoff, resonance, filterType, reverbWet, delayWet, octave, arpMode, bpm, key, scale]);

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden">
      {/* Left: preset browser */}
      <div className="w-40 shrink-0 flex flex-col gap-2">
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">PRESETS</div>
        {PRESETS.map(p => (
          <button key={p.name} onClick={() => applyPreset(p)}
            className="w-full px-2 py-2 rounded-lg text-left cursor-pointer transition-all"
            style={{ background: preset.name === p.name ? `${p.color}22` : '#1c1b1e', border: `1px solid ${preset.name === p.name ? p.color : '#353437'}`, boxShadow: preset.name === p.name ? `0 0 8px ${p.color}44` : 'none' }}>
            <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: p.color }}>{p.name}</div>
          </button>
        ))}
      </div>

      {/* Center: synth controls */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-w-0">
        {/* Oscillators */}
        <div className="bg-surface-low rounded-xl p-3 shrink-0">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-3" style={{ color: preset.color }}>OSCILLATORS</div>
          <div className="flex gap-4">
            {[{ label: 'OSC 1', wave: osc1Wave, set: setOsc1Wave }, { label: 'OSC 2', wave: osc2Wave, set: setOsc2Wave }].map(osc => (
              <div key={osc.label} className="flex-1">
                <div className="text-[8px] uppercase text-white/30 mb-2">{osc.label}</div>
                <div className="flex gap-1">
                  {WAVEFORMS.map(w => (
                    <button key={w.id} onClick={() => osc.set(w.id)}
                      className="flex-1 py-1.5 rounded text-sm cursor-pointer transition-all"
                      style={{ background: osc.wave === w.id ? `${preset.color}33` : '#252428', border: `1px solid ${osc.wave === w.id ? preset.color : '#353437'}`, color: osc.wave === w.id ? preset.color : '#ffffff44' }}>
                      {w.icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1">
              <div className="text-[8px] uppercase text-white/30">OCT</div>
              <div className="flex gap-1">
                {[3, 4, 5].map(o => (
                  <button key={o} onClick={() => setOctave(o)}
                    className="w-7 h-7 rounded text-[9px] font-bold cursor-pointer transition-all"
                    style={{ background: octave === o ? `${preset.color}33` : '#252428', border: `1px solid ${octave === o ? preset.color : '#353437'}`, color: octave === o ? preset.color : '#ffffff44' }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <Knob value={detune} min={0} max={50} label="DETUNE" color={preset.color} onChange={setDetune} size={42} />
          </div>
        </div>

        {/* Envelope */}
        <div className="bg-surface-low rounded-xl p-3 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">ENVELOPE</div>
          <div className="flex gap-4 items-center">
            <Knob value={attack}  min={0} max={100} label="ATTACK"  color="#76d6d5"  onChange={setAttack}  size={42} />
            <Knob value={decay}   min={0} max={100} label="DECAY"   color="#e9c349"  onChange={setDecay}   size={42} />
            <Knob value={sustain} min={0} max={100} label="SUSTAIN" color={preset.color} onChange={setSustain} size={42} />
            <Knob value={release} min={0} max={100} label="RELEASE" color="#ff6b9d"  onChange={setRelease} size={42} />
            {/* ADSR visualiser */}
            <div className="flex-1 h-10 relative">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <polyline
                  points={`0,40 ${attack * 0.15},0 ${attack * 0.15 + decay * 0.15},${(1 - sustain / 100) * 40} ${70},${(1 - sustain / 100) * 40} ${100},40`}
                  fill="none" stroke={preset.color} strokeWidth="1.5" opacity="0.7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-surface-low rounded-xl p-3 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">FILTER</div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-1">
              {(['lowpass', 'highpass', 'bandpass'] as FilterType[]).map(ft => (
                <button key={ft} onClick={() => setFilterType(ft)}
                  className="px-2 py-1 rounded text-[8px] font-bold uppercase cursor-pointer transition-all"
                  style={{ background: filterType === ft ? '#76d6d522' : '#252428', border: `1px solid ${filterType === ft ? '#76d6d5' : '#353437'}`, color: filterType === ft ? '#76d6d5' : '#ffffff44' }}>
                  {ft.replace('pass', '')}
                </button>
              ))}
            </div>
            <Knob value={cutoff}    min={0} max={100} label="CUTOFF"   color="#76d6d5"  onChange={setCutoff}    size={42} />
            <Knob value={resonance} min={0} max={100} label="RESONANCE" color="#ff6b9d" onChange={setResonance} size={42} />
            <Knob value={filterEnv} min={0} max={100} label="ENV AMT"  color="#e9c349"  onChange={setFilterEnv} size={42} />
          </div>
        </div>

        {/* LFO */}
        <div className="bg-surface-low rounded-xl p-3 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">LFO</div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-1">
              {(['pitch', 'filter', 'amp'] as LfoTarget[]).map(t => (
                <button key={t} onClick={() => setLfoTarget(t)}
                  className="px-2 py-1 rounded text-[8px] font-bold uppercase cursor-pointer transition-all"
                  style={{ background: lfoTarget === t ? '#bf00ff22' : '#252428', border: `1px solid ${lfoTarget === t ? '#bf00ff' : '#353437'}`, color: lfoTarget === t ? '#bf00ff' : '#ffffff44' }}>
                  {t}
                </button>
              ))}
            </div>
            <Knob value={lfoRate}  min={0} max={100} label="RATE"  color="#bf00ff" onChange={setLfoRate}  size={42} />
            <Knob value={lfoDepth} min={0} max={100} label="DEPTH" color="#bf00ff" onChange={setLfoDepth} size={42} />
          </div>
        </div>

        {/* Effects */}
        <div className="bg-surface-low rounded-xl p-3 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">EFFECTS</div>
          <div className="flex gap-4 items-center">
            <Knob value={reverbWet} min={0} max={100} label="REVERB" color="#76d6d5" onChange={setReverbWet} size={42} />
            <Knob value={delayWet}  min={0} max={100} label="DELAY"  color="#e9c349" onChange={setDelayWet}  size={42} />
            <div className="flex-1">
              <div className="text-[8px] uppercase text-white/30 mb-2">ARPEGGIATOR</div>
              <div className="flex gap-1 flex-wrap">
                {(['off', 'up', 'down', 'up_down', 'random'] as ArpMode[]).map(m => (
                  <button key={m} onClick={() => setArpMode(m)}
                    className="px-2 py-1 rounded text-[7px] font-bold uppercase cursor-pointer transition-all"
                    style={{ background: arpMode === m ? `${preset.color}22` : '#252428', border: `1px solid ${arpMode === m ? preset.color : '#353437'}`, color: arpMode === m ? preset.color : '#ffffff44' }}>
                    {m.replace('_', '-')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: keyboard */}
      <div className="w-52 shrink-0 flex flex-col gap-3">
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">KEYBOARD</div>
        <div className="bg-surface-low rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Mini keyboard */}
          <div className="relative h-24 select-none">
            {/* White keys */}
            <div className="flex h-full gap-px">
              {KEYS_LAYOUT.filter(k => !k.black).map((k, i) => {
                const pitch = `${k.note}${octave}`;
                const isHeld = heldNote === pitch;
                return (
                  <button key={k.note}
                    onMouseDown={() => playKey(k.note)}
                    className="flex-1 rounded-b-sm cursor-pointer transition-all border-b-2 relative flex items-end justify-center pb-1"
                    style={{ background: isHeld ? preset.color : '#e8e8e0', borderColor: isHeld ? preset.color : '#aaa' }}>
                    <span className="text-[7px] font-bold" style={{ color: isHeld ? '#fff' : '#666' }}>{k.note}</span>
                  </button>
                );
              })}
            </div>
            {/* Black keys overlay */}
            <div className="absolute top-0 left-0 w-full h-3/5 flex pointer-events-none" style={{ paddingLeft: '7.14%' }}>
              {KEYS_LAYOUT.map((k, i) => {
                if (!k.black) return null;
                const pitch = `${k.note}${octave}`;
                const isHeld = heldNote === pitch;
                const positions: Record<string, string> = {
                  'C#': '7%', 'D#': '21%', 'F#': '50%', 'G#': '64%', 'A#': '78%'
                };
                return (
                  <button key={k.note}
                    onMouseDown={(e) => { e.stopPropagation(); playKey(k.note); }}
                    className="absolute pointer-events-auto cursor-pointer rounded-b-sm z-10"
                    style={{ left: positions[k.note], width: '8%', height: '100%', background: isHeld ? preset.color : '#1a1a1a', border: `1px solid ${isHeld ? preset.color : '#333'}` }} />
                );
              })}
            </div>
          </div>

          <div className="text-[7px] uppercase text-white/20 text-center tracking-wider">{preset.name} · OCT {octave}</div>

          <div className="flex flex-col gap-2 mt-auto">
            <div className="text-[8px] uppercase text-white/30 font-bold">PATCH INFO</div>
            <div className="flex flex-col gap-1 text-[8px]">
              {[
                { label: 'OSC', value: `${osc1Wave} + ${osc2Wave}` },
                { label: 'FILTER', value: `${filterType} ${cutoff}%` },
                { label: 'REVERB', value: `${reverbWet}%` },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-white/30">{row.label}</span>
                  <span className="font-bold" style={{ color: preset.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

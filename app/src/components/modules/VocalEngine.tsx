'use client';
import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Knob } from '@/components/ui/Knob';
import { NOTES } from '@/lib/audio';

type VocalStyle = 'auto_tune' | 'natural' | 'robotic' | 'choir' | 'falsetto' | 'rap';
type HarmonyInterval = 'unison' | 'minor3' | 'major3' | 'perfect5' | 'octave' | 'custom';
type Effect = 'reverb' | 'delay' | 'chorus' | 'distortion' | 'vocoder' | 'bitcrush';

interface VocalPreset {
  name: string;
  color: string;
  style: VocalStyle;
  pitchCorrect: number;
  formant: number;
  breathiness: number;
}

const VOCAL_PRESETS: VocalPreset[] = [
  { name: 'AUTO-TUNE HARD',  color: '#bf00ff', style: 'auto_tune', pitchCorrect: 100, formant: 0,   breathiness: 0  },
  { name: 'NATURAL',         color: '#76d6d5', style: 'natural',   pitchCorrect: 20,  formant: 0,   breathiness: 30 },
  { name: 'ROBOTIC',         color: '#7090b0', style: 'robotic',   pitchCorrect: 100, formant: -20, breathiness: 0  },
  { name: 'CHOIR',           color: '#e9c349', style: 'choir',     pitchCorrect: 60,  formant: 10,  breathiness: 40 },
  { name: 'DARK FALSETTO',   color: '#8b0000', style: 'falsetto',  pitchCorrect: 40,  formant: 25,  breathiness: 50 },
  { name: 'RAP DRY',         color: '#ff6b1a', style: 'rap',       pitchCorrect: 15,  formant: -5,  breathiness: 5  },
];

const HARMONY_INTERVALS: { id: HarmonyInterval; label: string; semitones: number }[] = [
  { id: 'unison',   label: 'UNISON',  semitones: 0  },
  { id: 'minor3',   label: 'min 3rd', semitones: 3  },
  { id: 'major3',   label: 'maj 3rd', semitones: 4  },
  { id: 'perfect5', label: 'P5th',    semitones: 7  },
  { id: 'octave',   label: 'OCT',     semitones: 12 },
];

const EFFECTS: { id: Effect; label: string; color: string }[] = [
  { id: 'reverb',     label: 'REVERB',     color: '#76d6d5' },
  { id: 'delay',      label: 'DELAY',      color: '#e9c349' },
  { id: 'chorus',     label: 'CHORUS',     color: '#bf00ff' },
  { id: 'distortion', label: 'DISTORTION', color: '#ff3333' },
  { id: 'vocoder',    label: 'VOCODER',    color: '#39ff14' },
  { id: 'bitcrush',   label: 'BITCRUSH',   color: '#ff6b9d' },
];

export function VocalEngine() {
  const { key, scale } = useProjectStore();
  const [preset, setPreset] = useState<VocalPreset>(VOCAL_PRESETS[0]);
  const [pitchCorrect, setPitchCorrect] = useState(100);
  const [formant, setFormant] = useState(0);
  const [breathiness, setBreathiness] = useState(0);
  const [gender, setGender] = useState(50);
  const [vibrato, setVibrato] = useState(20);
  const [harmonies, setHarmonies] = useState<Set<HarmonyInterval>>(new Set(['perfect5']));
  const [harmonyVol, setHarmonyVol] = useState(60);
  const [activeEffects, setActiveEffects] = useState<Set<Effect>>(new Set(['reverb']));
  const [effectValues, setEffectValues] = useState<Record<Effect, number>>({
    reverb: 40, delay: 25, chorus: 30, distortion: 20, vocoder: 50, bitcrush: 30,
  });
  const [rootNote, setRootNote] = useState(key);

  const applyPreset = (p: VocalPreset) => {
    setPreset(p);
    setPitchCorrect(p.pitchCorrect);
    setFormant(p.formant);
    setBreathiness(p.breathiness);
  };

  const toggleHarmony = (h: HarmonyInterval) => setHarmonies(prev => {
    const next = new Set(prev);
    next.has(h) ? next.delete(h) : next.add(h);
    return next;
  });

  const toggleEffect = (e: Effect) => setActiveEffects(prev => {
    const next = new Set(prev);
    next.has(e) ? next.delete(e) : next.add(e);
    return next;
  });

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden">
      {/* Left: presets */}
      <div className="w-40 shrink-0 flex flex-col gap-2">
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">VOCAL STYLE</div>
        {VOCAL_PRESETS.map(p => (
          <button key={p.name} onClick={() => applyPreset(p)}
            className="w-full px-2 py-2.5 rounded-lg text-left cursor-pointer transition-all"
            style={{ background: preset.name === p.name ? `${p.color}22` : '#1c1b1e', border: `1px solid ${preset.name === p.name ? p.color : '#353437'}`, boxShadow: preset.name === p.name ? `0 0 8px ${p.color}44` : 'none' }}>
            <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: p.color }}>{p.name}</div>
          </button>
        ))}
      </div>

      {/* Center: controls */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-w-0">
        {/* Pitch correction */}
        <div className="bg-surface-low rounded-xl p-4 shrink-0">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-3" style={{ color: preset.color }}>PITCH CORRECTION</div>
          <div className="flex gap-4 items-center flex-wrap">
            <Knob value={pitchCorrect} min={0} max={100} label="CORRECT" color={preset.color}  onChange={setPitchCorrect} size={44} />
            <Knob value={vibrato}      min={0} max={100} label="VIBRATO" color="#76d6d5"        onChange={setVibrato}      size={44} />
            <Knob value={formant}      min={-50} max={50} label="FORMANT" color="#e9c349"       onChange={setFormant}      size={44} />
            <Knob value={breathiness} min={0} max={100}  label="BREATH"  color="#aaccdd"        onChange={setBreathiness}  size={44} />
            <Knob value={gender}       min={0} max={100} label="GENDER"  color="#ff6b9d"        onChange={setGender}       size={44} />
            <div className="flex-1 min-w-32">
              <div className="text-[8px] uppercase text-white/30 mb-2">KEY LOCK</div>
              <select value={rootNote} onChange={e => setRootNote(e.target.value)}
                className="bg-surface-mid text-teal font-bold text-xs rounded px-2 py-1 outline-none cursor-pointer border border-white/10 w-full">
                {NOTES.map(n => <option key={n} value={n} className="bg-surface-low">{n}</option>)}
              </select>
              <div className="text-[7px] text-white/20 mt-1 uppercase">{scale.replace(/_/g, ' ')}</div>
            </div>
          </div>
          {/* Pitch meter */}
          <div className="mt-3 h-3 bg-surface-mid rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pitchCorrect}%`, background: `linear-gradient(to right, ${preset.color}88, ${preset.color})`, marginLeft: 0 }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[7px] font-black" style={{ color: pitchCorrect > 50 ? '#000' : preset.color }}>
                {pitchCorrect < 20 ? 'NATURAL' : pitchCorrect < 60 ? 'SOFT TUNE' : pitchCorrect < 90 ? 'AUTO-TUNE' : 'T-PAIN MODE'}
              </span>
            </div>
          </div>
        </div>

        {/* Harmonizer */}
        <div className="bg-surface-low rounded-xl p-4 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">HARMONIZER</div>
          <div className="flex gap-3 items-start flex-wrap">
            <div>
              <div className="text-[8px] uppercase text-white/30 mb-2">INTERVALS</div>
              <div className="flex flex-wrap gap-1">
                {HARMONY_INTERVALS.map(h => {
                  const on = harmonies.has(h.id);
                  return (
                    <button key={h.id} onClick={() => toggleHarmony(h.id)}
                      className="px-2 py-1 rounded text-[8px] font-bold uppercase cursor-pointer transition-all"
                      style={{ background: on ? '#bf00ff22' : '#252428', border: `1px solid ${on ? '#bf00ff' : '#353437'}`, color: on ? '#bf00ff' : '#ffffff44' }}>
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Knob value={harmonyVol} min={0} max={100} label="BLEND" color="#bf00ff" onChange={setHarmonyVol} size={42} />
            {harmonies.size > 0 && (
              <div className="text-[7px] text-white/20 self-end mb-1">
                {harmonies.size} voice{harmonies.size > 1 ? 's' : ''} active
              </div>
            )}
          </div>
        </div>

        {/* Effects chain */}
        <div className="bg-surface-low rounded-xl p-4 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">EFFECTS CHAIN</div>
          <div className="grid grid-cols-3 gap-2">
            {EFFECTS.map(fx => {
              const on = activeEffects.has(fx.id);
              return (
                <div key={fx.id} className="rounded-lg p-2 flex flex-col gap-2"
                  style={{ background: on ? `${fx.color}11` : '#131315', border: `1px solid ${on ? fx.color : '#252428'}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold uppercase" style={{ color: on ? fx.color : '#ffffff44' }}>{fx.label}</span>
                    <button onClick={() => toggleEffect(fx.id)}
                      className="w-6 h-4 rounded-full cursor-pointer transition-all"
                      style={{ background: on ? fx.color : '#353437' }}>
                      <div className="w-3 h-3 rounded-full bg-white mx-auto transition-transform"
                        style={{ transform: on ? 'translateX(4px)' : 'translateX(-4px)' }} />
                    </button>
                  </div>
                  <input type="range" min={0} max={100} value={effectValues[fx.id]} disabled={!on}
                    onChange={e => setEffectValues(prev => ({ ...prev, [fx.id]: Number(e.target.value) }))}
                    className="w-full h-1 cursor-pointer disabled:opacity-30" style={{ accentColor: fx.color }} />
                  <div className="text-[6px] font-mono text-right" style={{ color: on ? fx.color : '#ffffff22' }}>
                    {effectValues[fx.id]}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: info panel */}
      <div className="w-44 shrink-0 flex flex-col gap-3">
        <div className="bg-surface-low rounded-xl p-3 flex-1">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-3" style={{ color: preset.color }}>
            {preset.name}
          </div>
          <div className="flex flex-col gap-2 text-[8px]">
            {[
              { label: 'PITCH CORRECT', val: `${pitchCorrect}%`, color: preset.color },
              { label: 'FORMANT',       val: formant >= 0 ? `+${formant}` : `${formant}`, color: '#e9c349' },
              { label: 'BREATHINESS',  val: `${breathiness}%`, color: '#aaccdd' },
              { label: 'GENDER SHIFT', val: gender < 40 ? 'DARKER' : gender > 60 ? 'LIGHTER' : 'NEUTRAL', color: '#ff6b9d' },
              { label: 'HARMONIES',    val: `${harmonies.size} voice${harmonies.size !== 1 ? 's' : ''}`, color: '#bf00ff' },
              { label: 'FX ACTIVE',    val: `${activeEffects.size} effect${activeEffects.size !== 1 ? 's' : ''}`, color: '#76d6d5' },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-white/30">{row.label}</span>
                <span className="font-bold" style={{ color: row.color }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all shrink-0"
          style={{ background: `${preset.color}22`, border: `1px solid ${preset.color}44`, color: preset.color, boxShadow: `0 0 12px ${preset.color}33` }}>
          APPLY TO TRACK
        </button>
      </div>
    </div>
  );
}

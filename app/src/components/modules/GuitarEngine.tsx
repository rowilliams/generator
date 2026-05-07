'use client';
import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { playNote, getScaleNotes } from '@/lib/audio';
import { exportNotesMidi } from '@/lib/midi';
import { Knob } from '@/components/ui/Knob';

type GuitarStyle = 'metal_riff' | 'rhythm' | 'nu_metal' | 'funk' | 'jazz' | 'blues' | 'clean' | 'classical';
type StringCount = 6 | 7 | 8 | 12;
type Tuning = 'standard' | 'drop_d' | 'drop_c' | 'drop_b' | 'open_g' | 'open_e' | 'dadgad';
type AmpModel = 'clean' | 'crunch' | 'high_gain' | 'metal' | 'jazz' | 'acoustic_sim';

interface RiffStep {
  active: boolean;
  note: string;
  palm_mute: boolean;
  bend: boolean;
  hammer: boolean;
}

const GUITAR_STYLES: { id: GuitarStyle; label: string; color: string; icon: string; desc: string }[] = [
  { id: 'metal_riff',  label: 'METAL RIFF',    color: '#ff3333', icon: '⚡', desc: 'Heavy palm-muted power chords' },
  { id: 'rhythm',      label: 'RHYTHM',         color: '#ff6b1a', icon: '♩', desc: 'Tight rhythm guitar patterns' },
  { id: 'nu_metal',    label: 'NU METAL',       color: '#7090b0', icon: '⊗', desc: 'Dropped-D djent grooves' },
  { id: 'funk',        label: 'FUNK',           color: '#e9c349', icon: '♪', desc: 'Syncopated funk chops' },
  { id: 'jazz',        label: 'JAZZ',           color: '#76d6d5', icon: '♫', desc: 'Chord melody & comping' },
  { id: 'blues',       label: 'BLUES',          color: '#d4650a', icon: '≈', desc: 'BB King-style bends & licks' },
  { id: 'clean',       label: 'CLEAN',          color: '#aaccdd', icon: '◌', desc: 'Sparkling clean tones' },
  { id: 'classical',   label: 'CLASSICAL',      color: '#9b59b6', icon: '♬', desc: 'Fingerpicked classical' },
];

const TUNINGS: { id: Tuning; label: string; notes: string[] }[] = [
  { id: 'standard', label: 'STANDARD',  notes: ['E2','A2','D3','G3','B3','E4'] },
  { id: 'drop_d',   label: 'DROP D',    notes: ['D2','A2','D3','G3','B3','E4'] },
  { id: 'drop_c',   label: 'DROP C',    notes: ['C2','G2','C3','F3','A3','D4'] },
  { id: 'drop_b',   label: 'DROP B',    notes: ['B1','F#2','B2','E3','G#3','C#4'] },
  { id: 'open_g',   label: 'OPEN G',    notes: ['D2','G2','D3','G3','B3','D4'] },
  { id: 'open_e',   label: 'OPEN E',    notes: ['E2','B2','E3','G#3','B3','E4'] },
  { id: 'dadgad',   label: 'DADGAD',    notes: ['D2','A2','D3','G3','A3','D4'] },
];

const AMP_MODELS: { id: AmpModel; label: string; color: string }[] = [
  { id: 'clean',        label: 'CLEAN',       color: '#76d6d5' },
  { id: 'crunch',       label: 'CRUNCH',      color: '#e9c349' },
  { id: 'high_gain',    label: 'HI-GAIN',     color: '#ff6b1a' },
  { id: 'metal',        label: 'METAL',       color: '#ff3333' },
  { id: 'jazz',         label: 'JAZZ',        color: '#bf00ff' },
  { id: 'acoustic_sim', label: 'ACOUSTIC',    color: '#d4650a' },
];

const RIFF_PATTERNS: Record<GuitarStyle, (notes: string[]) => Partial<RiffStep>[]> = {
  metal_riff: notes => [0,0,3,0,0,3,5,0,0,3,0,0,5,3,0,0].map((d,i) => ({
    active: true, note: notes[d % notes.length] || notes[0], palm_mute: i % 4 !== 2, bend: false, hammer: false,
  })),
  rhythm: notes => [0,-1,2,-1,4,-1,2,-1,0,-1,5,-1,4,-1,2,-1].map((d,i) => ({
    active: d >= 0, note: d >= 0 ? notes[d % notes.length] : notes[0], palm_mute: false, bend: false, hammer: i === 6,
  })),
  nu_metal: notes => [0,0,0,3,0,0,5,0,0,0,3,0,5,3,0,0].map((d,i) => ({
    active: true, note: notes[d % notes.length] || notes[0], palm_mute: i % 2 === 0, bend: false, hammer: false,
  })),
  funk: notes => [0,-1,2,4,-1,2,4,-1,0,-1,5,4,-1,2,-1,0].map((d,i) => ({
    active: d >= 0, note: d >= 0 ? notes[d % notes.length] : notes[0], palm_mute: false, bend: i === 10, hammer: i === 4,
  })),
  jazz: notes => [0,2,4,5,7,5,4,2,0,4,5,7,9,7,5,4].map((d,i) => ({
    active: true, note: notes[d % notes.length] || notes[0], palm_mute: false, bend: false, hammer: i % 3 === 2,
  })),
  blues: notes => [0,0,3,0,0,3,0,0,5,0,3,0,0,3,5,3].map((d,i) => ({
    active: true, note: notes[d % notes.length] || notes[0], palm_mute: false, bend: i === 7 || i === 14, hammer: i === 3,
  })),
  clean: notes => [0,2,4,7,9,7,4,2,0,4,7,9,12,9,7,4].map(d => ({
    active: true, note: notes[d % notes.length] || notes[0], palm_mute: false, bend: false, hammer: false,
  })),
  classical: notes => [0,4,7,0,4,7,0,4,7,0,5,9,0,5,9,0].map(d => ({
    active: true, note: notes[d % notes.length] || notes[0], palm_mute: false, bend: false, hammer: false,
  })),
};

function makeSteps(notes: string[]): RiffStep[] {
  return Array.from({ length: 16 }, (_, i) => ({
    active: i % 4 === 0,
    note: notes[0] || 'E2',
    palm_mute: false,
    bend: false,
    hammer: false,
  }));
}

export function GuitarEngine() {
  const { key, scale, bpm } = useProjectStore();
  const [style, setStyle] = useState<GuitarStyle>('rhythm');
  const [stringCount, setStringCount] = useState<StringCount>(6);
  const [tuning, setTuning] = useState<Tuning>('standard');
  const [ampModel, setAmpModel] = useState<AmpModel>('crunch');
  const [gain, setGain] = useState(60);
  const [tone, setTone] = useState(50);
  const [reverb, setReverb] = useState(20);
  const [steps, setSteps] = useState<RiffStep[]>(() => makeSteps(getScaleNotes(key, scale, 2)));

  const scaleNotes = useMemo(() => getScaleNotes(key, scale, 2), [key, scale]);
  const currentStyle = GUITAR_STYLES.find(s => s.id === style)!;
  const currentTuning = TUNINGS.find(t => t.id === tuning)!;

  const generateRiff = useCallback(() => {
    const pattern = RIFF_PATTERNS[style](scaleNotes);
    setSteps(prev => prev.map((s, i) => ({ ...s, ...pattern[i] })));
  }, [style, scaleNotes]);

  const previewRiff = () => {
    const active = steps.filter(s => s.active);
    active.forEach((s, i) => {
      setTimeout(() => playNote(s.note, '16n', 'melody'), i * 120);
    });
  };

  const toggleStep = (idx: number) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, active: !s.active } : s));
  };

  const togglePalmMute = (idx: number) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, palm_mute: !s.palm_mute } : s));
  };

  const toggleBend = (idx: number) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, bend: !s.bend } : s));
  };

  return (
    <div className="flex gap-4 h-full p-4 overflow-hidden">

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <SectionTabs />
          <div className="flex gap-1 ml-auto">
            {([6, 7, 8, 12] as StringCount[]).map(n => (
              <button key={n} onClick={() => setStringCount(n)}
                className="px-2 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{
                  background: stringCount === n ? `${currentStyle.color}33` : '#252428',
                  border: `1px solid ${stringCount === n ? currentStyle.color : '#353437'}`,
                  color: stringCount === n ? currentStyle.color : '#ffffff55',
                }}
              >{n}-STR</button>
            ))}
          </div>
        </div>

        {/* Style grid */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          {GUITAR_STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              title={s.desc}
              className="p-2 rounded-xl text-left cursor-pointer transition-all"
              style={{
                background: style === s.id ? `${s.color}22` : '#1c1b1e',
                border: `1px solid ${style === s.id ? s.color : '#353437'}`,
                boxShadow: style === s.id ? `0 0 12px ${s.color}44` : 'none',
              }}
            >
              <div className="text-base mb-0.5">{s.icon}</div>
              <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
            </button>
          ))}
        </div>


        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">RIFF PATTERN</div>
          <div className="flex gap-1">
            {steps.map((step, si) => {
              const isBar = si % 4 === 0;
              return (
                <div key={si} className="flex-1 flex flex-col gap-1">
                  <button
                    onClick={() => toggleStep(si)}
                    className="h-10 rounded-sm transition-all duration-75 cursor-pointer relative overflow-hidden"
                    style={{
                      background: step.active ? currentStyle.color : isBar ? '#2a2930' : '#1c1b1e',
                      border: `1px solid ${step.active ? currentStyle.color : isBar ? '#353437' : '#252428'}`,
                      boxShadow: step.active ? `0 0 8px ${currentStyle.color}88` : 'none',
                    }}
                  >
                    {step.palm_mute && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />}
                    {step.bend && <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400/60" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Articulation rows */}
          <div className="flex gap-1 mt-1">
            {steps.map((step, si) => (
              <button key={si}
                onClick={() => step.active && togglePalmMute(si)}
                className="flex-1 h-3 rounded-sm cursor-pointer transition-all"
                style={{ background: step.palm_mute && step.active ? '#ffffff55' : '#252428', border: '1px solid #353437', opacity: step.active ? 1 : 0.2 }}
                title="Palm Mute"
              />
            ))}
          </div>
          <div className="text-[7px] text-white/20 mt-0.5 uppercase tracking-wider">PALM MUTE</div>

          <div className="flex gap-1 mt-1">
            {steps.map((step, si) => (
              <button key={si}
                onClick={() => step.active && toggleBend(si)}
                className="flex-1 h-3 rounded-sm cursor-pointer transition-all"
                style={{ background: step.bend && step.active ? '#e9c34999' : '#252428', border: '1px solid #353437', opacity: step.active ? 1 : 0.2 }}
                title="Bend"
              />
            ))}
          </div>
          <div className="text-[7px] text-white/20 mt-0.5 uppercase tracking-wider">BEND</div>
        </div>


        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">TUNING</div>
          <div className="flex gap-2 flex-wrap">
            {TUNINGS.map(t => (
              <button key={t.id} onClick={() => setTuning(t.id)}
                className="px-2 py-1 text-[8px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{
                  background: tuning === t.id ? `${currentStyle.color}22` : '#252428',
                  border: `1px solid ${tuning === t.id ? currentStyle.color : '#353437'}`,
                  color: tuning === t.id ? currentStyle.color : '#ffffff44',
                }}
              >{t.label}</button>
            ))}
          </div>
          <div className="flex gap-1 mt-2">
            {currentTuning.notes.slice(0, stringCount === 12 ? 6 : stringCount).map(n => (
              <button
                key={n}
                onClick={() => playNote(n, '4n', 'melody')}
                className="px-2 py-1 rounded text-[8px] font-bold cursor-pointer transition-all hover:scale-105"
                style={{ background: '#1c1b1e', border: `1px solid ${currentStyle.color}44`, color: currentStyle.color }}
              >{n}</button>
            ))}
          </div>
        </div>


        <div className="flex-1 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">SCALE NOTES</div>
          <div className="flex flex-wrap gap-2">
            {scaleNotes.map(n => (
              <button key={n} onClick={() => playNote(n, '8n', 'melody')}
                className="px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all hover:scale-105"
                style={{ background: '#1c1b1e', border: `1px solid ${currentStyle.color}44`, color: currentStyle.color }}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>


      <div className="w-52 shrink-0 flex flex-col gap-3">

        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">AMP MODEL</div>
          <div className="grid grid-cols-2 gap-1">
            {AMP_MODELS.map(a => (
              <button key={a.id} onClick={() => setAmpModel(a.id)}
                className="py-1.5 px-2 rounded text-[8px] font-bold uppercase cursor-pointer transition-all"
                style={{
                  background: ampModel === a.id ? `${a.color}22` : '#252428',
                  border: `1px solid ${ampModel === a.id ? a.color : '#353437'}`,
                  color: ampModel === a.id ? a.color : '#ffffff44',
                }}
              >{a.label}</button>
            ))}
          </div>
        </div>


        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">AMP CONTROLS</div>
          <div className="flex justify-around">
            <Knob value={gain} min={0} max={100} label="GAIN" color={currentStyle.color} onChange={setGain} size={42} />
            <Knob value={tone} min={0} max={100} label="TONE" color="#e9c349" onChange={setTone} size={42} />
            <Knob value={reverb} min={0} max={100} label="REVERB" color="#76d6d5" onChange={setReverb} size={42} />
          </div>
        </div>


        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">FRETBOARD</div>
          <div className="flex flex-col gap-1">
            {currentTuning.notes.slice(0, 6).reverse().map((openNote, si) => (
              <div key={si} className="flex gap-0.5">
                <span className="text-[7px] text-white/30 w-5 text-right">{openNote.replace(/\d/, '')}</span>
                {Array.from({ length: 8 }).map((_, fret) => {
                  const noteIdx = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(openNote.replace(/\d/, ''));
                  const fretNote = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][(noteIdx + fret) % 12];
                  const inScale = scaleNotes.some(n => n.replace(/\d/, '') === fretNote);
                  return (
                    <div key={fret}
                      className="flex-1 h-3 rounded-sm cursor-pointer transition-all"
                      style={{
                        background: inScale ? `${currentStyle.color}44` : '#252428',
                        border: `1px solid ${inScale ? currentStyle.color + '66' : '#353437'}`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>


        <button onClick={generateRiff}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          style={{ background: `${currentStyle.color}22`, border: `1px solid ${currentStyle.color}44`, color: currentStyle.color }}
        >AI GENERATE RIFF</button>
        <button onClick={previewRiff}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-purple/20 border border-purple/40 text-purple hover:bg-purple/30 transition-all"
        >PREVIEW RIFF</button>
        <button
          onClick={() => exportNotesMidi(
            steps.filter(s => s.active).map((s, i) => ({ pitch: s.note, step: i, length: 1, velocity: 90 })),
            bpm, 'guitar.mid'
          )}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all"
        >EXPORT MIDI</button>
      </div>
    </div>
  );
}

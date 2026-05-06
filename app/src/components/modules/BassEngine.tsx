'use client';
import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { playNote, getScaleNotes, NOTES } from '@/lib/audio';
import { Knob } from '@/components/ui/Knob';

type BassInstrument = 'synth' | '808' | 'bass_guitar' | 'sub_pad';
type StringCount = 4 | 5 | 6;
type PlayStyle = 'fingered' | 'slap' | 'funk' | 'prog_funk' | 'picked' | 'fretless';
type ArpMode = 'off' | 'up' | 'down' | 'up_down' | 'random';

interface BassStep {
  active: boolean;
  note: string;
  velocity: number;
  slide: boolean;
}

const INSTRUMENTS: { id: BassInstrument; label: string; color: string; icon: string }[] = [
  { id: 'synth',      label: 'SYNTH BASS',   color: '#bf00ff', icon: '∿' },
  { id: '808',        label: '808 SUB',       color: '#ff3333', icon: '⬡' },
  { id: 'bass_guitar',label: 'BASS GUITAR',   color: '#7a00a6', icon: '〜' },
  { id: 'sub_pad',    label: 'SUB PAD',       color: '#76d6d5', icon: '≈' },
];

const PLAY_STYLES: { id: PlayStyle; label: string }[] = [
  { id: 'fingered',   label: 'FINGERED' },
  { id: 'slap',       label: 'SLAP' },
  { id: 'funk',       label: 'FUNK' },
  { id: 'prog_funk',  label: 'PROG FUNK' },
  { id: 'picked',     label: 'PICKED' },
  { id: 'fretless',   label: 'FRETLESS' },
];

const ARP_MODES: ArpMode[] = ['off', 'up', 'down', 'up_down', 'random'];

const STRING_RANGES: Record<StringCount, { low: string; high: string }> = {
  4: { low: 'E1', high: 'G4' },
  5: { low: 'B0', high: 'G4' },
  6: { low: 'B0', high: 'C5' },
};

function makeSteps(root: string): BassStep[] {
  return Array.from({ length: 16 }, (_, i) => ({
    active: i === 0,
    note: root,
    velocity: 100,
    slide: false,
  }));
}

export function BassEngine() {
  const { key, scale, vibe, activeSection } = useProjectStore();
  const [instrument, setInstrument] = useState<BassInstrument>('synth');
  const [stringCount, setStringCount] = useState<StringCount>(4);
  const [playStyle, setPlayStyle] = useState<PlayStyle>('fingered');
  const [arpMode, setArpMode] = useState<ArpMode>('off');
  const [octave, setOctave] = useState(2);
  const [drive, setDrive] = useState(30);
  const [sub, setSub] = useState(60);
  const [attack, setAttack] = useState(5);
  const [steps, setSteps] = useState<BassStep[]>(() => makeSteps(key));
  const [currentStep] = useState(-1);

  const scaleNotes = useMemo(() => getScaleNotes(key, scale, octave), [key, scale, octave]);
  const activeColor = INSTRUMENTS.find(i => i.id === instrument)?.color || '#bf00ff';

  const toggleStep = (idx: number) => {
    setSteps(prev => prev.map((s, i) =>
      i === idx ? { ...s, active: !s.active } : s
    ));
  };

  const setStepNote = (idx: number, note: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, note } : s));
  };

  const toggleSlide = (idx: number) => {
    setSteps(prev => prev.map((s, i) =>
      i === idx ? { ...s, slide: !s.slide } : s
    ));
  };

  const generateLine = useCallback(() => {
    const notes = scaleNotes.slice(0, 7);
    const patterns: Record<string, number[]> = {
      fingered:  [0, 0, 4, 0, 7, 0, 4, 7, 0, 0, 5, 0, 7, 5, 4, 0],
      slap:      [0, -1, 4, -1, 0, 7, -1, 4, 0, -1, 5, -1, 7, -1, 5, -1],
      funk:      [0, 4, 0, 7, 0, 4, 7, 0, 5, 0, 4, 7, 0, 4, 0, 7],
      prog_funk: [0, 3, 5, 7, 10, 7, 5, 3, 0, 5, 7, 10, 12, 10, 7, 5],
      picked:    [0, 0, 7, 0, 0, 5, 7, 0, 0, 7, 5, 0, 4, 0, 7, 0],
      fretless:  [0, 2, 3, 5, 7, 5, 3, 2, 0, 3, 5, 7, 9, 7, 5, 3],
    };
    const pattern = patterns[playStyle] || patterns.fingered;
    setSteps(pattern.map((degree, i) => ({
      active: degree >= 0,
      note: degree >= 0 ? (notes[degree % notes.length] || notes[0]) : notes[0],
      velocity: 80 + Math.floor(Math.random() * 40),
      slide: playStyle === 'fretless' && i % 4 === 2,
    })));
  }, [playStyle, scaleNotes]);

  const previewLine = () => {
    const activeSteps = steps.filter(s => s.active);
    activeSteps.forEach((s, i) => {
      setTimeout(() => playNote(s.note, '16n', 'pad'), i * 150);
    });
  };

  return (
    <div className="flex gap-4 h-full p-4 overflow-hidden">

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Top */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <SectionTabs />
          <div className="flex gap-1 ml-auto">
            {([4, 5, 6] as StringCount[]).map(n => (
              <button key={n} onClick={() => setStringCount(n)}
                className="px-2 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{
                  background: stringCount === n ? `${activeColor}33` : '#252428',
                  border: `1px solid ${stringCount === n ? activeColor : '#353437'}`,
                  color: stringCount === n ? activeColor : '#ffffff55',
                }}
              >{n}-STRING</button>
            ))}
          </div>
          <div className="text-[9px] text-white/30 uppercase">
            {STRING_RANGES[stringCount].low} – {STRING_RANGES[stringCount].high}
          </div>
        </div>


        <div className="flex gap-2 shrink-0">
          {INSTRUMENTS.map(inst => (
            <button
              key={inst.id}
              onClick={() => setInstrument(inst.id)}
              className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
              style={{
                background: instrument === inst.id ? `${inst.color}22` : '#1c1b1e',
                border: `1px solid ${instrument === inst.id ? inst.color : '#353437'}`,
                color: instrument === inst.id ? inst.color : '#ffffff44',
                boxShadow: instrument === inst.id ? `0 0 12px ${inst.color}44` : 'none',
              }}
            >
              <span className="text-base">{inst.icon}</span>
              <div className="text-[8px] mt-0.5">{inst.label}</div>
            </button>
          ))}
        </div>


        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">BASS LINE — 16 STEPS</div>
          <div className="flex gap-1">
            {steps.map((step, si) => {
              const isBar = si % 4 === 0;
              const isCurrent = currentStep === si;
              return (
                <div key={si} className="flex-1 flex flex-col gap-1">
                  <button
                    onClick={() => toggleStep(si)}
                    className="h-10 rounded-sm transition-all duration-75 cursor-pointer relative"
                    style={{
                      background: step.active
                        ? activeColor
                        : isCurrent ? '#ffffff22'
                        : isBar ? '#2a2930' : '#1c1b1e',
                      border: `1px solid ${step.active ? activeColor : isBar ? '#353437' : '#252428'}`,
                      boxShadow: step.active ? `0 0 8px ${activeColor}88` : 'none',
                    }}
                  >
                    {step.slide && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-sm"
                        style={{ background: '#e9c349' }} />
                    )}
                  </button>
                  {step.active && (
                    <select
                      value={step.note}
                      onChange={e => setStepNote(si, e.target.value)}
                      className="text-[7px] bg-transparent text-center cursor-pointer outline-none rounded"
                      style={{ color: activeColor, background: `${activeColor}11`, border: `1px solid ${activeColor}33` }}
                    >
                      {scaleNotes.map(n => (
                        <option key={n} value={n} className="bg-surface-low">{n}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slide row */}
          <div className="flex gap-1 mt-1">
            {steps.map((step, si) => (
              <button
                key={si}
                onClick={() => step.active && toggleSlide(si)}
                className="flex-1 h-3 rounded-sm cursor-pointer transition-all"
                style={{
                  background: step.slide ? '#e9c349' : '#252428',
                  border: `1px solid ${step.slide ? '#e9c349' : '#353437'}`,
                  opacity: step.active ? 1 : 0.2,
                }}
                title="Slide/Portamento"
              />
            ))}
          </div>
          <div className="text-[7px] text-white/20 mt-1 uppercase tracking-wider">SLIDE</div>
        </div>


        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">PLAYING STYLE</div>
          <div className="flex gap-2 flex-wrap">
            {PLAY_STYLES.map(s => (
              <button key={s.id} onClick={() => setPlayStyle(s.id)}
                className="px-3 py-1.5 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{
                  background: playStyle === s.id ? `${activeColor}22` : '#1c1b1e',
                  border: `1px solid ${playStyle === s.id ? activeColor : '#353437'}`,
                  color: playStyle === s.id ? activeColor : '#ffffff44',
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>


        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">ARPEGGIO</div>
          <div className="flex gap-2">
            {ARP_MODES.map(m => (
              <button key={m} onClick={() => setArpMode(m)}
                className="px-2 py-1 text-[8px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{
                  background: arpMode === m ? '#e9c34933' : '#252428',
                  border: `1px solid ${arpMode === m ? '#e9c349' : '#353437'}`,
                  color: arpMode === m ? '#e9c349' : '#ffffff44',
                }}
              >{m}</button>
            ))}
          </div>
        </div>


        <div className="flex-1 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">SCALE NOTES</div>
          <div className="flex flex-wrap gap-2">
            {scaleNotes.map(n => (
              <button
                key={n}
                onClick={() => playNote(n, '4n', 'pad')}
                className="px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all hover:scale-105"
                style={{ background: '#1c1b1e', border: `1px solid ${activeColor}44`, color: activeColor }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="w-52 shrink-0 flex flex-col gap-3">

        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">TONE SHAPING</div>
          <div className="flex justify-around flex-wrap gap-3">
            <Knob value={drive} min={0} max={100} label="DRIVE" color={activeColor} onChange={setDrive} size={44} />
            <Knob value={sub} min={0} max={100} label="SUB" color="#ff3333" onChange={setSub} size={44} />
            <Knob value={attack} min={0} max={100} label="ATTACK" color="#e9c349" onChange={setAttack} size={44} />
            <Knob value={octave} min={1} max={4} label="OCTAVE" color="#76d6d5" onChange={v => setOctave(Math.round(v))} size={44} />
          </div>
        </div>


        <button
          onClick={generateLine}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          style={{ background: `${activeColor}22`, border: `1px solid ${activeColor}44`, color: activeColor }}
        >
          AI GENERATE LINE
        </button>
        <button
          onClick={previewLine}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-purple/20 border border-purple/40 text-purple hover:bg-purple/30 transition-all"
        >
          PREVIEW LINE
        </button>
        <button className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all">
          EXPORT MIDI
        </button>


        <div className="bg-surface-low rounded-xl p-3 flex-1">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">QUICK EQ</div>
          {['LOW', 'MID', 'HIGH'].map((band, bi) => (
            <div key={band} className="flex items-center gap-2 mb-2">
              <span className="text-[8px] text-white/30 w-8 uppercase">{band}</span>
              <input
                type="range" min={-12} max={12} defaultValue={0}
                className="flex-1 h-1 accent-purple cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { playNote, getScaleNotes } from '@/lib/audio';
import { Knob } from '@/components/ui/Knob';

type BassInstrument = 'synth' | '808' | 'bass_guitar' | 'sub_pad';
type Waveform = 'sine' | 'saw' | 'square' | '808';
type StringCount = 4 | 5 | 6;
type PlayStyle = 'fingered' | 'slap' | 'funk' | 'prog_funk' | 'picked' | 'fretless';
type ArpPattern = 'off' | 'up' | 'down' | 'up_down' | 'random';
type StringGauge = 'light' | 'medium' | 'heavy' | 'extra_heavy';

interface BassStep {
  active: boolean;
  note: string;
  velocity: number;
  slide: boolean;
  probability: number;
}

const INSTRUMENTS: { id: BassInstrument; label: string; color: string; icon: string }[] = [
  { id: 'synth',       label: 'SYNTH BASS',  color: '#bf00ff', icon: '∿' },
  { id: '808',         label: '808 SUB',     color: '#ff3333', icon: '⬡' },
  { id: 'bass_guitar', label: 'BASS GUITAR', color: '#7a00a6', icon: '〜' },
  { id: 'sub_pad',     label: 'SUB PAD',     color: '#76d6d5', icon: '≈' },
];

const WAVEFORMS: { id: Waveform; label: string }[] = [
  { id: 'sine',   label: 'SINE' },
  { id: 'saw',    label: 'SAW' },
  { id: 'square', label: 'SQUARE' },
  { id: '808',    label: '808' },
];

const PLAY_STYLES: { id: PlayStyle; label: string }[] = [
  { id: 'fingered',  label: 'FINGERED' },
  { id: 'slap',      label: 'SLAP' },
  { id: 'funk',      label: 'FUNK' },
  { id: 'prog_funk', label: 'PROG FUNK' },
  { id: 'picked',    label: 'PICKED' },
  { id: 'fretless',  label: 'FRETLESS' },
];

const EXTENSIONS = ['maj7', 'min7', 'dom7', 'maj9', 'min9', 'add9', '11th', '13th'];

const STRING_TUNINGS: Record<StringCount, string[]> = {
  4: ['E1', 'A1', 'D2', 'G2'],
  5: ['B0', 'E1', 'A1', 'D2', 'G2'],
  6: ['B0', 'E1', 'A1', 'D2', 'G2', 'C3'],
};

const STRING_COLORS: Record<StringCount, string[]> = {
  4: ['#ff6b1a', '#e9c349', '#76d6d5', '#bf00ff'],
  5: ['#ff3333', '#ff6b1a', '#e9c349', '#76d6d5', '#bf00ff'],
  6: ['#ff3333', '#ff6b1a', '#e9c349', '#76d6d5', '#bf00ff', '#76d6d5'],
};

function makeSteps(note: string): BassStep[] {
  return Array.from({ length: 16 }, (_, i) => ({
    active: i === 0,
    note,
    velocity: 100,
    slide: false,
    probability: 100,
  }));
}

function OscilloscopeCanvas({ color, active }: { color: string; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, width, height);

      if (!active) {
        ctx.strokeStyle = `${color}33`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      phaseRef.current += 0.06;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * 6 + phaseRef.current;
        const y = height / 2 + Math.sin(t) * (height * 0.35) * (0.8 + 0.2 * Math.sin(t * 0.3));
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [color, active]);

  return <canvas ref={canvasRef} width={280} height={56} className="rounded-lg w-full" style={{ background: '#0a0a0c' }} />;
}

export function BassEngine() {
  const { key, scale, activeSection } = useProjectStore();
  const [instrument, setInstrument] = useState<BassInstrument>('synth');
  const [waveform, setWaveform] = useState<Waveform>('saw');
  const [stringCount, setStringCount] = useState<StringCount>(4);
  const [gauge, setGauge] = useState<StringGauge>('medium');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('fingered');
  const [arpPattern, setArpPattern] = useState<ArpPattern>('off');
  const [activeExtensions, setActiveExtensions] = useState<Set<string>>(new Set());
  const [legato, setLegato] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [octave, setOctave] = useState(2);
  const [drive, setDrive] = useState(30);
  const [sustain, setSustain] = useState(60);
  const [decay, setDecay] = useState(40);
  const [glide, setGlide] = useState(15);
  const [tail808, setTail808] = useState(50);
  const [steps, setSteps] = useState<BassStep[]>(() => makeSteps(key));

  const scaleNotes = useMemo(() => getScaleNotes(key, scale, octave), [key, scale, octave]);
  const activeColor = INSTRUMENTS.find(i => i.id === instrument)?.color || '#bf00ff';
  const tuning = STRING_TUNINGS[stringCount];
  const stringColors = STRING_COLORS[stringCount];

  const toggleStep = (idx: number) => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, active: !s.active } : s));
  const toggleSlide = (idx: number) => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, slide: !s.slide } : s));
  const setStepNote = (idx: number, note: string) => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, note } : s));
  const toggleExtension = (ext: string) => setActiveExtensions(prev => { const n = new Set(prev); n.has(ext) ? n.delete(ext) : n.add(ext); return n; });

  const generateLine = useCallback(() => {
    const notes = scaleNotes.slice(0, 7);
    const patterns: Record<PlayStyle, number[]> = {
      fingered:  [0, 0, 4, 0, 7, 0, 4, 7, 0, 0, 5, 0, 7, 5, 4, 0],
      slap:      [0, -1, 4, -1, 0, 7, -1, 4, 0, -1, 5, -1, 7, -1, 5, -1],
      funk:      [0, 4, 0, 7, 0, 4, 7, 0, 5, 0, 4, 7, 0, 4, 0, 7],
      prog_funk: [0, 3, 5, 7, 10, 7, 5, 3, 0, 5, 7, 10, 12, 10, 7, 5],
      picked:    [0, 0, 7, 0, 0, 5, 7, 0, 0, 7, 5, 0, 4, 0, 7, 0],
      fretless:  [0, 2, 3, 5, 7, 5, 3, 2, 0, 3, 5, 7, 9, 7, 5, 3],
    };
    const pattern = patterns[playStyle];
    setSteps(pattern.map((d, i) => ({
      active: d >= 0,
      note: d >= 0 ? (notes[d % notes.length] || notes[0]) : notes[0],
      velocity: 80 + Math.floor(Math.random() * 40),
      slide: playStyle === 'fretless' && i % 4 === 2,
      probability: playStyle === 'funk' && i % 2 === 1 ? 70 : 100,
    })));
  }, [playStyle, scaleNotes]);

  const previewLine = () => {
    steps.filter(s => s.active).forEach((s, i) => setTimeout(() => playNote(s.note, '16n', 'pad'), i * 150));
  };

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden">
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <SectionTabs />
          <div className="flex gap-1 ml-auto">
            {([4, 5, 6] as StringCount[]).map(n => (
              <button key={n} onClick={() => setStringCount(n)}
                className="px-2 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{ background: stringCount === n ? `${activeColor}33` : '#252428', border: `1px solid ${stringCount === n ? activeColor : '#353437'}`, color: stringCount === n ? activeColor : '#ffffff55' }}
              >{n}-STR</button>
            ))}
          </div>
          {(['light', 'medium', 'heavy', 'extra_heavy'] as StringGauge[]).map(g => (
            <button key={g} onClick={() => setGauge(g)}
              className="px-2 py-1 text-[8px] uppercase tracking-wider rounded cursor-pointer transition-all"
              style={{ background: gauge === g ? '#e9c34922' : '#252428', border: `1px solid ${gauge === g ? '#e9c349' : '#353437'}`, color: gauge === g ? '#e9c349' : '#ffffff44' }}
            >{g.replace('_', ' ')}</button>
          ))}
        </div>

        {/* Instrument tabs */}
        <div className="flex gap-2 shrink-0">
          {INSTRUMENTS.map(inst => (
            <button key={inst.id} onClick={() => setInstrument(inst.id)}
              className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
              style={{ background: instrument === inst.id ? `${inst.color}22` : '#1c1b1e', border: `1px solid ${instrument === inst.id ? inst.color : '#353437'}`, color: instrument === inst.id ? inst.color : '#ffffff44', boxShadow: instrument === inst.id ? `0 0 12px ${inst.color}44` : 'none' }}
            >
              <span className="text-base">{inst.icon}</span>
              <div className="text-[8px] mt-0.5">{inst.label}</div>
            </button>
          ))}
        </div>

        {/* Waveform selectors */}
        <div className="flex gap-2 shrink-0">
          <span className="text-[9px] text-white/30 uppercase tracking-widest self-center font-bold">WAVE</span>
          {WAVEFORMS.map(w => (
            <button key={w.id} onClick={() => setWaveform(w.id)}
              className="px-3 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
              style={{ background: waveform === w.id ? `${activeColor}33` : '#252428', border: `1px solid ${waveform === w.id ? activeColor : '#353437'}`, color: waveform === w.id ? activeColor : '#ffffff44', boxShadow: waveform === w.id ? `0 0 8px ${activeColor}66` : 'none' }}
            >{w.label}</button>
          ))}
        </div>

        {/* Oscilloscope */}
        <div className="shrink-0 bg-surface-low rounded-xl p-2">
          <OscilloscopeCanvas color={activeColor} active={playing} />
        </div>

        {/* Step sequencer */}
        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">BASS LINE — 16 STEPS</div>
          <div className="flex gap-1">
            {steps.map((step, si) => {
              const isBar = si % 4 === 0;
              let bg = isBar ? '#2a2930' : '#1c1b1e';
              if (step.active) bg = activeColor;
              return (
                <div key={si} className="flex-1 flex flex-col gap-0.5">
                  <button onClick={() => toggleStep(si)}
                    className="h-9 rounded-sm transition-all duration-75 cursor-pointer relative"
                    style={{ background: bg, border: `1px solid ${step.active ? activeColor : isBar ? '#353437' : '#252428'}`, boxShadow: step.active ? `0 0 8px ${activeColor}88` : 'none' }}
                  >
                    {step.slide && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-sm" style={{ background: '#e9c349' }} />}
                    {step.probability < 100 && step.active && (
                      <div className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-black/60">{step.probability}%</div>
                    )}
                  </button>
                  {step.active && (
                    <select value={step.note} onChange={e => setStepNote(si, e.target.value)}
                      className="text-[7px] bg-transparent text-center cursor-pointer outline-none rounded"
                      style={{ color: activeColor, background: `${activeColor}11`, border: `1px solid ${activeColor}33` }}
                      onClick={e => e.stopPropagation()}
                    >
                      {scaleNotes.map(n => <option key={n} value={n} className="bg-surface-low">{n}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          {/* Slide row */}
          <div className="flex gap-1 mt-1">
            {steps.map((step, si) => (
              <button key={si} onClick={() => step.active && toggleSlide(si)}
                className="flex-1 h-2.5 rounded-sm cursor-pointer transition-all"
                style={{ background: step.slide && step.active ? '#e9c349' : '#252428', border: `1px solid ${step.slide && step.active ? '#e9c349' : '#353437'}`, opacity: step.active ? 1 : 0.2 }}
                title="SLIDE"
              />
            ))}
          </div>
          <div className="text-[7px] text-white/20 mt-0.5 uppercase tracking-wider">SLIDE / PORTAMENTO</div>
        </div>

        {/* Play style */}
        <div className="shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">PLAYING STYLE</div>
          <div className="flex gap-2 flex-wrap">
            {PLAY_STYLES.map(s => (
              <button key={s.id} onClick={() => setPlayStyle(s.id)}
                className="px-3 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{ background: playStyle === s.id ? `${activeColor}22` : '#1c1b1e', border: `1px solid ${playStyle === s.id ? activeColor : '#353437'}`, color: playStyle === s.id ? activeColor : '#ffffff44' }}
              >{s.label}</button>
            ))}
            <button onClick={() => setLegato(!legato)}
              className="px-3 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all ml-auto"
              style={{ background: legato ? '#76d6d522' : '#252428', border: `1px solid ${legato ? '#76d6d5' : '#353437'}`, color: legato ? '#76d6d5' : '#ffffff44' }}
            >LEGATO</button>
          </div>
        </div>

        {/* String fretboard */}
        <div className="flex-1 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">FRETBOARD · {stringCount}-STRING</div>
          <div className="flex flex-col gap-1">
            {[...tuning].reverse().map((openNote, si) => {
              const color = [...stringColors].reverse()[si];
              return (
                <div key={si} className="flex items-center gap-1">
                  <button onClick={() => playNote(openNote, '4n', 'pad')}
                    className="text-[8px] font-bold w-8 text-right cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ color }}
                  >{openNote}</button>
                  {Array.from({ length: 12 }).map((_, fret) => {
                    const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
                    const baseIdx = noteNames.indexOf(openNote.replace(/\d/, ''));
                    const fretNote = noteNames[(baseIdx + fret) % 12];
                    const inScale = scaleNotes.some(n => n.replace(/\d/, '') === fretNote);
                    const isRoot = fretNote === key;
                    return (
                      <div key={fret} className="flex-1 h-4 rounded-sm cursor-pointer transition-all hover:opacity-80"
                        style={{ background: isRoot ? activeColor : inScale ? `${activeColor}44` : '#1a1920', border: `1px solid ${isRoot ? activeColor : inScale ? `${activeColor}44` : '#252428'}`, boxShadow: isRoot ? `0 0 6px ${activeColor}66` : 'none' }}
                        onClick={() => { const oct = parseInt(openNote.replace(/[^0-9]/g, '')) + Math.floor((noteNames.indexOf(openNote.replace(/\d/, '')) + fret) / 12); playNote(`${fretNote}${oct}`, '8n', 'pad'); }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-52 shrink-0 flex flex-col gap-3">
        {/* Knobs */}
        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">TONE SHAPING</div>
          <div className="flex flex-wrap justify-around gap-2">
            <Knob value={drive}   min={0} max={100} label="DRIVE"   color={activeColor}  onChange={setDrive}   size={42} />
            <Knob value={sustain} min={0} max={100} label="SUSTAIN" color="#e9c349"      onChange={setSustain} size={42} />
            <Knob value={decay}   min={0} max={100} label="DECAY"   color="#76d6d5"      onChange={setDecay}   size={42} />
            <Knob value={glide}   min={0} max={100} label="GLIDE"   color="#ff6b9d"      onChange={setGlide}   size={42} />
          </div>
          {instrument === '808' && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] text-white/40 uppercase tracking-wider">808 TAIL</span>
                <span className="text-[8px] font-mono text-white/50">{tail808}</span>
              </div>
              <input type="range" min={0} max={100} value={tail808} onChange={e => setTail808(Number(e.target.value))}
                className="w-full h-1 cursor-pointer" style={{ accentColor: '#ff3333' }} />
            </div>
          )}
        </div>

        {/* Extensions */}
        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">EXTENSIONS</div>
          <div className="flex flex-wrap gap-1">
            {EXTENSIONS.map(ext => (
              <button key={ext} onClick={() => toggleExtension(ext)}
                className="text-[8px] px-2 py-1 rounded cursor-pointer transition-all font-bold"
                style={{ background: activeExtensions.has(ext) ? `${activeColor}33` : '#252428', border: `1px solid ${activeExtensions.has(ext) ? activeColor : '#353437'}`, color: activeExtensions.has(ext) ? activeColor : '#ffffff55' }}
              >{ext}</button>
            ))}
          </div>
        </div>

        {/* Arpeggio */}
        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">ARPEGGIO</div>
          <div className="flex flex-wrap gap-1">
            {(['off','up','down','up_down','random'] as ArpPattern[]).map(m => (
              <button key={m} onClick={() => setArpPattern(m)}
                className="flex-1 py-1 text-[7px] uppercase tracking-wider rounded cursor-pointer transition-all font-bold"
                style={{ background: arpPattern === m ? '#e9c34933' : '#252428', border: `1px solid ${arpPattern === m ? '#e9c349' : '#353437'}`, color: arpPattern === m ? '#e9c349' : '#ffffff44' }}
              >{m.replace('_', '-')}</button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button onClick={generateLine}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          style={{ background: `${activeColor}22`, border: `1px solid ${activeColor}44`, color: activeColor }}
        >AI GENERATE LINE</button>
        <button onClick={previewLine}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-purple/20 border border-purple/40 text-purple hover:bg-purple/30 transition-all"
        >PREVIEW LINE</button>
        <button onClick={() => setPlaying(p => !p)}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          style={{ background: playing ? '#ff333322' : '#252428', border: `1px solid ${playing ? '#ff3333' : '#353437'}`, color: playing ? '#ff3333' : '#ffffff55' }}
        >{playing ? '■ STOP' : '▶ PLAY'}</button>
        <button className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all">
          EXPORT MIDI
        </button>
      </div>
    </div>
  );
}

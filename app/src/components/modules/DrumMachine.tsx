'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { playDrumHit, loadTone } from '@/lib/audio';
import { Knob } from '@/components/ui/Knob';

const KIT_MODES = ['MINIMAL', 'STANDARD', 'TRAP', 'FULL'] as const;
type KitMode = typeof KIT_MODES[number];

interface KitPreset {
  name: string;
  color: string;
  pattern: Record<string, number[]>; // track name → active step indices
}

const KIT_PRESETS: KitPreset[] = [
  { name: '808 TRAP',        color: '#bf00ff', pattern: { '808 KICK': [0,4,10], SNARE: [4,12], CLAP: [4,12], 'HI-HAT': [0,2,4,6,8,10,12,14], 'HAT OPEN': [6,14] } },
  { name: 'DARK TRAP',       color: '#8b0000', pattern: { '808 KICK': [0,3,10,11], SNARE: [4,12], CLAP: [], 'HI-HAT': [0,2,4,6,8,10,12,14,15], 'HAT OPEN': [8] } },
  { name: 'GRIMEY BOOM BAP', color: '#8b5e00', pattern: { '808 KICK': [0,6], SNARE: [4,12], CLAP: [], 'HI-HAT': [2,6,10,14], 'HAT OPEN': [12], PERC: [1,9] } },
  { name: 'OLD SCHOOL BB',   color: '#c8860a', pattern: { '808 KICK': [0,6,11], SNARE: [4,12], CLAP: [4], 'HI-HAT': [0,4,8,12], 'HAT OPEN': [14] } },
  { name: 'NEW SCHOOL BB',   color: '#e9c349', pattern: { '808 KICK': [0,3,8], SNARE: [4,12], CLAP: [4,8,12], 'HI-HAT': [1,3,5,7,9,11,13,15], 'HAT OPEN': [6] } },
  { name: 'UK DRILL',        color: '#4a6650', pattern: { '808 KICK': [0,5,10,12], SNARE: [4,12], CLAP: [4], 'HI-HAT': [0,1,3,5,7,8,10,12,14], 'HAT OPEN': [11] } },
  { name: 'US DRILL',        color: '#7090b0', pattern: { '808 KICK': [0,4,9], SNARE: [4,12], CLAP: [], 'HI-HAT': [0,2,4,6,8,10,12,14], 'HAT OPEN': [7,15] } },
  { name: 'WEST COAST',      color: '#d4650a', pattern: { '808 KICK': [0,6,8], SNARE: [4,12], CLAP: [4,12], 'HI-HAT': [0,2,6,8,10,14], PERC: [3,7,11,15] } },
  { name: 'EAST COAST GRIT', color: '#888888', pattern: { '808 KICK': [0,3,11], SNARE: [4,12], CLAP: [], 'HI-HAT': [2,6,10,14], 'HAT OPEN': [6], PERC: [1,9,13] } },
  { name: 'VINTAGE VINYL',   color: '#76d6d5', pattern: { '808 KICK': [0,6], SNARE: [4,12], CLAP: [4,12], 'HI-HAT': [0,4,8,12], 'HAT OPEN': [], PERC: [2,10] } },
  { name: 'MINIMAL ELEC',    color: '#aaccdd', pattern: { '808 KICK': [0], SNARE: [8], CLAP: [], 'HI-HAT': [0,8], 'HAT OPEN': [] } },
  { name: 'LIVE DRUMS',      color: '#ff6b9d', pattern: { '808 KICK': [0,2,9], SNARE: [4,6,12], CLAP: [], 'HI-HAT': [0,2,4,6,8,10,12,14], PERC: [5,13] } },
  { name: 'HYBRID TRAP',     color: '#39ff14', pattern: { '808 KICK': [0,5,8,14], SNARE: [4,12], CLAP: [4,8,12], 'HI-HAT': [1,3,5,7,9,11,13,15], 'HAT OPEN': [6] } },
];

const KIT_TRACKS: Record<KitMode, string[]> = {
  MINIMAL:  ['808 KICK', 'SNARE', 'HI-HAT', 'HAT OPEN'],
  STANDARD: ['808 KICK', 'SNARE', 'CLAP', 'HI-HAT', 'HAT OPEN', 'PERC'],
  TRAP:     ['808 KICK', 'SNARE', 'CLAP', 'HI-HAT', 'HAT OPEN', 'PERC'],
  FULL:     ['808 KICK', 'SNARE', 'CLAP', 'HI-HAT', 'HAT OPEN', 'PERC'],
};

export function DrumMachine() {
  const { drumTracks, activeSection, bpm, toggleDrumStep, toggleDrumMute, drumSwing, setDrumSwing } = useProjectStore();
  const [kitMode, setKitMode] = useState<KitMode>('STANDARD');
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [tuneValues, setTuneValues] = useState<Record<string, number>>({});
  const [decayValues, setDecayValues] = useState<Record<string, number>>({});
  const [reverbValues, setReverbValues] = useState<Record<string, number>>({});
  const [probValues, setProbValues] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  const tracks = drumTracks[activeSection] || [];
  const visibleNames = KIT_TRACKS[kitMode];
  const visibleTracks = tracks.filter(t => visibleNames.includes(t.name));
  const visibleTracksRef = useRef(visibleTracks);
  visibleTracksRef.current = visibleTracks;

  const stopSequencer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPlaying(false);
    setCurrentStep(-1);
    stepRef.current = 0;
  }, []);

  const startSequencer = useCallback(async () => {
    await loadTone();
    const ms = (60 / bpm / 4) * 1000;
    stepRef.current = 0;
    intervalRef.current = setInterval(() => {
      const step = stepRef.current;
      setCurrentStep(step);
      visibleTracksRef.current.forEach(track => {
        const prob = probValues[track.name] ?? 100;
        if (!track.muted && track.steps[step]?.active && Math.random() * 100 < prob) {
          playDrumHit(track.name, track.steps[step].velocity);
        }
      });
      stepRef.current = (step + 1) % 16;
    }, ms);
    setPlaying(true);
  }, [bpm, probValues]);

  const togglePlay = useCallback(() => {
    if (playing) stopSequencer();
    else startSequencer();
  }, [playing, startSequencer, stopSequencer]);

  useEffect(() => {
    if (playing) { stopSequencer(); startSequencer(); }
  }, [bpm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const applyPreset = (preset: KitPreset) => {
    setSelectedPreset(preset.name);
    tracks.forEach((track, ti) => {
      const activePat = preset.pattern[track.name] || [];
      for (let si = 0; si < 16; si++) {
        const shouldBeActive = activePat.includes(si);
        if (track.steps[si]?.active !== shouldBeActive) {
          toggleDrumStep(activeSection, ti, si);
        }
      }
    });
  };

  const selTrack = visibleTracks.find(t => t.name === selectedTrack);

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden">
      {/* Main sequencer */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <SectionTabs />
          <div className="flex gap-1 ml-auto">
            {KIT_MODES.map(m => (
              <button key={m} onClick={() => setKitMode(m)}
                className="px-2 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
                style={{ background: kitMode === m ? '#bf00ff33' : '#252428', border: `1px solid ${kitMode === m ? '#bf00ff' : '#353437'}`, color: kitMode === m ? '#bf00ff' : '#ffffff55' }}
              >{m}</button>
            ))}
          </div>
          <button onClick={togglePlay}
            className="px-4 py-1.5 rounded font-black uppercase text-xs tracking-widest cursor-pointer transition-all"
            style={{ background: playing ? '#ff333322' : '#bf00ff22', border: `1px solid ${playing ? '#ff3333' : '#bf00ff'}`, color: playing ? '#ff3333' : '#bf00ff', boxShadow: playing ? '0 0 12px #ff333366' : '0 0 12px #bf00ff66' }}
          >{playing ? '■ STOP' : '▶ PLAY'}</button>
          <Knob value={drumSwing} min={0} max={100} label="SWING" color="#e9c349" onChange={setDrumSwing} size={42} />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {/* Bar markers */}
          <div className="flex ml-[120px] gap-1 mb-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="flex-1 text-center">
                {i % 4 === 0 && <span className="text-[8px] text-white/20">{i / 4 + 1}</span>}
              </div>
            ))}
          </div>

          {visibleTracks.map((track) => {
            const realIdx = tracks.findIndex(t => t.name === track.name);
            const prob = probValues[track.name] ?? 100;
            const isSelected = selectedTrack === track.name;
            return (
              <div key={track.name} className="flex items-center gap-2">
                <div className="w-[120px] shrink-0 flex items-center gap-1">
                  <button onClick={() => toggleDrumMute(activeSection, realIdx)}
                    className="w-5 h-5 rounded text-[8px] font-bold transition-all cursor-pointer"
                    style={{ background: track.muted ? '#ff333333' : '#25242833', border: `1px solid ${track.muted ? '#ff3333' : '#353437'}`, color: track.muted ? '#ff3333' : '#ffffff44' }}
                  >M</button>
                  <button onClick={() => setSelectedTrack(isSelected ? null : track.name)}
                    className="text-[9px] font-bold uppercase tracking-wider text-left flex-1 cursor-pointer hover:opacity-80 transition-opacity truncate"
                    style={{ color: isSelected ? '#fff' : track.color }}
                  >{track.name}</button>
                </div>

                <div className="flex-1 flex gap-1">
                  {track.steps.map((step, si) => {
                    const isBar = si % 4 === 0;
                    const isCurrent = currentStep === si && playing;
                    let bg = isBar ? '#2a2930' : '#1c1b1e';
                    if (isCurrent) bg = '#ffffff22';
                    if (step.active) bg = track.color;
                    return (
                      <button key={si}
                        onClick={() => toggleDrumStep(activeSection, realIdx, si)}
                        className="flex-1 h-8 rounded-sm transition-all duration-75 cursor-pointer"
                        style={{ background: bg, border: `1px solid ${step.active ? track.color : isBar ? '#353437' : '#252428'}`, boxShadow: step.active ? `0 0 6px ${track.color}88` : 'none', opacity: track.muted ? 0.3 : prob < 100 && step.active ? prob / 100 * 0.7 + 0.3 : 1 }}
                      />
                    );
                  })}
                </div>

                {/* Prob knob mini */}
                <div className="text-[7px] text-white/30 w-8 text-center">
                  <div className="font-mono">{prob}%</div>
                  <input type="range" min={0} max={100} value={prob}
                    onChange={e => setProbValues(p => ({ ...p, [track.name]: Number(e.target.value) }))}
                    className="w-8 h-1 cursor-pointer" style={{ accentColor: track.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sound design strip for selected track */}
        {selTrack && (
          <div className="shrink-0 bg-surface-low rounded-xl p-3 border" style={{ borderColor: `${selTrack.color}44` }}>
            <div className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{ color: selTrack.color }}>
              {selTrack.name} — SOUND DESIGN
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <Knob value={tuneValues[selTrack.name] ?? 0} min={-24} max={24} label="TUNE" color={selTrack.color} onChange={v => setTuneValues(p => ({ ...p, [selTrack.name]: v }))} size={38} />
              <Knob value={decayValues[selTrack.name] ?? 50} min={0} max={100} label="DECAY" color="#e9c349" onChange={v => setDecayValues(p => ({ ...p, [selTrack.name]: v }))} size={38} />
              <Knob value={reverbValues[selTrack.name] ?? 10} min={0} max={100} label="REVERB" color="#76d6d5" onChange={v => setReverbValues(p => ({ ...p, [selTrack.name]: v }))} size={38} />
              <button onClick={() => playDrumHit(selTrack.name, 100)}
                className="px-3 py-1 rounded text-[9px] font-bold uppercase cursor-pointer transition-all"
                style={{ background: `${selTrack.color}22`, border: `1px solid ${selTrack.color}44`, color: selTrack.color }}
              >▶ TEST</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0 pt-2 border-t border-white/5">
          <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-purple/10 border border-purple/30 text-purple hover:bg-purple/20 transition-all">AI GENERATE</button>
          <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20 transition-all">FILL</button>
          <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-surface-high border border-white/10 text-white/50 hover:bg-surface-high/80 transition-all">CLEAR</button>
          <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all ml-auto">EXPORT MIDI</button>
        </div>
      </div>

      {/* Kit browser */}
      <div className="w-44 shrink-0 flex flex-col gap-2">
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">KIT BROWSER</div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {KIT_PRESETS.map(preset => (
            <button key={preset.name}
              onClick={() => applyPreset(preset)}
              className="w-full px-2 py-2 rounded-lg text-left cursor-pointer transition-all"
              style={{ background: selectedPreset === preset.name ? `${preset.color}22` : '#1c1b1e', border: `1px solid ${selectedPreset === preset.name ? preset.color : '#353437'}`, boxShadow: selectedPreset === preset.name ? `0 0 8px ${preset.color}44` : 'none' }}
            >
              <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: preset.color }}>{preset.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

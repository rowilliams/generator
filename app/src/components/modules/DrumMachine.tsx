'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { playDrumHit, loadTone } from '@/lib/audio';
import { Knob } from '@/components/ui/Knob';

const KIT_MODES = ['MINIMAL', 'STANDARD', 'FULL', 'TRAP'] as const;
type KitMode = typeof KIT_MODES[number];

const MINIMAL_TRACKS = ['808 KICK', 'SNARE', 'HI-HAT', 'HAT OPEN'];
const STANDARD_TRACKS = ['808 KICK', 'SNARE', 'CLAP', 'HI-HAT', 'HAT OPEN', 'PERC'];
const ALL_TRACKS = ['808 KICK', 'SNARE', 'CLAP', 'HI-HAT', 'HAT OPEN', 'PERC'];

export function DrumMachine() {
  const { drumTracks, activeSection, bpm, toggleDrumStep, toggleDrumMute, drumSwing, setDrumSwing } = useProjectStore();
  const [kitMode, setKitMode] = useState<KitMode>('STANDARD');
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  const tracks = drumTracks[activeSection] || [];
  const visibleNames = kitMode === 'MINIMAL' ? MINIMAL_TRACKS : STANDARD_TRACKS;
  const visibleTracks = tracks.filter(t => visibleNames.includes(t.name));

  const stopSequencer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPlaying(false);
    setCurrentStep(-1);
    stepRef.current = 0;
  }, []);

  const visibleTracksRef = useRef(visibleTracks);
  visibleTracksRef.current = visibleTracks;

  const startSequencer = useCallback(async () => {
    await loadTone();
    const ms = (60 / bpm / 4) * 1000;
    stepRef.current = 0;
    intervalRef.current = setInterval(() => {
      const step = stepRef.current;
      setCurrentStep(step);
      visibleTracksRef.current.forEach(track => {
        if (!track.muted && track.steps[step]?.active) {
          playDrumHit(track.name, track.steps[step].velocity);
        }
      });
      stepRef.current = (step + 1) % 16;
    }, ms);
    setPlaying(true);
  }, [bpm]);

  const togglePlay = useCallback(() => {
    if (playing) stopSequencer();
    else startSequencer();
  }, [playing, startSequencer, stopSequencer]);

  // Restart when BPM changes
  useEffect(() => {
    if (playing) { stopSequencer(); startSequencer(); }
  }, [bpm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-hidden">
      {/* Top controls */}
      <div className="flex items-center gap-4 shrink-0">
        <SectionTabs />
        <div className="flex gap-1 ml-auto">
          {KIT_MODES.map(m => (
            <button key={m} onClick={() => setKitMode(m)}
              className="px-2 py-1 text-[9px] uppercase tracking-wider rounded font-bold cursor-pointer transition-all"
              style={{
                background: kitMode === m ? '#bf00ff33' : '#252428',
                border: `1px solid ${kitMode === m ? '#bf00ff' : '#353437'}`,
                color: kitMode === m ? '#bf00ff' : '#ffffff55',
              }}
            >{m}</button>
          ))}
        </div>
        <button
          onClick={togglePlay}
          className="px-4 py-1.5 rounded font-black uppercase text-xs tracking-widest cursor-pointer transition-all"
          style={{
            background: playing ? '#ff333322' : '#bf00ff22',
            border: `1px solid ${playing ? '#ff3333' : '#bf00ff'}`,
            color: playing ? '#ff3333' : '#bf00ff',
            boxShadow: playing ? '0 0 12px #ff333366' : '0 0 12px #bf00ff66',
          }}
        >
          {playing ? '■ STOP' : '▶ PLAY'}
        </button>
        <Knob value={drumSwing} min={0} max={100} label="SWING" color="#e9c349"
          onChange={setDrumSwing} size={42} />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {/* bar markers */}
        <div className="flex ml-[120px] gap-1 mb-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex-1 text-center">
              {i % 4 === 0 && (
                <span className="text-[8px] text-white/20">{i / 4 + 1}</span>
              )}
            </div>
          ))}
        </div>

        {visibleTracks.map((track) => {
          const realIdx = tracks.findIndex(t => t.name === track.name);
          return (
            <div key={track.name} className="flex items-center gap-2">
              <div className="w-[120px] shrink-0 flex items-center gap-2">
                <button
                  onClick={() => toggleDrumMute(activeSection, realIdx)}
                  className="w-5 h-5 rounded text-[8px] font-bold transition-all cursor-pointer"
                  style={{
                    background: track.muted ? '#ff333333' : '#25242833',
                    border: `1px solid ${track.muted ? '#ff3333' : '#353437'}`,
                    color: track.muted ? '#ff3333' : '#ffffff44',
                  }}
                >M</button>
                <button
                  onClick={() => playDrumHit(track.name, 100)}
                  className="text-[9px] font-bold uppercase tracking-wider text-left flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: track.color }}
                >
                  {track.name}
                </button>
              </div>

              <div className="flex-1 flex gap-1">
                {track.steps.map((step, si) => {
                  const isBar = si % 4 === 0;
                  const isCurrent = currentStep === si && playing;
                  let bg = isBar ? '#2a2930' : '#1c1b1e';
                  if (isCurrent) bg = '#ffffff22';
                  if (step.active) bg = track.color;
                  return (
                    <button
                      key={si}
                      onClick={() => toggleDrumStep(activeSection, realIdx, si)}
                      className="flex-1 h-8 rounded-sm transition-all duration-75 cursor-pointer"
                      style={{
                        background: bg,
                        border: `1px solid ${step.active ? track.color : isBar ? '#353437' : '#252428'}`,
                        boxShadow: step.active ? `0 0 8px ${track.color}88` : 'none',
                        opacity: track.muted ? 0.3 : 1,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 shrink-0 pt-2 border-t border-white/5">
        <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-purple/10 border border-purple/30 text-purple hover:bg-purple/20 transition-all">
          AI GENERATE
        </button>
        <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20 transition-all">
          FILL
        </button>
        <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-surface-high border border-white/10 text-white/50 hover:bg-surface-high/80 transition-all">
          CLEAR
        </button>
        <button className="px-3 py-1.5 text-xs rounded font-bold uppercase tracking-wider cursor-pointer bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all ml-auto">
          EXPORT MIDI
        </button>
      </div>
    </div>
  );
}

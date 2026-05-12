'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Section = 'intro' | 'verse' | 'prehook' | 'hook' | 'bridge' | 'outro';
export type Scale =
  | 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian'
  | 'pentatonic_minor' | 'pentatonic_major' | 'blues'
  | 'whole_tone' | 'diminished';

export type Vibe =
  | 'dark' | 'trap' | 'drill_us' | 'uk_drill'
  | 'boom_bap_old' | 'boom_bap_new' | 'dark_boom_bap'
  | 'west_coast' | 'east_coast' | 'grimey_boom_bap' | 'grimey_uk'
  | 'horror_cinematic' | 'haunting_minimal' | 'dark_ambient'
  | 'evil_orchestral' | 'grimey_supernatural';

export type Module =
  | 'vibe' | 'drums' | 'bass' | 'guitar' | 'melody'
  | 'chords' | 'synth' | 'orchestra' | 'vocal'
  | 'mixer' | 'sample' | 'export' | 'fusion' | 'timeline';

export interface StepState {
  active: boolean;
  velocity: number; // 0-127
}

export interface DrumTrack {
  name: string;
  color: string;
  steps: StepState[];
  muted: boolean;
  solo: boolean;
  volume: number;
}

export interface ChordSlot {
  root: string;
  type: string;
  inversion: number;
}

export interface ProjectStore {
  // Global context
  bpm: number;
  key: string;
  scale: Scale;
  vibe: Vibe;
  activeSection: Section;
  activeModule: Module;

  // Drum machine
  drumTracks: Record<Section, DrumTrack[]>;
  drumSteps: number;
  drumSwing: number;
  loopBars: 4 | 8 | 16;

  // Chord engine
  chordProgressions: Record<Section, ChordSlot[]>;

  // Actions
  setBpm: (bpm: number) => void;
  setKey: (key: string) => void;
  setScale: (scale: Scale) => void;
  setVibe: (vibe: Vibe) => void;
  setActiveSection: (section: Section) => void;
  setActiveModule: (module: Module) => void;
  toggleDrumStep: (section: Section, trackIdx: number, stepIdx: number) => void;
  setDrumVelocity: (section: Section, trackIdx: number, stepIdx: number, vel: number) => void;
  toggleDrumMute: (section: Section, trackIdx: number) => void;
  setDrumSwing: (swing: number) => void;
  setLoopBars: (bars: 4 | 8 | 16) => void;
  clearDrumSection: (section: Section) => void;
  setChordSlot: (section: Section, slotIdx: number, chord: ChordSlot) => void;
}

const SECTIONS: Section[] = ['intro', 'verse', 'prehook', 'hook', 'bridge', 'outro'];
const DRUM_STEPS = 256; // max capacity: 16 bars × 16 steps

const DEFAULT_TRACKS: DrumTrack[] = [
  { name: '808 KICK', color: '#ff3333', steps: Array(DRUM_STEPS).fill(null).map(() => ({ active: false, velocity: 100 })), muted: false, solo: false, volume: 100 },
  { name: 'SNARE',    color: '#ff6b1a', steps: Array(DRUM_STEPS).fill(null).map(() => ({ active: false, velocity: 90 })),  muted: false, solo: false, volume: 90  },
  { name: 'CLAP',     color: '#e9c349', steps: Array(DRUM_STEPS).fill(null).map(() => ({ active: false, velocity: 85 })),  muted: false, solo: false, volume: 85  },
  { name: 'HI-HAT',  color: '#76d6d5', steps: Array(DRUM_STEPS).fill(null).map(() => ({ active: false, velocity: 80 })),  muted: false, solo: false, volume: 80  },
  { name: 'HAT OPEN',color: '#76d6d5', steps: Array(DRUM_STEPS).fill(null).map(() => ({ active: false, velocity: 75 })),  muted: false, solo: false, volume: 75  },
  { name: 'PERC',    color: '#e9c349', steps: Array(DRUM_STEPS).fill(null).map(() => ({ active: false, velocity: 80 })),  muted: false, solo: false, volume: 80  },
];

function makeDefaultDrums(): Record<Section, DrumTrack[]> {
  return Object.fromEntries(
    SECTIONS.map(s => [s, DEFAULT_TRACKS.map(t => ({ ...t, steps: t.steps.map(st => ({ ...st })) }))])
  ) as Record<Section, DrumTrack[]>;
}

function makeDefaultChords(): Record<Section, ChordSlot[]> {
  return Object.fromEntries(
    SECTIONS.map(s => [s, [] as ChordSlot[]])
  ) as unknown as Record<Section, ChordSlot[]>;
}

export const useProjectStore = create<ProjectStore>()(persist((set) => ({
  bpm: 140,
  key: 'F#',
  scale: 'natural_minor',
  vibe: 'dark_boom_bap',
  activeSection: 'verse',
  activeModule: 'vibe',
  drumTracks: makeDefaultDrums(),
  drumSteps: DRUM_STEPS,
  drumSwing: 0,
  loopBars: 4,
  chordProgressions: makeDefaultChords(),

  setBpm: (bpm) => set({ bpm }),
  setKey: (key) => set({ key }),
  setScale: (scale) => set({ scale }),
  setVibe: (vibe) => set({ vibe }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setActiveModule: (activeModule) => set({ activeModule }),

  toggleDrumStep: (section, trackIdx, stepIdx) =>
    set((state) => {
      const tracks = state.drumTracks[section].map((t, ti) =>
        ti !== trackIdx ? t : {
          ...t,
          steps: t.steps.map((s, si) =>
            si !== stepIdx ? s : { ...s, active: !s.active }
          ),
        }
      );
      return { drumTracks: { ...state.drumTracks, [section]: tracks } };
    }),

  setDrumVelocity: (section, trackIdx, stepIdx, velocity) =>
    set((state) => {
      const tracks = state.drumTracks[section].map((t, ti) =>
        ti !== trackIdx ? t : {
          ...t,
          steps: t.steps.map((s, si) =>
            si !== stepIdx ? s : { ...s, velocity }
          ),
        }
      );
      return { drumTracks: { ...state.drumTracks, [section]: tracks } };
    }),

  toggleDrumMute: (section, trackIdx) =>
    set((state) => {
      const tracks = state.drumTracks[section].map((t, ti) =>
        ti !== trackIdx ? t : { ...t, muted: !t.muted }
      );
      return { drumTracks: { ...state.drumTracks, [section]: tracks } };
    }),

  setDrumSwing: (drumSwing) => set({ drumSwing }),
  setLoopBars: (loopBars) => set({ loopBars }),
  clearDrumSection: (section) => set((state) => {
    const tracks = state.drumTracks[section].map(t => ({ ...t, steps: t.steps.map(s => ({ ...s, active: false })) }));
    return { drumTracks: { ...state.drumTracks, [section]: tracks } };
  }),

  setChordSlot: (section, slotIdx, chord) =>
    set((state) => {
      const prog = [...(state.chordProgressions[section] || [])];
      prog[slotIdx] = chord;
      return { chordProgressions: { ...state.chordProgressions, [section]: prog } };
    }),
}), { name: 'neon-obsidian-v1' }));

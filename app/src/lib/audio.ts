'use client';

let toneLoaded = false;
let Tone: typeof import('tone') | null = null;
let sharedReverb: import('tone').Reverb | null = null;

export async function loadTone() {
  if (toneLoaded) return Tone;
  Tone = await import('tone');
  sharedReverb = new Tone.Reverb({ decay: 2.5, wet: 0.4 }).toDestination();
  toneLoaded = true;
  return Tone;
}

export async function startAudioContext() {
  const T = await loadTone();
  if (!T) return;
  await T.start();
}

export function isAudioReady() {
  return toneLoaded && Tone !== null;
}

export async function playDrumHit(instrument: string, velocity = 100) {
  const T = await loadTone();
  if (!T) return;
  await T.start();

  const vol = (velocity / 127) * 0 - (1 - velocity / 127) * 20; // dBFS

  switch (instrument) {
    case '808 KICK': {
      const synth = new T.MembraneSynth({
        pitchDecay: 0.15, octaves: 6, volume: vol,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
      }).toDestination();
      synth.triggerAttackRelease('C1', '8n');
      setTimeout(() => synth.dispose(), 1000);
      break;
    }
    case 'SNARE': {
      const noise = new T.NoiseSynth({
        noise: { type: 'white' }, volume: vol - 4,
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
      }).toDestination();
      noise.triggerAttackRelease('16n');
      setTimeout(() => noise.dispose(), 500);
      break;
    }
    case 'CLAP': {
      const noise = new T.NoiseSynth({
        noise: { type: 'pink' }, volume: vol - 6,
        envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.02 },
      }).toDestination();
      noise.triggerAttackRelease('32n');
      setTimeout(() => noise.dispose(), 300);
      break;
    }
    case 'HI-HAT': {
      const metal = new T.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
        harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
        volume: vol - 8,
      }).toDestination();
      metal.frequency.value = 400;
      metal.triggerAttackRelease('32n', T.now());
      setTimeout(() => metal.dispose(), 300);
      break;
    }
    case 'HAT OPEN': {
      const metal = new T.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
        harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
        volume: vol - 10,
      }).toDestination();
      metal.frequency.value = 300;
      metal.triggerAttackRelease('8n', T.now());
      setTimeout(() => metal.dispose(), 800);
      break;
    }
    case 'PERC': {
      const synth = new T.MembraneSynth({
        pitchDecay: 0.05, octaves: 4, volume: vol - 6,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
      }).toDestination();
      synth.triggerAttackRelease('G2', '16n');
      setTimeout(() => synth.dispose(), 400);
      break;
    }
  }
}

export async function playNote(note: string, duration = '8n', instrument = 'pad') {
  const T = await loadTone();
  if (!T) return;
  await T.start();

  const reverb = sharedReverb!;

  if (instrument === 'pad') {
    const synth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 1.5 },
      volume: -12,
    }).connect(reverb);
    synth.triggerAttackRelease(note, duration);
    setTimeout(() => synth.dispose(), 4000);
  } else {
    const synth = new T.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.8 },
      volume: -10,
    }).connect(reverb);
    synth.triggerAttackRelease(note, duration);
    setTimeout(() => synth.dispose(), 2000);
  }
}

export const SCALES: Record<string, number[]> = {
  major:           [0, 2, 4, 5, 7, 9, 11],
  natural_minor:   [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor:  [0, 2, 3, 5, 7, 8, 11],
  melodic_minor:   [0, 2, 3, 5, 7, 9, 11],
  dorian:          [0, 2, 3, 5, 7, 9, 10],
  phrygian:        [0, 1, 3, 5, 7, 8, 10],
  lydian:          [0, 2, 4, 6, 7, 9, 11],
  mixolydian:      [0, 2, 4, 5, 7, 9, 10],
  locrian:         [0, 1, 3, 5, 6, 8, 10],
  pentatonic_minor:[0, 3, 5, 7, 10],
  pentatonic_major:[0, 2, 4, 7, 9],
  blues:           [0, 3, 5, 6, 7, 10],
  whole_tone:      [0, 2, 4, 6, 8, 10],
  diminished:      [0, 2, 3, 5, 6, 8, 9, 11],
};

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getScaleNotes(rootNote: string, scale: string, octave = 4): string[] {
  const rootIdx = NOTES.indexOf(rootNote);
  if (rootIdx === -1) return [];
  const intervals = SCALES[scale] || SCALES.natural_minor;
  return intervals.map(interval => {
    const noteIdx = (rootIdx + interval) % 12;
    const oct = octave + Math.floor((rootIdx + interval) / 12);
    return `${NOTES[noteIdx]}${oct}`;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { writeMidi } from 'midi-file';

const DRUM_NOTES: Record<string, number> = {
  '808 KICK': 36, SNARE: 38, CLAP: 39, 'HI-HAT': 42, 'HAT OPEN': 46, PERC: 75,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function pitchToMidi(pitch: string): number {
  const m = pitch.match(/^([A-G]#?)(\d)$/);
  if (!m) return 60;
  return (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(m[1]);
}

function download(bytes: number[], filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type RawEvent = { tick: number; on: boolean; note: number; velocity: number; channel: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMidiTrack(events: RawEvent[], bpm: number, ticksPerBeat: number): any[] {
  events.sort((a, b) => a.tick - b.tick || (a.on ? 1 : -1));
  const track: object[] = [
    { deltaTime: 0, meta: true, type: 'setTempo', microsecondsPerBeat: Math.round(60_000_000 / bpm) },
  ];
  let lastTick = 0;
  for (const ev of events) {
    track.push({
      deltaTime: ev.tick - lastTick,
      channel: ev.channel,
      type: ev.on ? 'noteOn' : 'noteOff',
      noteNumber: ev.note,
      velocity: ev.velocity,
    });
    lastTick = ev.tick;
  }
  track.push({ deltaTime: 0, meta: true, type: 'endOfTrack' });
  return track;
}

export function exportDrumMidi(
  tracks: { name: string; steps: { active: boolean; velocity: number }[]; muted: boolean }[],
  bpm: number,
  totalSteps: number,
) {
  const TPB = 480;
  const TPS = TPB / 4; // ticks per 16th-note step
  const events: RawEvent[] = [];

  for (const track of tracks) {
    if (track.muted) continue;
    const note = DRUM_NOTES[track.name] ?? 38;
    for (let si = 0; si < totalSteps; si++) {
      if (track.steps[si]?.active) {
        events.push({ tick: si * TPS, on: true, note, velocity: track.steps[si].velocity, channel: 9 });
        events.push({ tick: si * TPS + TPS / 2, on: false, note, velocity: 0, channel: 9 });
      }
    }
  }

  download(writeMidi({ header: { format: 0, numTracks: 1, ticksPerBeat: TPB }, tracks: [toMidiTrack(events, bpm, TPB)] }), 'drums.mid');
}

export function exportNotesMidi(
  notes: { pitch: string; step: number; length: number; velocity: number }[],
  bpm: number,
  filename = 'melody.mid',
) {
  const TPB = 480;
  const TPS = TPB / 4;
  const events: RawEvent[] = notes.flatMap(n => [
    { tick: n.step * TPS, on: true, note: pitchToMidi(n.pitch), velocity: n.velocity, channel: 0 },
    { tick: (n.step + n.length) * TPS, on: false, note: pitchToMidi(n.pitch), velocity: 0, channel: 0 },
  ]);
  download(writeMidi({ header: { format: 0, numTracks: 1, ticksPerBeat: TPB }, tracks: [toMidiTrack(events, bpm, TPB)] }), filename);
}

export function exportChordsMidi(
  chords: { root: string; type: string }[],
  bpm: number,
) {
  const TPB = 480;
  const TPS = TPB * 2; // 2 beats per chord slot
  const typeIntervals: Record<string, number[]> = {
    min: [0, 3, 7], maj: [0, 4, 7], dim: [0, 3, 6], aug: [0, 4, 8],
    sus2: [0, 2, 7], sus4: [0, 5, 7], dom7: [0, 4, 7, 10], maj7: [0, 4, 7, 11],
    min7: [0, 3, 7, 10], min9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14], add9: [0, 4, 7, 14],
  };
  const events: RawEvent[] = [];

  chords.forEach((chord, ci) => {
    const root = pitchToMidi(`${chord.root}3`);
    const intervals = typeIntervals[chord.type] ?? typeIntervals.min;
    for (const iv of intervals) {
      events.push({ tick: ci * TPS, on: true, note: root + iv, velocity: 90, channel: 0 });
      events.push({ tick: ci * TPS + TPS - 10, on: false, note: root + iv, velocity: 0, channel: 0 });
    }
  });

  download(writeMidi({ header: { format: 0, numTracks: 1, ticksPerBeat: TPB }, tracks: [toMidiTrack(events, bpm, TPB)] }), 'chords.mid');
}

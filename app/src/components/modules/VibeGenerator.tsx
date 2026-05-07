'use client';
import { useState } from 'react';
import { useProjectStore, Vibe, Scale } from '@/store/projectStore';

interface VibeConfig {
  id: Vibe;
  label: string;
  color: string;
  tags: string[];
  bpm: string;
  scale: Scale;
  key: string;
  darkness: number;
  energy: number;
  grit: number;
  swing: number;
  cinematic: number;
  melodyDensity: number;
  bassWeight: number;
  atmosphere: number;
}

const VIBES: VibeConfig[] = [
  { id: 'dark',             label: 'DARK',               color: '#8b0000', tags: ['Sinister','Cinematic','Heavy'],     bpm: '70–100',   scale: 'phrygian',        key: 'C',  darkness:95, energy:40, grit:60, swing:20, cinematic:70, melodyDensity:30, bassWeight:75, atmosphere:80 },
  { id: 'trap',             label: 'TRAP',               color: '#bf00ff', tags: ['Hard','Modern','Street'],           bpm: '130–145',  scale: 'natural_minor',   key: 'F#', darkness:65, energy:80, grit:55, swing:10, cinematic:20, melodyDensity:50, bassWeight:90, atmosphere:35 },
  { id: 'drill_us',         label: 'DRILL (US)',         color: '#7090b0', tags: ['Menacing','Cold','Urban'],          bpm: '140–145',  scale: 'natural_minor',   key: 'D#', darkness:75, energy:75, grit:70, swing:5,  cinematic:30, melodyDensity:40, bassWeight:85, atmosphere:40 },
  { id: 'uk_drill',         label: 'UK DRILL',           color: '#4a6650', tags: ['Cold','Gritty','Roads'],            bpm: '140–145',  scale: 'natural_minor',   key: 'G',  darkness:80, energy:70, grit:80, swing:5,  cinematic:25, melodyDensity:35, bassWeight:80, atmosphere:45 },
  { id: 'boom_bap_old',     label: 'BOOM BAP (OLD)',     color: '#c8860a', tags: ['Classic','Golden Era','Soulful'],  bpm: '85–95',    scale: 'natural_minor',   key: 'A',  darkness:40, energy:60, grit:50, swing:65, cinematic:10, melodyDensity:65, bassWeight:60, atmosphere:30 },
  { id: 'boom_bap_new',     label: 'BOOM BAP (NEW)',     color: '#e9c349', tags: ['Fresh','Elevated','Modern'],        bpm: '90–100',   scale: 'natural_minor',   key: 'D',  darkness:45, energy:65, grit:40, swing:45, cinematic:15, melodyDensity:60, bassWeight:65, atmosphere:35 },
  { id: 'dark_boom_bap',    label: 'DARK BOOM BAP',      color: '#6b0000', tags: ['Grimy','Dark','Haunting'],          bpm: '80–95',    scale: 'harmonic_minor',  key: 'F#', darkness:85, energy:55, grit:70, swing:50, cinematic:50, melodyDensity:45, bassWeight:70, atmosphere:65 },
  { id: 'west_coast',       label: 'WEST COAST',         color: '#d4650a', tags: ['G-Funk','Laid Back','West'],        bpm: '90–100',   scale: 'pentatonic_minor',key: 'G',  darkness:35, energy:60, grit:30, swing:40, cinematic:15, melodyDensity:70, bassWeight:55, atmosphere:40 },
  { id: 'east_coast',       label: 'EAST COAST',         color: '#7090b0', tags: ['Raw','Jazz-Influenced','NY'],       bpm: '90–100',   scale: 'dorian',          key: 'D',  darkness:55, energy:70, grit:65, swing:55, cinematic:20, melodyDensity:60, bassWeight:60, atmosphere:30 },
  { id: 'grimey_boom_bap',  label: 'GRIMEY BOOM BAP',    color: '#8b5e00', tags: ['Underground','Raw','Dusty'],        bpm: '85–95',    scale: 'natural_minor',   key: 'B',  darkness:70, energy:65, grit:90, swing:60, cinematic:15, melodyDensity:50, bassWeight:65, atmosphere:35 },
  { id: 'grimey_uk',        label: 'GRIMEY UK',          color: '#556b2f', tags: ['Roads','Grime','Raw'],              bpm: '138–145',  scale: 'phrygian',        key: 'A#', darkness:75, energy:75, grit:90, swing:10, cinematic:20, melodyDensity:40, bassWeight:75, atmosphere:40 },
  { id: 'horror_cinematic', label: 'HORROR CINEMATIC',   color: '#cc0000', tags: ['Terror','Cinematic','Orchestral'],  bpm: '60–90',    scale: 'diminished',      key: 'C',  darkness:99, energy:50, grit:40, swing:10, cinematic:99, melodyDensity:55, bassWeight:50, atmosphere:95 },
  { id: 'haunting_minimal', label: 'HAUNTING MINIMAL',   color: '#aaccdd', tags: ['Sparse','Ghostly','Atmospheric'],   bpm: '50–75',    scale: 'lydian',          key: 'E',  darkness:80, energy:15, grit:10, swing:5,  cinematic:90, melodyDensity:20, bassWeight:25, atmosphere:98 },
  { id: 'dark_ambient',     label: 'DARK AMBIENT',       color: '#1a4444', tags: ['Drone','Textural','Tension'],       bpm: '0–70',     scale: 'whole_tone',      key: 'F',  darkness:90, energy:10, grit:20, swing:0,  cinematic:85, melodyDensity:15, bassWeight:30, atmosphere:99 },
  { id: 'evil_orchestral',  label: 'EVIL ORCHESTRAL',    color: '#8b0020', tags: ['Cinematic','Orchestral','Trap'],    bpm: '120–145',  scale: 'harmonic_minor',  key: 'D',  darkness:95, energy:80, grit:45, swing:15, cinematic:98, melodyDensity:70, bassWeight:65, atmosphere:90 },
  { id: 'grimey_supernatural', label: 'GRIMEY SUPERNATURAL', color: '#3a6b00', tags: ['Horror','Grime','Street'],     bpm: '138–145',  scale: 'diminished',      key: 'G#', darkness:88, energy:72, grit:85, swing:8,  cinematic:75, melodyDensity:45, bassWeight:80, atmosphere:70 },
];

function RadarBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-wider text-white/40 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}88` }}
        />
      </div>
      <span className="text-[9px] font-mono text-white/50 w-6 text-right">{value}</span>
    </div>
  );
}

const OVERRIDE_TEXTURES = ['VINYL GRAIN', 'TAPE HISS', 'ROOM REVERB', 'HALL', 'CATHEDRAL', 'VOID', 'NONE'];
const SAMPLE_CHARS = ['CLEAN', 'LO-FI', 'DUSTY', 'CHOPPED', 'GLITCHY', 'SATURATED'];
const SPACE_TYPES = ['DRY', 'ROOM', 'CHAMBER', 'PLATE', 'HALL', 'INFINITE'];

export function VibeGenerator() {
  const { vibe, setVibe, setBpm, setKey, setScale } = useProjectStore();
  const [blendMode, setBlendMode] = useState(false);
  const [blendTarget, setBlendTarget] = useState<Vibe | null>(null);
  const [texture, setTexture] = useState('NONE');
  const [sampleChar, setSampleChar] = useState('CLEAN');
  const [space, setSpace] = useState('ROOM');

  const active = VIBES.find(v => v.id === vibe) || VIBES[0];

  const selectVibe = (v: VibeConfig) => {
    if (blendMode) { setBlendTarget(v.id); return; }
    setVibe(v.id);
    const parts = v.bpm.split('–').map(Number);
    const mid = parts.length === 2 ? Math.round((parts[0] + parts[1]) / 2) : parts[0];
    if (mid) setBpm(mid);
    setKey(v.key);
    setScale(v.scale);
  };

  const blendActive = blendTarget ? VIBES.find(v => v.id === blendTarget) : null;

  return (
    <div className="flex gap-4 h-full p-4 overflow-hidden">
      {/* Vibe grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">STREET VIBES</div>
          <button onClick={() => { setBlendMode(b => !b); setBlendTarget(null); }}
            className="ml-auto px-3 py-1 text-[9px] uppercase tracking-wider rounded font-black cursor-pointer transition-all"
            style={{ background: blendMode ? '#e9c34922' : '#252428', border: `1px solid ${blendMode ? '#e9c349' : '#353437'}`, color: blendMode ? '#e9c349' : '#ffffff44' }}>
            ⊛ BLEND VIBES {blendMode ? 'ON' : 'OFF'}
          </button>
        </div>
        {blendMode && (
          <div className="mb-3 p-2 rounded-lg text-[8px]"
            style={{ background: '#e9c34911', border: '1px solid #e9c34933', color: '#e9c349' }}>
            Select A: <strong>{active.label}</strong> · Select B: {blendActive ? <strong>{blendActive.label}</strong> : 'click a vibe below'}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {VIBES.slice(0, 11).map(v => (
            <VibeCard key={v.id} config={v}
              active={vibe === v.id}
              blendTarget={blendTarget === v.id}
              onClick={() => selectVibe(v)} />
          ))}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">CINEMATIC & DARK</div>
        <div className="grid grid-cols-3 gap-2">
          {VIBES.slice(11).map(v => (
            <VibeCard key={v.id} config={v}
              active={vibe === v.id}
              blendTarget={blendTarget === v.id}
              onClick={() => selectVibe(v)} />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* DNA panel */}
        <div className="bg-surface-low rounded-xl p-4">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">ACTIVE VIBE</div>
          <div className="text-base font-black uppercase tracking-wider mb-1" style={{ color: active.color }}>
            {active.label}
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {active.tags.map(t => (
              <span key={t} className="text-[8px] uppercase px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: `${active.color}22`, color: active.color, border: `1px solid ${active.color}44` }}>
                {t}
              </span>
            ))}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">VIBE DNA</div>
          <div className="flex flex-col gap-1.5">
            <RadarBar label="DARKNESS"       value={active.darkness}      color={active.color} />
            <RadarBar label="ENERGY"         value={active.energy}        color={active.color} />
            <RadarBar label="SWING"          value={active.swing}         color={active.color} />
            <RadarBar label="MELODY DENSITY" value={active.melodyDensity} color={active.color} />
            <RadarBar label="BASS WEIGHT"    value={active.bassWeight}    color={active.color} />
            <RadarBar label="GRIT"           value={active.grit}          color={active.color} />
            <RadarBar label="ATMOSPHERE"     value={active.atmosphere}    color={active.color} />
            <RadarBar label="CINEMATIC"      value={active.cinematic}     color={active.color} />
          </div>
        </div>

        {/* Auto-set */}
        <div className="bg-surface-low rounded-xl p-4">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">AUTO-SET</div>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/40">BPM</span>
              <span className="text-gold font-mono font-bold">{active.bpm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">KEY</span>
              <span className="text-teal font-bold">{active.key}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">SCALE</span>
              <span className="text-purple font-bold text-right">{active.scale.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Overrides */}
        <div className="bg-surface-low rounded-xl p-4">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">OVERRIDES</div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-[8px] uppercase text-white/30 mb-1.5">TEXTURE</div>
              <div className="flex flex-wrap gap-1">
                {OVERRIDE_TEXTURES.map(t => (
                  <button key={t} onClick={() => setTexture(t)}
                    className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase cursor-pointer transition-all"
                    style={{ background: texture === t ? '#76d6d522' : '#252428', border: `1px solid ${texture === t ? '#76d6d5' : '#353437'}`, color: texture === t ? '#76d6d5' : '#ffffff44' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[8px] uppercase text-white/30 mb-1.5">SAMPLE CHARACTER</div>
              <div className="flex flex-wrap gap-1">
                {SAMPLE_CHARS.map(s => (
                  <button key={s} onClick={() => setSampleChar(s)}
                    className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase cursor-pointer transition-all"
                    style={{ background: sampleChar === s ? '#e9c34922' : '#252428', border: `1px solid ${sampleChar === s ? '#e9c349' : '#353437'}`, color: sampleChar === s ? '#e9c349' : '#ffffff44' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[8px] uppercase text-white/30 mb-1.5">SPACE</div>
              <div className="flex flex-wrap gap-1">
                {SPACE_TYPES.map(s => (
                  <button key={s} onClick={() => setSpace(s)}
                    className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase cursor-pointer transition-all"
                    style={{ background: space === s ? '#bf00ff22' : '#252428', border: `1px solid ${space === s ? '#bf00ff' : '#353437'}`, color: space === s ? '#bf00ff' : '#ffffff44' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => selectVibe(active)}
          className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all cursor-pointer shrink-0"
          style={{ background: active.color, boxShadow: `0 0 20px ${active.color}88`, color: '#0a0a0c' }}
        >
          APPLY VIBE
        </button>
      </div>
    </div>
  );
}

function VibeCard({ config, active, blendTarget, onClick }: { config: VibeConfig; active: boolean; blendTarget?: boolean; onClick: () => void }) {
  const ring = blendTarget ? '#e9c349' : active ? config.color : '#353437';
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-3 text-left transition-all duration-150 cursor-pointer"
      style={{
        background: active ? `${config.color}22` : blendTarget ? '#e9c34911' : '#1c1b1e',
        border: `1px solid ${ring}`,
        boxShadow: (active || blendTarget) ? `0 0 14px ${ring}55` : 'none',
      }}
    >
      <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: config.color }}>
        {config.label}
      </div>
      <div className="text-[8px] text-white/40">{config.bpm} BPM</div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {config.tags.slice(0, 2).map(t => (
          <span key={t} className="text-[7px] uppercase px-1 py-0.5 rounded"
            style={{ background: `${config.color}18`, color: config.color }}>
            {t}
          </span>
        ))}
      </div>
    </button>
  );
}

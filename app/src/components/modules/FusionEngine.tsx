'use client';
import { useState } from 'react';

interface Producer {
  name: string;
  era: string;
  color: string;
  tags: string[];
  bpm: string;
  darkness: number;
  energy: number;
  grit: number;
}

const PRODUCERS: Producer[] = [
  { name: 'METRO BOOMIN',   era: '2010s–NOW',  color: '#bf00ff', tags: ['Trap','Cinematic','Hard'],       bpm: '130–145', darkness:80, energy:85, grit:60 },
  { name: 'KANYE WEST',     era: '2000s–NOW',  color: '#e9c349', tags: ['Soul','Experimental','Epic'],    bpm: '85–130',  darkness:40, energy:90, grit:30 },
  { name: 'DR. DRE',        era: '1990s–2010s',color: '#76d6d5', tags: ['G-Funk','West','Crispy'],        bpm: '90–100',  darkness:50, energy:80, grit:50 },
  { name: 'THE ALCHEMIST',  era: '2000s–NOW',  color: '#8b5e00', tags: ['Gritty','Boom Bap','Dark'],      bpm: '80–95',   darkness:75, energy:60, grit:85 },
  { name: 'MADLIB',         era: '2000s–NOW',  color: '#556b2f', tags: ['Jazz','Crate','Abstract'],       bpm: '75–95',   darkness:55, energy:55, grit:65 },
  { name: 'DJ PREMIER',     era: '1990s–NOW',  color: '#7090b0', tags: ['Classic','NY','Scratches'],      bpm: '85–100',  darkness:60, energy:70, grit:80 },
  { name: 'RZA',            era: '1990s–2010s',color: '#cc0000', tags: ['Wu-Tang','Cinematic','Grimy'],   bpm: '80–95',   darkness:85, energy:65, grit:90 },
  { name: 'HAVOC',          era: '1990s–2010s',color: '#4a6650', tags: ['Queens','Dark','Hard'],          bpm: '85–95',   darkness:80, energy:65, grit:85 },
  { name: 'SCOTT STORCH',   era: '2000s–2010s',color: '#d4650a', tags: ['Piano','Pop-Rap','Melodic'],     bpm: '90–110',  darkness:30, energy:85, grit:25 },
  { name: 'J DILLA',        era: '1990s–2000s',color: '#c8860a', tags: ['Soulful','Off-Grid','Warm'],     bpm: '75–95',   darkness:35, energy:65, grit:55 },
  { name: 'PETE ROCK',      era: '1990s–NOW',  color: '#c8860a', tags: ['Soul Samples','Classic','NY'],  bpm: '85–100',  darkness:40, energy:70, grit:60 },
  { name: 'TIMBALAND',      era: '1990s–2010s',color: '#7090b0', tags: ['Rhythmic','Pop','Complex'],      bpm: '95–120',  darkness:20, energy:90, grit:20 },
  { name: 'PHARRELL',       era: '2000s–NOW',  color: '#39ff14', tags: ['Groovy','Fun','Unique'],         bpm: '100–130', darkness:10, energy:95, grit:15 },
  { name: 'JUST BLAZE',     era: '2000s–NOW',  color: '#e9c349', tags: ['Horns','Anthemic','Hip-Hop'],    bpm: '85–100',  darkness:35, energy:85, grit:40 },
  { name: 'MANNIE FRESH',   era: '1990s–2000s',color: '#bf00ff', tags: ['Cash Money','Southern','Bounce'],bpm: '95–110',  darkness:30, energy:90, grit:45 },
  { name: 'LEX LUGER',      era: '2010s',      color: '#7090b0', tags: ['Trap','808s','Dark'],            bpm: '130–145', darkness:75, energy:80, grit:60 },
  { name: 'YOUNG CHOP',     era: '2010s',      color: '#39ff14', tags: ['Chicago','Drill','Hard'],        bpm: '135–145', darkness:70, energy:80, grit:75 },
  { name: 'WHEEZY',         era: '2010s–NOW',  color: '#bf00ff', tags: ['Melodic Trap','Smooth','Modern'],bpm: '130–145', darkness:55, energy:80, grit:45 },
  { name: "PI'ERRE BOURNE", era: '2010s–NOW',  color: '#ff6b9d', tags: ['SoundCloud','Anime','Quirky'],   bpm: '130–145', darkness:50, energy:85, grit:40 },
  { name: 'SOUTHSIDE',      era: '2010s–NOW',  color: '#cc0000', tags: ['808 Mafia','Dark','Basses'],     bpm: '130–145', darkness:80, energy:80, grit:70 },
  { name: 'HIT-BOY',        era: '2010s–NOW',  color: '#e9c349', tags: ['Polished','Samples','Fire'],     bpm: '90–140',  darkness:40, energy:85, grit:35 },
  { name: 'MUSTARD',        era: '2010s–NOW',  color: '#d4650a', tags: ['West','Melodic','Club'],         bpm: '95–115',  darkness:25, energy:88, grit:20 },
  { name: 'BOI-1DA',        era: '2010s–NOW',  color: '#4a6650', tags: ['Dark','Introspective','Layered'],bpm: '85–130',  darkness:70, energy:75, grit:50 },
  { name: 'MURDA BEATZ',    era: '2010s–NOW',  color: '#ff6b1a', tags: ['Dancehall','Afro','Energetic'],  bpm: '95–115',  darkness:30, energy:92, grit:30 },
  { name: "NO I.D.",        era: '1990s–NOW',  color: '#7090b0', tags: ['Chi','Soulful','Sample-Based'],  bpm: '80–95',   darkness:45, energy:65, grit:55 },
  { name: 'SWIZZ BEATZ',    era: '2000s–NOW',  color: '#bf00ff', tags: ['NY','Anthemic','Live'],          bpm: '90–110',  darkness:35, energy:90, grit:40 },
  { name: 'NICK MIRA',      era: '2010s–NOW',  color: '#76d6d5', tags: ['Melodic','SoundCloud','Emotional'],bpm:'125–145', darkness:55, energy:82, grit:35 },
  { name: 'INTERNET MONEY', era: '2010s–NOW',  color: '#76d6d5', tags: ['Melodic Trap','Collaborative','Modern'],bpm:'130–145',darkness:50,energy:85,grit:38},
];

const TEXTURES = [
  { name: 'HORROR CINEMATIC', color: '#cc0000' },
  { name: 'HAUNTING MINIMAL', color: '#aaccdd' },
  { name: 'DARK AMBIENT',     color: '#1a4444' },
  { name: 'EVIL ORCHESTRAL',  color: '#8b0020' },
  { name: 'GRIMEY SUPER',     color: '#3a6b00' },
  { name: 'DARK',             color: '#6b0000' },
  { name: 'MINIMAL',          color: '#555566' },
  { name: 'EERIE',            color: '#4b3060' },
  { name: 'PARANOID',         color: '#5a4020' },
  { name: 'SPIRITUAL',        color: '#b08040' },
  { name: 'NOSTALGIC',        color: '#c8860a' },
  { name: 'AGGRESSIVE',       color: '#ff3333' },
  { name: 'EUPHORIC',         color: '#ff6b9d' },
  { name: 'MELANCHOLIC',      color: '#7090b0' },
  { name: 'HYPNOTIC',         color: '#bf00ff' },
];

type Tab = 'styles' | 'fusion';

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] uppercase tracking-wider text-white/30 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-surface-high rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 4px ${color}88` }} />
      </div>
    </div>
  );
}

function ProducerCard({ p, active, onClick }: { p: Producer; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg p-2.5 text-left transition-all cursor-pointer"
      style={{ background: active ? `${p.color}22` : '#1c1b1e', border: `1px solid ${active ? p.color : '#353437'}`, boxShadow: active ? `0 0 10px ${p.color}44` : 'none' }}>
      <div className="text-[9px] font-black uppercase tracking-wider leading-tight mb-0.5" style={{ color: p.color }}>{p.name}</div>
      <div className="text-[7px] text-white/30 mb-1">{p.era}</div>
      <div className="flex flex-wrap gap-0.5">
        {p.tags.slice(0, 2).map(t => (
          <span key={t} className="text-[6px] uppercase px-1 py-0.5 rounded"
            style={{ background: `${p.color}18`, color: p.color }}>{t}</span>
        ))}
      </div>
    </button>
  );
}

export function FusionEngine() {
  const [tab, setTab] = useState<Tab>('styles');
  const [selectedA, setSelectedA] = useState<Producer>(PRODUCERS[0]);
  const [selectedB, setSelectedB] = useState<Producer>(PRODUCERS[9]);
  const [texture, setTexture] = useState<string | null>(null);
  const [blendAB, setBlendAB] = useState(50);
  const [intensity, setIntensity] = useState(40);
  const [focusSlot, setFocusSlot] = useState<'A' | 'B'>('A');
  const [browsing, setBrowsing] = useState<Producer | null>(PRODUCERS[0]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5 shrink-0">
        {(['styles', 'fusion'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-1 text-[9px] uppercase tracking-widest rounded font-black cursor-pointer transition-all"
            style={{ background: tab === t ? '#e9c34922' : '#252428', border: `1px solid ${tab === t ? '#e9c349' : '#353437'}`, color: tab === t ? '#e9c349' : '#ffffff44' }}>
            {t === 'styles' ? 'PRODUCER STYLES' : 'HYBRID FUSION'}
          </button>
        ))}
      </div>

      {tab === 'styles' ? (
        <div className="flex gap-3 flex-1 overflow-hidden p-4">
          {/* Producer grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {PRODUCERS.map(p => (
                <ProducerCard key={p.name} p={p} active={browsing?.name === p.name}
                  onClick={() => setBrowsing(p)} />
              ))}
            </div>
          </div>

          {/* Style panel */}
          {browsing && (
            <div className="w-56 shrink-0 flex flex-col gap-3">
              <div className="bg-surface-low rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-white/30">PRODUCER</div>
                  <div className="text-base font-black uppercase tracking-wide mt-0.5" style={{ color: browsing.color }}>{browsing.name}</div>
                  <div className="text-[8px] text-white/30 mt-0.5">{browsing.era} · {browsing.bpm} BPM</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {browsing.tags.map(t => (
                    <span key={t} className="text-[7px] uppercase px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: `${browsing.color}22`, color: browsing.color, border: `1px solid ${browsing.color}44` }}>{t}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <StatBar label="DARKNESS" value={browsing.darkness} color={browsing.color} />
                  <StatBar label="ENERGY"   value={browsing.energy}   color={browsing.color} />
                  <StatBar label="GRIT"     value={browsing.grit}     color={browsing.color} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => { setSelectedA(browsing); setTab('fusion'); }}
                  className="w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                  style={{ background: '#bf00ff22', border: '1px solid #bf00ff44', color: '#bf00ff' }}>
                  SET AS BLEND A
                </button>
                <button onClick={() => { setSelectedB(browsing); setTab('fusion'); }}
                  className="w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                  style={{ background: '#e9c34922', border: '1px solid #e9c34944', color: '#e9c349' }}>
                  SET AS BLEND B
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-3 flex-1 overflow-hidden p-4">
          {/* Blend panel */}
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* A/B producer selectors */}
            <div className="flex gap-3 shrink-0">
              {[{ slot: 'A' as const, prod: selectedA, color: '#bf00ff' }, { slot: 'B' as const, prod: selectedB, color: '#e9c349' }].map(({ slot, prod, color }) => (
                <div key={slot} className="flex-1 rounded-xl p-3 cursor-pointer transition-all"
                  style={{ background: `${color}11`, border: `1px solid ${focusSlot === slot ? color : `${color}33`}`, boxShadow: focusSlot === slot ? `0 0 12px ${color}44` : 'none' }}
                  onClick={() => setFocusSlot(slot)}>
                  <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color }}>{slot === 'A' ? 'PRODUCER A' : 'PRODUCER B'}</div>
                  <div className="text-sm font-black uppercase" style={{ color: prod.color }}>{prod.name}</div>
                  <div className="text-[8px] text-white/30 mt-0.5">{prod.era}</div>
                </div>
              ))}
            </div>

            {/* DNA helix visualization */}
            <div className="shrink-0 h-20 bg-surface-low rounded-xl overflow-hidden relative flex items-center px-4">
              <div className="absolute inset-0 flex items-center">
                {Array.from({ length: 32 }).map((_, i) => {
                  const ratio = i / 31;
                  const blendRatio = blendAB / 100;
                  const colorA = selectedA.color;
                  const colorB = selectedB.color;
                  const side = i % 2 === 0;
                  const y = Math.sin(i * 0.4) * 20;
                  return (
                    <div key={i} className="flex-1 flex justify-center" style={{ paddingTop: side ? `${28 + y}px` : `${28 - y}px` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{
                        background: ratio < blendRatio ? colorA : colorB,
                        opacity: 0.7,
                        boxShadow: `0 0 4px ${ratio < blendRatio ? colorA : colorB}88`,
                      }} />
                    </div>
                  );
                })}
              </div>
              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 pointer-events-none">
                <span className="text-[7px] font-bold" style={{ color: selectedA.color }}>{selectedA.name}</span>
                <span className="text-[7px] font-bold" style={{ color: selectedB.color }}>{selectedB.name}</span>
              </div>
            </div>

            {/* Blend slider */}
            <div className="shrink-0 bg-surface-low rounded-xl p-3">
              <div className="flex justify-between text-[8px] uppercase tracking-wider mb-2">
                <span style={{ color: selectedA.color }}>{selectedA.name}</span>
                <span className="text-white/30">A ←→ B BLEND</span>
                <span style={{ color: selectedB.color }}>{selectedB.name}</span>
              </div>
              <input type="range" min={0} max={100} value={blendAB}
                onChange={e => setBlendAB(Number(e.target.value))}
                className="w-full h-2 cursor-pointer"
                style={{ accentColor: blendAB < 50 ? selectedA.color : selectedB.color }} />
              <div className="text-center text-[8px] text-white/30 mt-1 font-mono">{blendAB}% B</div>
            </div>

            {/* Producer selection for fusion (when slot is focused) */}
            <div className="flex-1 overflow-y-auto">
              <div className="text-[8px] uppercase tracking-widest text-white/30 mb-2 font-bold">SELECT FOR {focusSlot === 'A' ? 'A' : 'B'}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {PRODUCERS.map(p => (
                  <ProducerCard key={p.name} p={p}
                    active={(focusSlot === 'A' ? selectedA : selectedB).name === p.name}
                    onClick={() => focusSlot === 'A' ? setSelectedA(p) : setSelectedB(p)} />
                ))}
              </div>
            </div>
          </div>

          {/* Texture injection panel */}
          <div className="w-52 shrink-0 flex flex-col gap-3">
            <div className="bg-surface-low rounded-xl p-3 flex flex-col gap-3 flex-1 overflow-hidden">
              <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: '#bf00ff' }}>TEXTURE INJECTION</div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                {TEXTURES.map(t => (
                  <button key={t.name} onClick={() => setTexture(texture === t.name ? null : t.name)}
                    className="w-full px-2 py-2 rounded-lg text-left cursor-pointer transition-all text-[8px] font-bold uppercase tracking-wider"
                    style={{ background: texture === t.name ? `${t.color}22` : '#131315', border: `1px solid ${texture === t.name ? t.color : '#252428'}`, color: texture === t.name ? t.color : '#ffffff44' }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {texture && (
              <div className="bg-surface-low rounded-xl p-3 shrink-0">
                <div className="text-[8px] uppercase tracking-widest text-white/30 mb-2">INTENSITY</div>
                <input type="range" min={0} max={100} value={intensity}
                  onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: TEXTURES.find(t => t.name === texture)?.color ?? '#bf00ff' }} />
                <div className="text-center text-[9px] font-mono mt-1" style={{ color: TEXTURES.find(t => t.name === texture)?.color }}>
                  {intensity}%
                </div>
              </div>
            )}

            <button className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all shrink-0"
              style={{ background: '#e9c34922', border: '1px solid #e9c34966', color: '#e9c349', boxShadow: '0 0 12px #e9c34944' }}>
              GENERATE FUSION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Knob } from '@/components/ui/Knob';

interface Channel {
  id: string;
  label: string;
  color: string;
  icon: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  reverbSend: number;
  delaySend: number;
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'drums',   label: 'DRUMS',   color: '#ff3333', icon: '⬡', volume: 85, pan: 0,   muted: false, solo: false, reverbSend: 10, delaySend: 0  },
  { id: 'bass',    label: 'BASS',    color: '#7a00a6', icon: '〜', volume: 80, pan: -10, muted: false, solo: false, reverbSend: 5,  delaySend: 0  },
  { id: 'guitar',  label: 'GUITAR',  color: '#ff6b1a', icon: '♪', volume: 75, pan: 15,  muted: false, solo: false, reverbSend: 20, delaySend: 15 },
  { id: 'melody',  label: 'MELODY',  color: '#76d6d5', icon: '♫', volume: 70, pan: -5,  muted: false, solo: false, reverbSend: 30, delaySend: 20 },
  { id: 'chords',  label: 'CHORDS',  color: '#e9c349', icon: '⧖', volume: 65, pan: 5,   muted: false, solo: false, reverbSend: 35, delaySend: 10 },
  { id: 'synth',   label: 'SYNTH',   color: '#bf00ff', icon: '∿', volume: 72, pan: -15, muted: false, solo: false, reverbSend: 40, delaySend: 25 },
  { id: 'vocal',   label: 'VOCAL',   color: '#ff6b9d', icon: '⊕', volume: 90, pan: 0,   muted: false, solo: false, reverbSend: 25, delaySend: 5  },
];

const EQ_BANDS = ['LOW', 'MID', 'HIGH'] as const;

export function MixerEngine() {
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [masterVol, setMasterVol] = useState(100);
  const [masterReverb, setMasterReverb] = useState(30);
  const [masterDelay, setMasterDelay] = useState(20);
  const [eqValues, setEqValues] = useState<Record<string, Record<string, number>>>(
    Object.fromEntries(DEFAULT_CHANNELS.map(c => [c.id, { LOW: 0, MID: 0, HIGH: 0 }]))
  );
  const [selectedCh, setSelectedCh] = useState<string>('drums');

  const updateCh = (id: string, patch: Partial<Channel>) =>
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const toggleMute = (id: string) => updateCh(id, { muted: !channels.find(c => c.id === id)!.muted });
  const toggleSolo = (id: string) => {
    const isSolo = channels.find(c => c.id === id)!.solo;
    setChannels(prev => prev.map(c => ({ ...c, solo: c.id === id ? !isSolo : false })));
  };

  const anySolo = channels.some(c => c.solo);
  const selCh = channels.find(c => c.id === selectedCh)!;

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden">
      {/* Channel strips */}
      <div className="flex gap-2 flex-1 overflow-x-auto">
        {channels.map(ch => {
          const isActive = !ch.muted && (!anySolo || ch.solo);
          return (
            <div key={ch.id}
              onClick={() => setSelectedCh(ch.id)}
              className="flex flex-col items-center gap-2 w-16 shrink-0 cursor-pointer rounded-xl p-2 transition-all"
              style={{ background: selectedCh === ch.id ? `${ch.color}11` : 'transparent', border: `1px solid ${selectedCh === ch.id ? `${ch.color}44` : '#252428'}` }}>
              {/* Label */}
              <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: isActive ? ch.color : `${ch.color}44` }}>{ch.label}</div>
              <div className="text-lg" style={{ color: isActive ? ch.color : `${ch.color}33` }}>{ch.icon}</div>

              {/* Pan */}
              <div className="w-full">
                <div className="text-[6px] text-white/20 uppercase text-center mb-0.5">PAN</div>
                <input type="range" min={-50} max={50} value={ch.pan}
                  onChange={e => updateCh(ch.id, { pan: Number(e.target.value) })}
                  className="w-full h-1 cursor-pointer" style={{ accentColor: ch.color }} />
                <div className="text-[6px] font-mono text-center mt-0.5" style={{ color: ch.color }}>
                  {ch.pan === 0 ? 'C' : ch.pan < 0 ? `L${Math.abs(ch.pan)}` : `R${ch.pan}`}
                </div>
              </div>

              {/* Fader */}
              <div className="flex-1 flex flex-col items-center gap-1 w-full">
                <div className="text-[7px] font-mono" style={{ color: ch.color }}>{ch.volume}</div>
                <div className="flex-1 flex items-center justify-center relative w-6">
                  <div className="w-1.5 rounded-full" style={{ height: '120px', background: '#252428', position: 'relative' }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                      style={{ height: `${ch.volume}%`, background: isActive ? ch.color : `${ch.color}33`, boxShadow: isActive ? `0 0 6px ${ch.color}88` : 'none' }} />
                  </div>
                  <input type="range" min={0} max={100} value={ch.volume} {...{ orient: 'vertical' }}
                    onChange={e => updateCh(ch.id, { volume: Number(e.target.value) })}
                    className="absolute cursor-pointer opacity-0 h-full"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '24px' }} />
                </div>
              </div>

              {/* Mute / Solo */}
              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); toggleMute(ch.id); }}
                  className="w-6 h-5 rounded text-[7px] font-black cursor-pointer transition-all"
                  style={{ background: ch.muted ? '#ff333333' : '#252428', border: `1px solid ${ch.muted ? '#ff3333' : '#353437'}`, color: ch.muted ? '#ff3333' : '#ffffff44' }}>
                  M
                </button>
                <button onClick={e => { e.stopPropagation(); toggleSolo(ch.id); }}
                  className="w-6 h-5 rounded text-[7px] font-black cursor-pointer transition-all"
                  style={{ background: ch.solo ? '#e9c34933' : '#252428', border: `1px solid ${ch.solo ? '#e9c349' : '#353437'}`, color: ch.solo ? '#e9c349' : '#ffffff44' }}>
                  S
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel: selected channel EQ + sends + master */}
      <div className="w-52 shrink-0 flex flex-col gap-3">
        {/* EQ for selected channel */}
        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-3" style={{ color: selCh.color }}>
            {selCh.label} — EQ
          </div>
          <div className="flex gap-3 justify-center">
            {EQ_BANDS.map(band => (
              <div key={band} className="flex flex-col items-center gap-1">
                <div className="text-[7px] font-mono" style={{ color: selCh.color }}>
                  {eqValues[selectedCh]?.[band] >= 0 ? '+' : ''}{eqValues[selectedCh]?.[band] ?? 0}
                </div>
                <div className="relative flex items-center justify-center" style={{ height: 80, width: 20 }}>
                  <div className="absolute w-1.5 rounded-full" style={{ height: 80, background: '#252428' }} />
                  <div className="absolute w-1.5 rounded-full transition-all"
                    style={{
                      background: selCh.color,
                      opacity: 0.8,
                      height: `${Math.abs(eqValues[selectedCh]?.[band] ?? 0) / 12 * 40}px`,
                      bottom: eqValues[selectedCh]?.[band] >= 0 ? '50%' : undefined,
                      top: (eqValues[selectedCh]?.[band] ?? 0) < 0 ? '50%' : undefined,
                    }} />
                  <input type="range" min={-12} max={12} value={eqValues[selectedCh]?.[band] ?? 0} {...{ orient: 'vertical' }}
                    onChange={e => setEqValues(prev => ({ ...prev, [selectedCh]: { ...prev[selectedCh], [band]: Number(e.target.value) } }))}
                    className="absolute cursor-pointer opacity-0 h-full"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '20px' }} />
                </div>
                <div className="text-[7px] text-white/30 uppercase">{band}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sends */}
        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">SENDS</div>
          <div className="flex flex-col gap-2">
            {[{ label: 'REVERB BUS', val: selCh.reverbSend, color: '#76d6d5', key: 'reverbSend' as const },
              { label: 'DELAY BUS',  val: selCh.delaySend,  color: '#e9c349', key: 'delaySend'  as const }].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-[8px] mb-1">
                  <span className="text-white/30 uppercase">{s.label}</span>
                  <span className="font-mono" style={{ color: s.color }}>{s.val}%</span>
                </div>
                <input type="range" min={0} max={100} value={s.val}
                  onChange={e => updateCh(selectedCh, { [s.key]: Number(e.target.value) })}
                  className="w-full h-1 cursor-pointer" style={{ accentColor: s.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Master bus */}
        <div className="bg-surface-low rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">MASTER BUS</div>
          <div className="flex gap-3 items-center justify-center">
            <Knob value={masterVol}    min={0} max={100} label="VOL"    color="#bf00ff" onChange={setMasterVol}    size={38} />
            <Knob value={masterReverb} min={0} max={100} label="REVERB" color="#76d6d5" onChange={setMasterReverb} size={38} />
            <Knob value={masterDelay}  min={0} max={100} label="DELAY"  color="#e9c349" onChange={setMasterDelay}  size={38} />
          </div>
        </div>

        {/* Master fader */}
        <div className="flex items-center justify-center gap-2">
          <div className="text-[8px] text-white/30 uppercase">MASTER</div>
          <input type="range" min={0} max={100} value={masterVol}
            onChange={e => setMasterVol(Number(e.target.value))}
            className="flex-1 cursor-pointer" style={{ accentColor: '#bf00ff' }} />
          <div className="text-[9px] font-mono" style={{ color: '#bf00ff' }}>{masterVol}</div>
        </div>
      </div>
    </div>
  );
}

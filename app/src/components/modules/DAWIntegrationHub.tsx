'use client';
import { useState } from 'react';

interface DAW {
  name: string;
  short: string;
  color: string;
  formats: string[];
  platform: string[];
  icon: string;
}

const DAWS: DAW[] = [
  { name: 'ABLETON LIVE',   short: 'ABLETON',   color: '#39ff14', formats: ['VST3','AU','AAX'],       platform: ['Mac','Win'],       icon: '⊞' },
  { name: 'FL STUDIO',      short: 'FL',         color: '#e9c349', formats: ['VST3','VST2','AU'],      platform: ['Mac','Win'],       icon: '◉' },
  { name: 'LOGIC PRO',      short: 'LOGIC',      color: '#76d6d5', formats: ['AU','AAX'],              platform: ['Mac'],             icon: '♪' },
  { name: 'PRO TOOLS',      short: 'PRO TOOLS',  color: '#7090b0', formats: ['AAX','VST3'],            platform: ['Mac','Win'],       icon: '⊗' },
  { name: 'CUBASE',         short: 'CUBASE',     color: '#d4650a', formats: ['VST3','AU'],             platform: ['Mac','Win'],       icon: '⧖' },
  { name: 'REAPER',         short: 'REAPER',     color: '#888888', formats: ['VST3','VST2','AU','LV2'],platform: ['Mac','Win','Linux'],icon: '▶' },
  { name: 'STUDIO ONE',     short: 'STUDIO 1',   color: '#ff6b1a', formats: ['VST3','AU','AAX'],       platform: ['Mac','Win'],       icon: '♫' },
  { name: 'BITWIG',         short: 'BITWIG',     color: '#bf00ff', formats: ['VST3','CLAP','LV2'],     platform: ['Mac','Win','Linux'],icon: '⊛' },
  { name: 'GARAGEBAND',     short: 'GARAGE',     color: '#ff6b9d', formats: ['AU'],                    platform: ['Mac','iOS'],       icon: '♬' },
  { name: 'REASON',         short: 'REASON',     color: '#cc0000', formats: ['VST3','AU','Rack Ext'],  platform: ['Mac','Win'],       icon: '∿' },
];

const FORMATS = ['VST3', 'AU', 'AAX', 'CLAP', 'LV2', 'VST2', 'Rack Ext'];

const FORMAT_COLORS: Record<string, string> = {
  VST3: '#bf00ff', AU: '#76d6d5', AAX: '#7090b0',
  CLAP: '#39ff14', LV2: '#888888', VST2: '#e9c349', 'Rack Ext': '#cc0000',
};

interface ExportOption {
  label: string;
  desc: string;
  color: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { label: 'STEMS',           desc: 'Individual track stems', color: '#76d6d5' },
  { label: 'MIDI PACK',       desc: 'All MIDI patterns',      color: '#bf00ff' },
  { label: 'FULL MIX',        desc: '24-bit stereo wav',       color: '#e9c349' },
  { label: 'PROJECT FILE',    desc: 'DAW project template',   color: '#39ff14' },
  { label: 'SAMPLE PACK',     desc: 'One-shots + loops',      color: '#ff6b9d' },
  { label: 'PRESET PACK',     desc: 'Synth/drum presets',     color: '#d4650a' },
];

export function DAWIntegrationHub() {
  const [selectedDAW, setSelectedDAW] = useState<DAW>(DAWS[0]);
  const [selectedFormat, setSelectedFormat] = useState<string>('VST3');
  const [selectedExports, setSelectedExports] = useState<Set<string>>(new Set(['STEMS', 'MIDI PACK']));

  const toggleExport = (label: string) => {
    setSelectedExports(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <div className="flex gap-3 h-full p-4 overflow-hidden">
      {/* DAW grid */}
      <div className="flex flex-col gap-3 flex-1 overflow-hidden">
        <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold shrink-0">DAW INTEGRATION HUB</div>

        <div className="grid grid-cols-5 gap-2 shrink-0">
          {DAWS.map(daw => (
            <button key={daw.name} onClick={() => setSelectedDAW(daw)}
              className="rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-all"
              style={{ background: selectedDAW.name === daw.name ? `${daw.color}22` : '#1c1b1e', border: `1px solid ${selectedDAW.name === daw.name ? daw.color : '#353437'}`, boxShadow: selectedDAW.name === daw.name ? `0 0 12px ${daw.color}44` : 'none' }}>
              <span className="text-xl" style={{ color: daw.color }}>{daw.icon}</span>
              <div className="text-[8px] font-black uppercase tracking-wider leading-tight text-center" style={{ color: daw.color }}>{daw.short}</div>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {daw.platform.map(p => (
                  <span key={p} className="text-[6px] px-1 rounded" style={{ background: `${daw.color}18`, color: daw.color }}>{p}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Selected DAW detail */}
        <div className="bg-surface-low rounded-xl p-4 shrink-0">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="text-[8px] uppercase tracking-widest text-white/30">SELECTED DAW</div>
              <div className="text-lg font-black uppercase tracking-wide mt-0.5" style={{ color: selectedDAW.color }}>{selectedDAW.name}</div>
              <div className="text-[8px] text-white/30 mt-0.5">Platforms: {selectedDAW.platform.join(', ')}</div>
            </div>
            <div>
              <div className="text-[8px] uppercase tracking-widest text-white/30 mb-2">SUPPORTED FORMATS</div>
              <div className="flex flex-wrap gap-1">
                {selectedDAW.formats.map(f => (
                  <span key={f} className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${FORMAT_COLORS[f] ?? '#888'}22`, color: FORMAT_COLORS[f] ?? '#888', border: `1px solid ${FORMAT_COLORS[f] ?? '#888'}44` }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plugin format selector */}
        <div className="bg-surface-low rounded-xl p-4 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-3 font-bold">PLUGIN FORMAT</div>
          <div className="flex gap-2 flex-wrap">
            {FORMATS.map(f => {
              const supported = selectedDAW.formats.includes(f);
              const active = selectedFormat === f && supported;
              const color = FORMAT_COLORS[f] ?? '#888';
              return (
                <button key={f} onClick={() => supported && setSelectedFormat(f)} disabled={!supported}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                  style={{ background: active ? `${color}22` : supported ? '#252428' : '#1c1b1e', border: `1px solid ${active ? color : supported ? '#353437' : '#252428'}`, color: active ? color : supported ? '#ffffff55' : '#ffffff18', cursor: supported ? 'pointer' : 'not-allowed', boxShadow: active ? `0 0 8px ${color}44` : 'none' }}>
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Export options */}
        <div className="flex-1 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2 font-bold">EXPORT OPTIONS</div>
          <div className="grid grid-cols-3 gap-2">
            {EXPORT_OPTIONS.map(o => {
              const active = selectedExports.has(o.label);
              return (
                <button key={o.label} onClick={() => toggleExport(o.label)}
                  className="rounded-xl p-3 text-left cursor-pointer transition-all"
                  style={{ background: active ? `${o.color}22` : '#1c1b1e', border: `1px solid ${active ? o.color : '#353437'}` }}>
                  <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: o.color }}>{o.label}</div>
                  <div className="text-[7px] text-white/30 mt-0.5">{o.desc}</div>
                  <div className="mt-2 flex justify-end">
                    <div className="w-4 h-4 rounded flex items-center justify-center"
                      style={{ background: active ? o.color : '#353437', border: `1px solid ${active ? o.color : '#555'}` }}>
                      {active && <span className="text-[8px] font-black text-black">✓</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Export panel */}
      <div className="w-52 shrink-0 flex flex-col gap-3">
        <div className="bg-surface-low rounded-xl p-4 flex-1 flex flex-col gap-3">
          <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: selectedDAW.color }}>EXPORT SUMMARY</div>

          <div className="flex flex-col gap-2 text-[9px]">
            <div className="flex justify-between">
              <span className="text-white/40">DAW</span>
              <span className="font-bold" style={{ color: selectedDAW.color }}>{selectedDAW.short}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">FORMAT</span>
              <span className="font-bold" style={{ color: FORMAT_COLORS[selectedFormat] }}>{selectedFormat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">ITEMS</span>
              <span className="font-bold text-white/70">{selectedExports.size}</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3">
            <div className="text-[8px] uppercase text-white/30 mb-2">SELECTED</div>
            <div className="flex flex-col gap-1">
              {Array.from(selectedExports).map(e => {
                const opt = EXPORT_OPTIONS.find(o => o.label === e)!;
                return (
                  <div key={e} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />
                    <span className="text-[8px] font-bold" style={{ color: opt.color }}>{e}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button className="w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all shrink-0"
          style={{ background: selectedDAW.color, color: '#0a0a0c', boxShadow: `0 0 16px ${selectedDAW.color}66` }}>
          EXPORT TO {selectedDAW.short}
        </button>
      </div>
    </div>
  );
}

'use client';
import { useProjectStore, Module } from '@/store/projectStore';

const MODULES: { id: Module; icon: string; label: string; color: string }[] = [
  { id: 'vibe',      icon: '◉', label: 'VIBE',      color: '#bf00ff' },
  { id: 'drums',     icon: '⬡', label: 'DRUMS',     color: '#ff3333' },
  { id: 'bass',      icon: '〜', label: 'BASS',      color: '#7a00a6' },
  { id: 'guitar',    icon: '♪', label: 'GUITAR',    color: '#ff6b1a' },
  { id: 'melody',    icon: '♫', label: 'MELODY',    color: '#76d6d5' },
  { id: 'chords',    icon: '⧖', label: 'CHORDS',    color: '#e9c349' },
  { id: 'synth',     icon: '∿', label: 'SYNTH',     color: '#bf00ff' },
  { id: 'orchestra', icon: '♬', label: 'ORCH',      color: '#9b59b6' },
  { id: 'vocal',     icon: '⊕', label: 'VOCAL',     color: '#ff6b9d' },
  { id: 'mixer',     icon: '⊞', label: 'MIXER',     color: '#76d6d5' },
  { id: 'sample',    icon: '⊗', label: 'SAMPLE',    color: '#39ff14' },
  { id: 'fusion',    icon: '⊛', label: 'FUSION',    color: '#e9c349' },
  { id: 'timeline',  icon: '▶', label: 'TIMELINE',  color: '#7090b0' },
  { id: 'export',    icon: '⬆', label: 'EXPORT',    color: '#e9c349' },
];

export function Sidebar() {
  const { activeModule, setActiveModule } = useProjectStore();

  return (
    <div className="w-16 flex flex-col items-center py-3 gap-1 bg-void border-r border-white/5 overflow-y-auto">
      {/* Logo */}
      <div className="mb-3 flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: '#bf00ff', boxShadow: '0 0 12px #bf00ffaa' }}
        >
          NO
        </div>
      </div>

      {MODULES.map(({ id, icon, label, color }) => {
        const active = activeModule === id;
        return (
          <button
            key={id}
            onClick={() => setActiveModule(id)}
            title={label}
            className="w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-150 cursor-pointer"
            style={{
              background: active ? `${color}22` : 'transparent',
              border: `1px solid ${active ? `${color}66` : 'transparent'}`,
              boxShadow: active ? `0 0 12px ${color}44` : 'none',
              color: active ? color : '#ffffff55',
            }}
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-[7px] uppercase tracking-wider font-bold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

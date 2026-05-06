'use client';
import { useProjectStore, Section } from '@/store/projectStore';

const SECTIONS: { id: Section; label: string; color: string }[] = [
  { id: 'intro',   label: 'INTRO',    color: '#e9c349' },
  { id: 'verse',   label: 'VERSE',    color: '#76d6d5' },
  { id: 'prehook', label: 'PRE-HOOK', color: '#ff6b1a' },
  { id: 'hook',    label: 'HOOK',     color: '#bf00ff' },
  { id: 'bridge',  label: 'BRIDGE',   color: '#ff6b9d' },
  { id: 'outro',   label: 'OUTRO',    color: '#7090b0' },
];

export function SectionTabs() {
  const { activeSection, setActiveSection } = useProjectStore();

  return (
    <div className="flex gap-1">
      {SECTIONS.map(({ id, label, color }) => {
        const active = activeSection === id;
        return (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-all duration-150 cursor-pointer"
            style={{
              color: active ? '#0a0a0c' : color,
              background: active ? color : `${color}22`,
              border: `1px solid ${color}44`,
              boxShadow: active ? `0 0 12px ${color}88` : 'none',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

'use client';
import { useProjectStore, Module } from '@/store/projectStore';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { VibeGenerator } from '@/components/modules/VibeGenerator';
import { DrumMachine } from '@/components/modules/DrumMachine';
import { ChordEngine } from '@/components/modules/ChordEngine';
import { BassEngine } from '@/components/modules/BassEngine';
import { GuitarEngine } from '@/components/modules/GuitarEngine';
import { PianoRoll } from '@/components/modules/PianoRoll';
import { Placeholder } from '@/components/modules/Placeholder';

const MODULE_MAP: Partial<Record<Module, React.ComponentType>> = {
  vibe: VibeGenerator,
  drums: DrumMachine,
  chords: ChordEngine,
  bass: BassEngine,
  guitar: GuitarEngine,
  melody: PianoRoll,
};

export default function Home() {
  const { activeModule } = useProjectStore();
  const ActiveModule = MODULE_MAP[activeModule] ?? Placeholder;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-void">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <ActiveModule />
        </main>
      </div>
    </div>
  );
}

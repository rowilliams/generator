'use client';
import { useProjectStore } from '@/store/projectStore';

export function Placeholder() {
  const { activeModule } = useProjectStore();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
      <div className="text-4xl">∿</div>
      <div className="text-xs uppercase tracking-widest font-bold">{activeModule} — coming soon</div>
    </div>
  );
}

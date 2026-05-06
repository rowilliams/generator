'use client';
import { useRef, useCallback } from 'react';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  color?: string;
  size?: number;
  onChange: (v: number) => void;
}

export function Knob({ value, min = 0, max = 100, label, color = '#bf00ff', size = 48, onChange }: KnobProps) {
  const startY = useRef<number | null>(null);
  const startVal = useRef(value);

  const pct = (value - min) / (max - min);
  const angle = -135 + pct * 270;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const rad = (angle * Math.PI) / 180;
  const ix = cx + r * Math.sin(rad);
  const iy = cy - r * Math.cos(rad);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startY.current = e.clientY;
    startVal.current = value;
    const onMove = (me: MouseEvent) => {
      if (startY.current === null) return;
      const delta = (startY.current - me.clientY) / 150;
      const newVal = Math.max(min, Math.min(max, startVal.current + delta * (max - min)));
      onChange(Math.round(newVal));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [value, min, max, onChange]);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width={size} height={size} onMouseDown={onMouseDown} className="cursor-ns-resize">
        <circle cx={cx} cy={cy} r={r} fill="#1c1b1e" stroke="#353437" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r - 2} fill="transparent"
          stroke={color} strokeWidth="2" strokeOpacity="0.2"
          strokeDasharray={`${2 * Math.PI * (r - 2) * 0.75} ${2 * Math.PI * (r - 2) * 0.25}`}
          strokeDashoffset={`${2 * Math.PI * (r - 2) * 0.625}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <line x1={cx} y1={cy} x2={ix} y2={iy}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
        <circle cx={ix} cy={iy} r="3" fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span className="text-[9px] uppercase tracking-widest text-white/50">{label}</span>
      <span className="text-[9px] font-mono text-white/70">{value}</span>
    </div>
  );
}

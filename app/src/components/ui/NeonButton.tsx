'use client';
import { ButtonHTMLAttributes } from 'react';

type Color = 'purple' | 'gold' | 'teal' | 'rose' | 'red' | 'green' | 'amber' | 'steel';

const colorMap: Record<Color, { bg: string; border: string; shadow: string; text: string }> = {
  purple: { bg: 'bg-purple/20 hover:bg-purple/30', border: 'border-purple/50', shadow: 'hover:shadow-[0_0_16px_#bf00ff66]', text: 'text-purple' },
  gold:   { bg: 'bg-gold/20 hover:bg-gold/30',     border: 'border-gold/50',   shadow: 'hover:shadow-[0_0_16px_#e9c34966]', text: 'text-gold'   },
  teal:   { bg: 'bg-teal/20 hover:bg-teal/30',     border: 'border-teal/50',   shadow: 'hover:shadow-[0_0_16px_#76d6d566]', text: 'text-teal'   },
  rose:   { bg: 'bg-rose/20 hover:bg-rose/30',     border: 'border-rose/50',   shadow: 'hover:shadow-[0_0_16px_#ff6b9d66]', text: 'text-rose'   },
  red:    { bg: 'bg-crimson/20 hover:bg-crimson/30', border: 'border-crimson/50', shadow: 'hover:shadow-[0_0_16px_#ff333366]', text: 'text-crimson' },
  green:  { bg: 'bg-lime/20 hover:bg-lime/30',     border: 'border-lime/50',   shadow: 'hover:shadow-[0_0_16px_#39ff1466]', text: 'text-lime'   },
  amber:  { bg: 'bg-amber/20 hover:bg-amber/30',   border: 'border-amber/50',  shadow: 'hover:shadow-[0_0_16px_#ffbf0066]', text: 'text-amber'  },
  steel:  { bg: 'bg-steel/20 hover:bg-steel/30',   border: 'border-steel/50',  shadow: 'hover:shadow-[0_0_16px_#7090b066]', text: 'text-steel'  },
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: Color;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  active?: boolean;
  fullWidth?: boolean;
}

const sizes = { xs: 'px-2 py-1 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

export function NeonButton({ color = 'purple', size = 'md', active, fullWidth, className = '', children, ...props }: Props) {
  const c = colorMap[color];
  return (
    <button
      className={`
        ${sizes[size]} ${fullWidth ? 'w-full' : ''}
        ${c.bg} ${c.border} ${c.shadow} ${c.text}
        border rounded font-medium tracking-wide uppercase
        transition-all duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${active ? `bg-${color}/40 shadow-[0_0_16px_${color === 'purple' ? '#bf00ff' : '#e9c349'}66]` : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

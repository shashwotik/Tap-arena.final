import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface StatPillProps {
  icon?: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
  className?: string;
}

export function StatPill({ icon, label, value, accent, mono = true, className }: StatPillProps) {
  return (
    <div className={cn('chamfer-sm glass-panel flex flex-col gap-1 px-4 py-3', className)}>
      <div className="flex items-center gap-1.5 text-text-dim">
        {icon}
        <span className="font-body text-[10px] uppercase tracking-[0.15em]">{label}</span>
      </div>
      <span className={cn('text-lg leading-none', mono ? 'font-mono tabular-nums' : 'font-display', accent && 'text-neon-400 text-glow')}>
        {value}
      </span>
    </div>
  );
}

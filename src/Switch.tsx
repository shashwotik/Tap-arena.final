import { motion } from 'motion/react';
import { cn } from '../../utils/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full border transition-colors no-select',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-400 focus-visible:outline-offset-2',
        checked ? 'border-neon-500 bg-neon-600/40' : 'border-steel bg-panel-light',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={cn(
          'absolute top-0.5 h-[22px] w-[22px] rounded-full shadow-md',
          checked ? 'left-[calc(100%-1.5rem)] bg-neon-400 shadow-glow-sm' : 'left-0.5 bg-text-dim',
        )}
      />
    </button>
  );
}

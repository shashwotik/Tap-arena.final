import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-neon-500 text-void border border-neon-400 shadow-glow hover:bg-neon-400',
  secondary: 'bg-panel-light text-text border border-steel hover:border-neon-600',
  ghost: 'bg-transparent text-text-dim border border-transparent hover:text-text hover:bg-panel',
  danger: 'bg-loss/10 text-loss border border-loss/40 hover:bg-loss/20',
};

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.12 }}
      disabled={disabled || loading}
      className={cn(
        'chamfer-sm relative inline-flex items-center justify-center gap-2 px-5 py-3',
        'font-body font-semibold tracking-wide text-sm transition-colors no-select',
        'disabled:opacity-45 disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      {children}
    </motion.button>
  );
}

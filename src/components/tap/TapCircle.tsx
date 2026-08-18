import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';
import { ParticleBurst, type BurstTrigger } from './ParticleBurst';

interface TapCircleProps {
  onTap: (isTrusted: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  tps?: number;
  label?: string;
}

export function TapCircle({ onTap, disabled = false, compact = false, tps = 0, label = 'TAP' }: TapCircleProps) {
  const [burst, setBurst] = useState<BurstTrigger | null>(null);
  const [active, setActive] = useState(false);
  const circleRef = useRef<HTMLDivElement>(null);
  const idleTimeoutRef = useRef<number | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = circleRef.current?.getBoundingClientRect();
    if (rect) {
      setBurst({ x: e.clientX - rect.left, y: e.clientY - rect.top, key: Date.now() + Math.random() });
    }
    setActive(true);
    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = window.setTimeout(() => setActive(false), 1300);
    onTap(e.isTrusted);
  };

  useEffect(
    () => () => {
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    },
    [],
  );

  const outerSize = compact ? 'w-48 h-48' : 'w-[19rem] h-[19rem]';
  const glowSize = compact ? 'w-52 h-52' : 'w-80 h-80';
  const circleSize = compact ? 'w-40 h-40 sm:w-44 sm:h-44' : 'w-60 h-60 sm:w-72 sm:h-72';
  const ringSize = compact ? 176 : 260;

  return (
    <div className="relative flex items-center justify-center">
      {/* ambient glow — intensifies while actively tapping */}
      <div
        className={cn(
          'absolute rounded-full bg-neon-500/20 blur-3xl animate-pulse-slow transition-opacity duration-500',
          glowSize,
          active && !disabled && 'bg-neon-500/35',
        )}
      />

      {/* signature radar-sweep ring */}
      <div className={cn('absolute rounded-full', outerSize)}>
        <div
          className="absolute inset-0 rounded-full animate-spin-slower opacity-70"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,229,255,0.95) 12deg, transparent 46deg)',
            WebkitMask: 'radial-gradient(closest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
            mask: 'radial-gradient(closest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
          }}
        />
        <div className="absolute inset-0 rounded-full border border-neon-500/15" />
        <div className="absolute inset-6 rounded-full border border-neon-500/10" />
      </div>

      {/* sonar pulse — a steady "contact ping" radiating outward */}
      <motion.div
        className="absolute rounded-full border border-pulse/70"
        initial={{ opacity: 0.5, scale: 0.7 }}
        animate={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        style={{ width: ringSize, height: ringSize }}
      />

      <motion.div
        ref={circleRef}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        animate={{ scale: [1, 1.015, 1] }}
        whileTap={disabled ? undefined : { scale: 0.93 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'relative flex items-center justify-center rounded-full bg-void border-2 no-select',
          disabled ? 'border-steel opacity-60' : 'border-neon-500 shadow-glow cursor-pointer',
          circleSize,
        )}
        style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="absolute inset-5 rounded-full border border-neon-500/20" />
        <div className="flex flex-col items-center gap-1.5">
          <span
            className={cn(
              'font-display font-bold tracking-[0.35em]',
              compact ? 'text-lg' : 'text-2xl',
              disabled ? 'text-text-dim' : 'text-neon-400 text-glow',
            )}
          >
            {label}
          </span>
          {active && !disabled && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xs tabular-nums text-pulse text-glow-pulse"
            >
              {tps} TPS
            </motion.span>
          )}
        </div>
        <ParticleBurst burst={burst} />
      </motion.div>
    </div>
  );
}

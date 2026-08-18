import { AnimatePresence, motion } from 'motion/react';

export function CountdownOverlay({ value }: { value: number | null }) {
  if (value === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className={
            value > 0
              ? 'font-display text-8xl font-black text-neon-400 text-glow'
              : 'font-display text-7xl font-black text-pulse text-glow-pulse'
          }
        >
          {value > 0 ? value : 'GO!'}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

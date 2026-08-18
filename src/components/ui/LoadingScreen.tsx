import { motion } from 'motion/react';

export function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-void">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-2 border-steel" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-400 border-r-neon-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-neon-400 shadow-glow-sm" />
        </div>
      </div>
      <p className="font-display text-xs tracking-[0.35em] text-text-dim">{label.toUpperCase()}</p>
    </div>
  );
}

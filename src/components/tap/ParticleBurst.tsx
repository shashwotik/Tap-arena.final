import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  hue: number;
}

export interface BurstTrigger {
  x: number;
  y: number;
  key: number;
}

export function ParticleBurst({ burst }: { burst: BurstTrigger | null }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!burst) return;
    const count = 7 + Math.floor(Math.random() * 5);
    const created: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 36 + Math.random() * 58;
      return {
        id: idRef.current++,
        x: burst.x,
        y: burst.y,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        size: 3 + Math.random() * 4,
        hue: 196 + Math.random() * 34,
      };
    });
    setParticles((prev) => [...prev, ...created]);
    const ids = new Set(created.map((p) => p.id));
    const timeout = window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 680);
    return () => window.clearTimeout(timeout);
  }, [burst]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
            animate={{ x: p.x + p.dx, y: p.y + p.dy, opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.62, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              background: `hsl(${p.hue} 100% 68%)`,
              boxShadow: `0 0 8px 2px hsl(${p.hue} 100% 60% / 0.85)`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

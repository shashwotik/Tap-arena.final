import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { LevelInfo } from '../../types';
import { soundManager } from '../../utils/soundManager';
import { vibrate, HAPTIC } from '../../utils/haptics';
import { TierBadge } from '../ui/TierBadge';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';

interface LevelUpModalProps {
  info: LevelInfo | null;
  onClose: () => void;
}

export function LevelUpModal({ info, onClose }: LevelUpModalProps) {
  const { t } = useSettings();

  useEffect(() => {
    if (info) {
      soundManager.playLevelUp();
      vibrate(HAPTIC.levelUp);
    }
  }, [info]);

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-void/90 backdrop-blur-md p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* radiating rings */}
          <div className="pointer-events-none absolute flex items-center justify-center">
            {[0, 0.25, 0.5].map((delay) => (
              <motion.span
                key={delay}
                className="absolute rounded-full border border-neon-500/40"
                initial={{ width: 60, height: 60, opacity: 0.6 }}
                animate={{ width: 420, height: 420, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="chamfer glass-panel relative w-full max-w-sm px-8 py-9 text-center shadow-glow-lg"
          >
            <p className="font-display text-xs tracking-[0.4em] text-neon-400 text-glow">{t('levelUpTitle')}</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-text">{info.levelName}</h2>
            <div className="mt-4 flex justify-center">
              <TierBadge tier={info.tier} size="lg" />
            </div>
            <p className="mt-4 font-mono text-xs tabular-nums text-text-dim">
              {t('levelReached')} {info.level}
            </p>
            <Button onClick={onClose} fullWidth className="mt-7">
              {t('continue')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

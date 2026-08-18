import { motion } from 'motion/react';
import { Users, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';

interface MatchmakingOverlayProps {
  showAiOffer: boolean;
  onCancel: () => void;
  onStartPractice: () => void;
}

export function MatchmakingOverlay({ showAiOffer, onCancel, onStartPractice }: MatchmakingOverlayProps) {
  const { t } = useSettings();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-14 text-center">
      <div className="relative flex h-36 w-36 items-center justify-center">
        {[0, 0.5].map((delay) => (
          <motion.span
            key={delay}
            className="absolute inset-0 rounded-full border border-neon-500/40"
            animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay }}
          />
        ))}
        <div className="chamfer glass-panel flex h-24 w-24 items-center justify-center shadow-glow">
          <Users className="text-neon-400" size={30} />
        </div>
      </div>

      <div>
        <p className="font-display text-lg text-text">{t('matchSearching')}</p>
        <p className="mt-1 font-mono text-xs tabular-nums text-text-dim">1v1 · 60s · highest taps wins</p>
      </div>

      {showAiOffer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="chamfer glass-panel w-full max-w-xs px-5 py-4"
        >
          <p className="text-sm text-text-dim">{t('matchNoOpponent')}</p>
          <p className="mt-1 text-sm font-medium text-text">{t('matchPracticeOffer')}</p>
          <Button onClick={onStartPractice} fullWidth className="mt-3">
            {t('matchPracticeStart')}
          </Button>
        </motion.div>
      )}

      <Button variant="ghost" icon={<X size={16} />} onClick={onCancel}>
        {t('matchCancelSearch')}
      </Button>
    </div>
  );
}

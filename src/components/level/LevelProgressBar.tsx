import { motion } from 'motion/react';
import type { LevelInfo } from '../../types';
import { formatCompact } from '../../utils/format';
import { useSettings } from '../../context/SettingsContext';
import { TierBadge } from '../ui/TierBadge';

export function LevelProgressBar({ info }: { info: LevelInfo }) {
  const { t } = useSettings();

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-text">{info.levelName}</span>
          {info.level > 0 && <TierBadge tier={info.tier} size="sm" />}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-text-dim">
          {info.isMaxLevel ? t('levelMax') : `${formatCompact(info.tapsToNext ?? 0)} ${t('levelToNext')}`}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-steel bg-panel-light">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-neon-700 via-neon-500 to-neon-400 shadow-glow-sm"
          initial={false}
          animate={{ width: `${info.progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

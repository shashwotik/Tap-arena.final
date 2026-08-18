import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { subscribeToLeaderboard } from '../firebase/leaderboardService';
import { getLevelInfo } from '../config/levels';
import { flagEmoji } from '../config/countries';
import { formatNumber } from '../utils/format';
import { TierBadge } from '../components/ui/TierBadge';
import { cn } from '../utils/cn';
import type { LeaderboardEntry } from '../types';

const RANK_COLORS: Record<number, string> = {
  1: '#ffd873',
  2: '#c7d3de',
  3: '#c9824b',
};

export function LeaderboardScreen() {
  const { profile } = useAuth();
  const { t } = useSettings();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    return subscribeToLeaderboard(setEntries);
  }, []);

  return (
    <div className="min-h-[100dvh] px-5 pb-28 pt-6">
      <h1 className="font-display text-xl font-bold text-text">{t('leaderboardTitle')}</h1>

      <div className="mt-1 grid grid-cols-[2.5rem_1fr_3.5rem_4.5rem] gap-2 px-3 pb-2 pt-4 font-body text-[10px] uppercase tracking-widest text-text-dim">
        <span>{t('leaderboardRank')}</span>
        <span>{t('leaderboardPlayer')}</span>
        <span className="text-center">{t('leaderboardLevel')}</span>
        <span className="text-right">{t('leaderboardTaps')}</span>
      </div>

      {entries === null && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-panel-light" />
          ))}
        </div>
      )}

      {entries !== null && entries.length === 0 && (
        <p className="mt-10 text-center font-body text-sm text-text-dim">{t('leaderboardEmpty')}</p>
      )}

      <div className="flex flex-col gap-1.5">
        {entries?.map((entry, i) => {
          const isYou = entry.uid === profile?.uid;
          const levelInfo = getLevelInfo(entry.totalTaps);
          const rankColor = RANK_COLORS[entry.rank];
          return (
            <motion.div
              key={entry.uid}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.02 }}
              className={cn(
                'chamfer-sm grid grid-cols-[2.5rem_1fr_3.5rem_4.5rem] items-center gap-2 border px-3 py-2.5',
                isYou ? 'border-neon-500 bg-neon-500/10 shadow-glow-sm' : 'border-steel bg-panel',
              )}
            >
              <span
                className="flex items-center gap-1 font-mono text-sm font-bold tabular-nums"
                style={{ color: rankColor ?? 'var(--color-text-dim)' }}
              >
                {entry.rank <= 3 && <Crown size={13} />}
                {entry.rank}
              </span>
              <span className="flex items-center gap-1.5 truncate font-body text-sm text-text">
                <span>{flagEmoji(entry.countryCode)}</span>
                <span className="truncate">{entry.username}</span>
                {isYou && <span className="text-[10px] text-neon-400">({t('leaderboardYou')})</span>}
              </span>
              <span className="flex justify-center">
                <TierBadge tier={levelInfo.tier} size="sm" />
              </span>
              <span className="text-right font-mono text-xs tabular-nums text-text-dim">{formatNumber(entry.totalTaps)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

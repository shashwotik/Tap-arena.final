import { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { getLevelInfo } from '../config/levels';
import { formatNumber, formatFlexMoney } from '../utils/format';
import { flagEmoji } from '../config/countries';
import { soundManager } from '../utils/soundManager';
import { vibrate, HAPTIC } from '../utils/haptics';
import { TAP_BATCH_FLUSH_MS } from '../config/constants';
import { TapCircle } from '../components/tap/TapCircle';
import { LevelProgressBar } from '../components/level/LevelProgressBar';
import { StatPill } from '../components/ui/StatPill';
import type { AntiCheatFlag } from '../types';

export function HomeScreen() {
  const { profile, addTaps, reportFlag, reportHighestTPS } = useAuth();
  const { t } = useSettings();

  const [localTaps, setLocalTaps] = useState(profile?.totalTaps ?? 0);
  const localTapsRef = useRef(localTaps);
  const pendingRef = useRef(0);
  const flushTimerRef = useRef<number | null>(null);
  const peakSyncedRef = useRef(0);

  const handleFlag = useCallback(
    (flag: AntiCheatFlag) => {
      void reportFlag(flag);
    },
    [reportFlag],
  );
  const antiCheat = useAntiCheat(handleFlag);

  // The home screen's own optimistic counter is the source of truth while
  // tapping — it only ever gets pulled UP by a larger server value (e.g. a
  // match reward landing, or another device's progress), never stomped
  // backwards by a stale echo of a write we're still batching.
  useEffect(() => {
    if (profile && profile.totalTaps > localTapsRef.current) {
      localTapsRef.current = profile.totalTaps;
      setLocalTaps(profile.totalTaps);
    }
  }, [profile?.totalTaps]);

  const flushPending = useCallback(() => {
    if (pendingRef.current > 0) {
      const amount = pendingRef.current;
      pendingRef.current = 0;
      void addTaps(amount);
    }
  }, [addTaps]);

  useEffect(() => {
    flushTimerRef.current = window.setInterval(flushPending, TAP_BATCH_FLUSH_MS);
    const handleVisibility = () => {
      if (document.hidden) flushPending();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (flushTimerRef.current) window.clearInterval(flushTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      flushPending();
    };
  }, [flushPending]);

  const handleTap = useCallback(
    (isTrusted: boolean) => {
      localTapsRef.current += 1;
      pendingRef.current += 1;
      setLocalTaps(localTapsRef.current);
      soundManager.playTap();
      vibrate(HAPTIC.tap);
      antiCheat.registerTap(isTrusted);

      const peak = antiCheat.getPeakTPS();
      if (peak > peakSyncedRef.current && peak > (profile?.highestTPS ?? 0)) {
        peakSyncedRef.current = peak;
        void reportHighestTPS(peak);
      }
    },
    [antiCheat, profile?.highestTPS, reportHighestTPS],
  );

  if (!profile) return null;

  const levelInfo = getLevelInfo(localTaps);

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-28 pt-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neon-500/50 bg-panel text-base">
          {flagEmoji(profile.countryCode)}
        </div>
        <div>
          <p className="font-display text-sm font-bold text-text">{profile.username}</p>
          <p className="font-mono text-[11px] tabular-nums text-text-dim">{levelInfo.levelName}</p>
        </div>
      </div>

      <div className="mt-5">
        <LevelProgressBar info={levelInfo} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatPill icon={<Zap size={12} />} label={t('homeTotalTaps')} value={formatNumber(localTaps)} accent />
        <StatPill icon={<Coins size={12} />} label={t('homeFlexMoney')} value={formatFlexMoney(localTaps)} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
        <TapCircle onTap={handleTap} tps={antiCheat.currentTPS} />
        <p className="font-body text-xs text-text-dim">{t('homeTapHint')}</p>
      </div>

      <p className="text-center font-body text-[10px] text-text-dim">{t('homeFlexNote')}</p>
    </div>
  );
}

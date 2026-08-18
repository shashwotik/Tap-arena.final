import { useEffect, useState, useCallback } from 'react';
import { Swords, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { fetchMatchHistory } from '../firebase/userService';
import { flagEmoji } from '../config/countries';
import { formatNumber } from '../utils/format';
import { Button } from '../components/ui/Button';
import { MatchmakingOverlay } from '../components/match/MatchmakingOverlay';
import { CountdownOverlay } from '../components/match/CountdownOverlay';
import { LiveMatchView } from '../components/match/LiveMatchView';
import { MatchResultModal } from '../components/match/MatchResultModal';
import type { AntiCheatFlag, MatchHistoryEntry, Screen } from '../types';

interface MatchScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function MatchScreen({ onNavigate }: MatchScreenProps) {
  const { profile, reportFlag } = useAuth();
  const { t } = useSettings();
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);

  const handleFlag = useCallback(
    (flag: AntiCheatFlag) => {
      void reportFlag(flag);
    },
    [reportFlag],
  );

  const identity = {
    uid: profile?.uid ?? '',
    username: profile?.username ?? 'Player',
    countryCode: profile?.countryCode ?? 'US',
  };
  const mm = useMatchmaking(identity, handleFlag);

  useEffect(() => {
    if (!profile) return;
    void fetchMatchHistory(profile.uid, 8).then(setHistory);
  }, [profile, mm.state]);

  if (!profile) return null;

  return (
    <div className="flex min-h-[100dvh] flex-col pb-28 pt-6">
      {mm.state === 'idle' && (
        <div className="flex flex-1 flex-col px-5">
          <h1 className="font-display text-xl font-bold text-text">{t('matchTitle')}</h1>

          <div className="mt-6 chamfer glass-panel flex flex-col items-center gap-4 px-6 py-10 text-center shadow-glow">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-500 shadow-glow">
              <Swords className="text-neon-400" size={26} />
            </div>
            <p className="font-mono text-xs tabular-nums text-text-dim">1 VS 1 · 60 SECONDS · HIGHEST TAPS WINS</p>
            <Button onClick={mm.joinQueue} fullWidth className="mt-2">
              {t('matchFindOpponent')}
            </Button>
          </div>

          {history.length > 0 && (
            <div className="mt-8">
              <div className="mb-2 flex items-center gap-1.5 text-text-dim">
                <History size={14} />
                <h2 className="font-body text-xs uppercase tracking-widest">{t('matchHistory')}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <div key={h.id} className="chamfer-sm flex items-center justify-between border border-steel bg-panel px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          h.result === 'win'
                            ? 'h-2 w-2 rounded-full bg-win'
                            : h.result === 'loss'
                              ? 'h-2 w-2 rounded-full bg-loss'
                              : 'h-2 w-2 rounded-full bg-text-dim'
                        }
                      />
                      <span className="text-sm leading-none">{flagEmoji(h.opponentCountry)}</span>
                      <span className="font-body text-sm text-text">{h.opponentUsername}</span>
                      {h.isPractice && <span className="font-mono text-[9px] uppercase text-text-dim">practice</span>}
                    </div>
                    <span className="font-mono text-xs tabular-nums text-text-dim">
                      {formatNumber(h.yourTaps)}–{formatNumber(h.opponentTaps)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mm.state === 'searching' && (
        <MatchmakingOverlay showAiOffer={mm.showAiOffer} onCancel={mm.cancelSearch} onStartPractice={mm.startPracticeMatch} />
      )}

      {(mm.state === 'countdown' || mm.state === 'live') && mm.opponent && (
        <>
          <CountdownOverlay value={mm.state === 'countdown' ? mm.countdownValue : null} />
          <LiveMatchView
            yourUsername={profile.username}
            yourCountry={profile.countryCode}
            yourTaps={mm.yourTaps}
            opponentUsername={mm.opponent.username}
            opponentCountry={mm.opponent.countryCode}
            opponentTaps={mm.opponentTaps}
            timeRemainingMs={mm.timeRemainingMs}
            currentTPS={mm.currentTPS}
            isPractice={mm.isPractice}
            onTap={mm.registerTap}
          />
        </>
      )}

      <MatchResultModal
        outcome={mm.state === 'finished' ? mm.outcome : null}
        onPlayAgain={() => mm.playAgain()}
        onBackHome={() => {
          mm.playAgain();
          onNavigate('home');
        }}
      />
    </div>
  );
}

import { flagEmoji } from '../../config/countries';
import { formatNumber } from '../../utils/format';
import { TapCircle } from '../tap/TapCircle';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../utils/cn';

interface LiveMatchViewProps {
  yourUsername: string;
  yourCountry: string;
  yourTaps: number;
  opponentUsername: string;
  opponentCountry: string;
  opponentTaps: number;
  timeRemainingMs: number;
  currentTPS: number;
  isPractice: boolean;
  onTap: (isTrusted: boolean) => void;
}

function formatClock(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LiveMatchView({
  yourUsername,
  yourCountry,
  yourTaps,
  opponentUsername,
  opponentCountry,
  opponentTaps,
  timeRemainingMs,
  currentTPS,
  isPractice,
  onTap,
}: LiveMatchViewProps) {
  const { t } = useSettings();
  const total = yourTaps + opponentTaps;
  const yourShare = total === 0 ? 50 : (yourTaps / total) * 100;
  const urgent = timeRemainingMs <= 10_000;

  return (
    <div className="flex flex-1 flex-col px-5 pt-3">
      {/* opponent row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{flagEmoji(opponentCountry)}</span>
          <span className="font-body text-sm font-medium text-text-dim">
            {opponentUsername}
            {isPractice && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-neon-500">AI</span>}
          </span>
        </div>
        <span className="font-mono text-2xl font-semibold tabular-nums text-text-dim">{formatNumber(opponentTaps)}</span>
      </div>

      {/* tug-of-war bar */}
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-panel-light">
        <div className="h-full bg-neon-500 transition-[width] duration-200 ease-out" style={{ width: `${yourShare}%` }} />
        <div className="h-full flex-1 bg-steel transition-[width] duration-200 ease-out" />
      </div>

      {/* timer */}
      <div className="my-5 flex flex-col items-center">
        <span className="font-body text-[10px] uppercase tracking-[0.3em] text-text-dim">{t('matchTimeLeft')}</span>
        <span className={cn('font-mono text-4xl font-bold tabular-nums', urgent ? 'text-loss text-glow' : 'text-text')}>
          {formatClock(timeRemainingMs)}
        </span>
      </div>

      {/* your row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{flagEmoji(yourCountry)}</span>
          <span className="font-body text-sm font-medium text-neon-300">{yourUsername}</span>
        </div>
        <span className="font-mono text-3xl font-bold tabular-nums text-neon-400 text-glow">{formatNumber(yourTaps)}</span>
      </div>

      <div className="mt-4 flex flex-1 items-center justify-center pb-6">
        <TapCircle onTap={onTap} compact tps={currentTPS} label="TAP" />
      </div>
    </div>
  );
}

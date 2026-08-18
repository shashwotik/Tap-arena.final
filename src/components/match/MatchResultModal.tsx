import { Trophy, Skull, Minus } from 'lucide-react';
import type { MatchOutcome } from '../../types';
import { formatNumber } from '../../utils/format';
import { flagEmoji } from '../../config/countries';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../utils/cn';

interface MatchResultModalProps {
  outcome: MatchOutcome | null;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export function MatchResultModal({ outcome, onPlayAgain, onBackHome }: MatchResultModalProps) {
  const { t } = useSettings();
  if (!outcome) return null;

  const isWin = outcome.result === 'win';
  const isDraw = outcome.result === 'draw';
  const accentColor = isDraw ? 'var(--color-text-dim)' : isWin ? 'var(--color-win)' : 'var(--color-loss)';

  return (
    <Modal open={Boolean(outcome)} dismissible={false}>
      <div className="text-center">
        {outcome.isPractice && (
          <span className="mb-3 inline-block rounded-full border border-steel px-2.5 py-0.5 font-body text-[10px] uppercase tracking-widest text-text-dim">
            {t('matchPracticeLabel')}
          </span>
        )}

        <div
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2"
          style={{ borderColor: accentColor, boxShadow: isDraw ? 'none' : `0 0 24px ${accentColor}66` }}
        >
          {isDraw ? (
            <Minus className="text-text-dim" />
          ) : isWin ? (
            <Trophy style={{ color: accentColor }} />
          ) : (
            <Skull style={{ color: accentColor }} />
          )}
        </div>

        <h2 className="font-display text-2xl font-bold" style={{ color: accentColor }}>
          {isDraw ? t('matchDraw') : isWin ? t('matchWinner') : t('matchLoser')}
        </h2>

        <p className="mt-1 text-sm text-text-dim">
          {flagEmoji(outcome.opponentCountry)} {outcome.opponentUsername}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="chamfer-sm border border-steel bg-panel-light px-3 py-3">
            <p className="text-[10px] uppercase tracking-widest text-text-dim">{t('matchYou')}</p>
            <p className="font-mono text-xl tabular-nums text-text">{formatNumber(outcome.yourTaps)}</p>
          </div>
          <div className="chamfer-sm border border-steel bg-panel-light px-3 py-3">
            <p className="text-[10px] uppercase tracking-widest text-text-dim">{t('matchOpponent')}</p>
            <p className="font-mono text-xl tabular-nums text-text">{formatNumber(outcome.opponentTaps)}</p>
          </div>
        </div>

        <div className="mt-3 chamfer-sm border border-steel px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-text-dim">{t('matchTapDifference')}</p>
          <p className="font-mono text-lg tabular-nums text-neon-400">{formatNumber(outcome.tapDifference)}</p>
        </div>

        {!outcome.isPractice && outcome.reward !== 0 && (
          <p className={cn('mt-4 font-mono text-sm tabular-nums', outcome.reward > 0 ? 'text-win' : 'text-loss')}>
            {outcome.reward > 0 ? '+' : ''}
            {formatNumber(outcome.reward)} {outcome.reward > 0 ? t('matchReward') : t('matchPenalty')}
          </p>
        )}
        {outcome.isPractice && <p className="mt-4 text-xs text-text-dim">{t('matchPracticeNote')}</p>}

        <div className="mt-7 flex flex-col gap-2.5">
          <Button onClick={onPlayAgain} fullWidth>
            {t('matchPlayAgain')}
          </Button>
          <Button onClick={onBackHome} variant="secondary" fullWidth>
            {t('matchBackHome')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

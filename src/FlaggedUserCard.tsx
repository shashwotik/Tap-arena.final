import { ShieldAlert, Ban, RotateCcw, Check } from 'lucide-react';
import type { UserProfile } from '../../types';
import { flagEmoji } from '../../config/countries';
import { formatNumber } from '../../utils/format';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';

interface FlaggedUserCardProps {
  user: UserProfile;
  onDismiss: (uid: string) => void;
  onBan: (uid: string, banned: boolean) => void;
  onResetTaps: (uid: string) => void;
}

export function FlaggedUserCard({ user, onDismiss, onBan, onResetTaps }: FlaggedUserCardProps) {
  const { t } = useSettings();
  const uniqueReasons = Array.from(new Set(user.flagReasons));

  return (
    <div className="chamfer glass-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{flagEmoji(user.countryCode)}</span>
          <div>
            <p className="font-body text-sm font-semibold text-text">{user.username}</p>
            <p className="font-mono text-[11px] tabular-nums text-text-dim">{formatNumber(user.totalTaps)} taps</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-loss/40 bg-loss/10 px-2.5 py-1">
          <ShieldAlert size={12} className="text-loss" />
          <span className="font-mono text-[11px] tabular-nums text-loss">
            {t('adminSuspicionScore')}: {user.suspicionScore}
          </span>
        </div>
      </div>

      {uniqueReasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {uniqueReasons.map((reason) => (
            <span key={reason} className="rounded-full border border-steel px-2 py-0.5 font-mono text-[10px] tracking-wide text-text-dim">
              {reason}
            </span>
          ))}
        </div>
      )}

      {user.banned && (
        <p className="mt-3 font-body text-xs font-semibold uppercase tracking-wider text-loss">Currently banned</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="ghost" icon={<Check size={14} />} onClick={() => onDismiss(user.uid)} className="text-xs">
          {t('adminDismiss')}
        </Button>
        <Button variant="ghost" icon={<RotateCcw size={14} />} onClick={() => onResetTaps(user.uid)} className="text-xs">
          {t('adminResetTaps')}
        </Button>
        <Button variant="danger" icon={<Ban size={14} />} onClick={() => onBan(user.uid, !user.banned)} className="text-xs">
          {user.banned ? 'Unban' : t('adminBan')}
        </Button>
      </div>
    </div>
  );
}

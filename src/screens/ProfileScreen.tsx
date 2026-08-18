import { Calendar, Flag, Trophy, Target, TrendingUp, Zap, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getLevelInfo } from '../config/levels';
import { formatNumber, formatDate, formatPercent } from '../utils/format';
import { flagEmoji, countryName } from '../config/countries';
import { StatPill } from '../components/ui/StatPill';
import { TierBadge } from '../components/ui/TierBadge';
import { Button } from '../components/ui/Button';

export function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { t } = useSettings();
  if (!profile) return null;

  const levelInfo = getLevelInfo(profile.totalTaps);
  const winRate = profile.matchesPlayed > 0 ? (profile.wins / profile.matchesPlayed) * 100 : 0;

  return (
    <div className="min-h-[100dvh] px-5 pb-28 pt-6">
      <h1 className="font-display text-xl font-bold text-text">{t('profileTitle')}</h1>

      <div className="mt-5 chamfer glass-panel flex flex-col items-center gap-3 px-6 py-8 text-center shadow-glow">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-500 bg-panel text-2xl shadow-glow">
          {flagEmoji(profile.countryCode)}
        </div>
        <div>
          <p className="font-display text-lg font-bold text-text">{profile.username}</p>
          <p className="font-body text-xs text-text-dim">{countryName(profile.countryCode)}</p>
        </div>
        <TierBadge tier={levelInfo.tier} size="md" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatPill icon={<Calendar size={12} />} label={t('profileJoinDate')} value={formatDate(profile.createdAt)} mono={false} />
        <StatPill icon={<Flag size={12} />} label={t('profileLevel')} value={levelInfo.levelName} mono={false} />
        <StatPill icon={<Zap size={12} />} label={t('profileTotalTaps')} value={formatNumber(profile.totalTaps)} accent />
        <StatPill icon={<TrendingUp size={12} />} label={t('profileHighestTps')} value={String(profile.highestTPS)} />
        <StatPill icon={<Trophy size={12} />} label={t('profileWins')} value={String(profile.wins)} />
        <StatPill icon={<Target size={12} />} label={t('profileLosses')} value={String(profile.losses)} />
        <StatPill icon={<Swords size={12} />} label={t('profileMatchesPlayed')} value={String(profile.matchesPlayed)} />
        <StatPill icon={<Trophy size={12} />} label={t('profileWinRate')} value={formatPercent(winRate)} />
      </div>

      <Button variant="secondary" fullWidth className="mt-8" onClick={() => void signOut()}>
        {t('signOut')}
      </Button>
    </div>
  );
}

import { Home, Trophy, Swords, User, Settings, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';
import { soundManager } from '../../utils/soundManager';
import { vibrate } from '../../utils/haptics';
import type { Screen } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import type { TranslationKey } from '../../config/i18n';

interface BottomNavProps {
  current: Screen;
  onChange: (screen: Screen) => void;
}

const ITEMS: { screen: Screen; icon: LucideIcon; labelKey: TranslationKey }[] = [
  { screen: 'home', icon: Home, labelKey: 'navHome' },
  { screen: 'leaderboard', icon: Trophy, labelKey: 'navLeaderboard' },
  { screen: 'match', icon: Swords, labelKey: 'navMatch' },
  { screen: 'profile', icon: User, labelKey: 'navProfile' },
  { screen: 'settings', icon: Settings, labelKey: 'navSettings' },
];

export function BottomNav({ current, onChange }: BottomNavProps) {
  const { t } = useSettings();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-steel bg-ink/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {ITEMS.map(({ screen, icon: Icon, labelKey }) => {
          const active = current === screen;
          return (
            <button
              key={screen}
              onClick={() => {
                if (screen !== current) {
                  soundManager.playClick();
                  vibrate(6);
                }
                onChange(screen);
              }}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 no-select"
            >
              {active && (
                <motion.span
                  layoutId="nav-active-indicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-neon-400 shadow-glow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={2}
                className={cn('transition-colors', active ? 'text-neon-400 drop-shadow-[0_0_6px_rgba(63,169,255,0.7)]' : 'text-text-dim')}
              />
              <span className={cn('font-body text-[10px] font-medium tracking-wide', active ? 'text-neon-300' : 'text-text-dim')}>
                {t(labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

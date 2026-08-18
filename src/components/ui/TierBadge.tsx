import { cn } from '../../utils/cn';
import { TIER_COLORS } from '../../config/levels';
import type { Tier } from '../../types';

interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<TierBadgeProps['size']>, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3.5 py-1.5',
};

export function TierBadge({ tier, size = 'md', className }: TierBadgeProps) {
  const palette = TIER_COLORS[tier];
  const legendary = tier === 'Legendary';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-display font-bold uppercase tracking-wider text-void',
        SIZE_CLASSES[size],
        legendary && 'legendary-shimmer',
        className,
      )}
      style={
        legendary
          ? { boxShadow: `0 0 16px ${palette.glow}` }
          : { background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`, boxShadow: `0 0 14px ${palette.glow}` }
      }
    >
      {tier}
    </span>
  );
}

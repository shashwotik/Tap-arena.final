import type { LevelDefinition, LevelInfo, Tier } from '../types';

/**
 * The 10-level ladder. This is the single source of truth for rank
 * thresholds — everything else (progress bars, leaderboard chips, the
 * level-up modal) derives from `getLevelInfo`, nothing stores `level`
 * as a separate persisted field, so it can never drift out of sync.
 */
export const LEVELS: LevelDefinition[] = [
  { level: 1, requiredTaps: 100, name: 'Bronze I', tier: 'Bronze' },
  { level: 2, requiredTaps: 1_000, name: 'Bronze II', tier: 'Bronze' },
  { level: 3, requiredTaps: 10_000, name: 'Bronze III', tier: 'Bronze' },
  { level: 4, requiredTaps: 25_000, name: 'Silver I', tier: 'Silver' },
  { level: 5, requiredTaps: 50_000, name: 'Silver II', tier: 'Silver' },
  { level: 6, requiredTaps: 100_000, name: 'Gold I', tier: 'Gold' },
  { level: 7, requiredTaps: 250_000, name: 'Gold II', tier: 'Gold' },
  { level: 8, requiredTaps: 500_000, name: 'Diamond I', tier: 'Diamond' },
  { level: 9, requiredTaps: 750_000, name: 'Diamond II', tier: 'Diamond' },
  { level: 10, requiredTaps: 1_000_000, name: 'Legendary', tier: 'Legendary' },
];

export const MAX_LEVEL = LEVELS[LEVELS.length - 1];

export interface TierPalette {
  text: string;
  from: string;
  to: string;
  glow: string;
}

export const TIER_COLORS: Record<Tier, TierPalette> = {
  Bronze: { text: '#e7ab77', from: '#8a5a2e', to: '#c9824b', glow: 'rgba(201,130,75,0.5)' },
  Silver: { text: '#e6ecf3', from: '#7d8a99', to: '#c7d3de', glow: 'rgba(199,211,222,0.5)' },
  Gold: { text: '#ffe29e', from: '#b8860b', to: '#ffd873', glow: 'rgba(255,216,115,0.55)' },
  Diamond: { text: '#c5f5ff', from: '#1f8fae', to: '#8fe9ff', glow: 'rgba(143,233,255,0.55)' },
  Legendary: { text: '#ffffff', from: '#3fa9ff', to: '#b06bff', glow: 'rgba(120,150,255,0.6)' },
};

/**
 * Derives the player's rank + progress purely from their total taps.
 * Below Level 1's threshold, the player is "Unranked" (level 0) and the
 * progress bar shows movement toward Bronze I.
 */
export function getLevelInfo(totalTapsRaw: number): LevelInfo {
  const totalTaps = Math.max(0, Math.floor(totalTapsRaw || 0));

  let currentDef: LevelDefinition | null = null;
  let nextDef: LevelDefinition | null = null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalTaps >= LEVELS[i].requiredTaps) {
      currentDef = LEVELS[i];
      nextDef = LEVELS[i + 1] ?? null;
    } else {
      if (!currentDef) nextDef = LEVELS[i];
      break;
    }
  }

  if (!currentDef) {
    const first = LEVELS[0];
    return {
      level: 0,
      levelName: 'Unranked',
      tier: 'Bronze',
      currentTaps: totalTaps,
      floorTaps: 0,
      nextLevelTaps: first.requiredTaps,
      progressPercent: Math.min(100, (totalTaps / first.requiredTaps) * 100),
      tapsToNext: first.requiredTaps - totalTaps,
      isMaxLevel: false,
    };
  }

  if (!nextDef) {
    return {
      level: currentDef.level,
      levelName: currentDef.name,
      tier: currentDef.tier,
      currentTaps: totalTaps,
      floorTaps: currentDef.requiredTaps,
      nextLevelTaps: null,
      progressPercent: 100,
      tapsToNext: null,
      isMaxLevel: true,
    };
  }

  const span = nextDef.requiredTaps - currentDef.requiredTaps;
  const progressed = totalTaps - currentDef.requiredTaps;

  return {
    level: currentDef.level,
    levelName: currentDef.name,
    tier: currentDef.tier,
    currentTaps: totalTaps,
    floorTaps: currentDef.requiredTaps,
    nextLevelTaps: nextDef.requiredTaps,
    progressPercent: Math.min(100, Math.max(0, (progressed / span) * 100)),
    tapsToNext: nextDef.requiredTaps - totalTaps,
    isMaxLevel: false,
  };
}

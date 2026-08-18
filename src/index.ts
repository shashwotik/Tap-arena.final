// ---------------------------------------------------------------------------
// Levels & ranks
// ---------------------------------------------------------------------------

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Legendary';

export interface LevelDefinition {
  level: number;
  requiredTaps: number;
  name: string;
  tier: Tier;
}

export interface LevelInfo {
  level: number; // 0 = Unranked (below Level 1's threshold)
  levelName: string;
  tier: Tier;
  currentTaps: number;
  floorTaps: number;
  nextLevelTaps: number | null;
  progressPercent: number;
  tapsToNext: number | null;
  isMaxLevel: boolean;
}

// ---------------------------------------------------------------------------
// User profile (Firestore: users/{uid})
// ---------------------------------------------------------------------------

export interface UserProfile {
  uid: string;
  username: string;
  countryCode: string;
  totalTaps: number;
  highestTPS: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  createdAt: number; // epoch ms
  lastActive: number; // epoch ms
  suspicious: boolean;
  suspicionScore: number;
  flagReasons: string[];
  banned: boolean;
  isAdmin: boolean;
}

// ---------------------------------------------------------------------------
// Match history (Firestore: users/{uid}/matchHistory/{id})
// ---------------------------------------------------------------------------

export type MatchResult = 'win' | 'loss' | 'draw';

export interface MatchHistoryEntry {
  id: string;
  opponentUid: string;
  opponentUsername: string;
  opponentCountry: string;
  yourTaps: number;
  opponentTaps: number;
  result: MatchResult;
  tapDifference: number;
  isPractice: boolean;
  playedAt: number;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  username: string;
  countryCode: string;
  totalTaps: number;
}

// ---------------------------------------------------------------------------
// Live matches (Realtime Database)
// ---------------------------------------------------------------------------

export type MatchmakingState =
  | 'idle'
  | 'searching'
  | 'countdown'
  | 'live'
  | 'finished'
  | 'cancelled'
  | 'error';

export interface LiveMatchPlayer {
  uid: string;
  username: string;
  countryCode: string;
}

export interface LiveMatchState {
  matchId: string;
  player1: LiveMatchPlayer;
  player2: LiveMatchPlayer;
  countdownStart: number; // epoch ms
  startTime: number; // epoch ms, when live tapping begins
  duration: number; // ms
  taps: Record<string, number>;
  finished: Record<string, boolean>;
  winner: string | 'draw' | null;
  createdAt: number;
}

export interface QueueEntry {
  uid: string;
  username: string;
  countryCode: string;
  joinedAt: number;
}

export interface MatchOutcome {
  result: MatchResult;
  yourTaps: number;
  opponentTaps: number;
  opponentUsername: string;
  opponentCountry: string;
  tapDifference: number;
  reward: number;
  isPractice: boolean;
}

// ---------------------------------------------------------------------------
// Anti-cheat
// ---------------------------------------------------------------------------

export interface AntiCheatFlag {
  reason: string;
  detail: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// App-wide
// ---------------------------------------------------------------------------

export type Screen = 'home' | 'leaderboard' | 'match' | 'profile' | 'settings' | 'admin';

export type ThemeMode = 'dark' | 'light';

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  language: string;
  theme: ThemeMode;
}

import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from './config';
import type { LeaderboardEntry } from '../types';

const RANK_LIMIT = 100;

/**
 * Subscribes to the top 100 players by totalTaps. A single-field orderBy
 * is auto-indexed by Firestore, so this works with zero manual index setup.
 */
export function subscribeToLeaderboard(cb: (entries: LeaderboardEntry[]) => void) {
  const q = query(collection(db, 'users'), orderBy('totalTaps', 'desc'), limit(RANK_LIMIT));
  return onSnapshot(q, (snap) => {
    const entries: LeaderboardEntry[] = snap.docs.map((d, index) => {
      const data = d.data();
      return {
        rank: index + 1,
        uid: d.id,
        username: data.username ?? 'Player',
        countryCode: data.countryCode ?? 'US',
        totalTaps: data.totalTaps ?? 0,
      };
    });
    cb(entries);
  });
}

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  increment,
  serverTimestamp,
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  arrayUnion,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import type { AntiCheatFlag, MatchHistoryEntry, MatchResult, UserProfile } from '../types';
import { ADMIN_AUTO_FLAG_THRESHOLD, ADMIN_SUSPICIOUS_LIST_LIMIT } from '../config/constants';

const usersCol = collection(db, 'users');

function userRef(uid: string) {
  return doc(db, 'users', uid);
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

function normalizeProfile(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    username: data.username ?? 'Player',
    countryCode: data.countryCode ?? 'US',
    totalTaps: data.totalTaps ?? 0,
    highestTPS: data.highestTPS ?? 0,
    wins: data.wins ?? 0,
    losses: data.losses ?? 0,
    matchesPlayed: data.matchesPlayed ?? 0,
    createdAt: toMillis(data.createdAt),
    lastActive: toMillis(data.lastActive),
    suspicious: data.suspicious ?? false,
    suspicionScore: data.suspicionScore ?? 0,
    flagReasons: data.flagReasons ?? [],
    banned: data.banned ?? false,
    isAdmin: data.isAdmin ?? false,
  };
}

export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? normalizeProfile(uid, snap.data()) : null;
}

/** Live-subscribes to a profile so every screen reflects taps/rewards instantly. */
export function subscribeToProfile(uid: string, cb: (profile: UserProfile | null) => void) {
  return onSnapshot(userRef(uid), (snap) => {
    cb(snap.exists() ? normalizeProfile(uid, snap.data()) : null);
  });
}

export async function createProfile(uid: string, username: string, countryCode: string) {
  await setDoc(userRef(uid), {
    uid,
    username,
    countryCode,
    totalTaps: 0,
    highestTPS: 0,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    suspicious: false,
    suspicionScore: 0,
    flagReasons: [],
    banned: false,
    isAdmin: false,
  });
}

/**
 * Applies a tap delta. Positive deltas (tapping, match wins) use a plain
 * increment; negative deltas (match losses) run through a transaction so
 * totalTaps is clamped at 0 and can never go negative.
 *
 * Firestore security rules independently cap the size of any single
 * increment — this function is the trusted-by-default path, the rules
 * are the backstop against a modified/forged request.
 */
export async function addTaps(uid: string, amount: number) {
  if (amount === 0) return;
  if (amount > 0) {
    await updateDoc(userRef(uid), { totalTaps: increment(amount), lastActive: serverTimestamp() });
    return;
  }
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef(uid));
    const current = (snap.data()?.totalTaps as number) ?? 0;
    tx.update(userRef(uid), { totalTaps: Math.max(0, current + amount), lastActive: serverTimestamp() });
  });
}

export async function updateHighestTPS(uid: string, tps: number) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef(uid));
    const current = (snap.data()?.highestTPS as number) ?? 0;
    if (tps > current) tx.update(userRef(uid), { highestTPS: tps });
  });
}

export async function recordMatchResult(uid: string, result: MatchResult) {
  await updateDoc(userRef(uid), {
    wins: increment(result === 'win' ? 1 : 0),
    losses: increment(result === 'loss' ? 1 : 0),
    matchesPlayed: increment(1),
  });
}

/**
 * Client-reported anti-cheat flag. This is advisory: it never blocks or
 * punishes automatically, it only raises suspicionScore so a pattern of
 * violations surfaces in the admin queue for a human to review.
 */
export async function reportFlag(uid: string, flag: AntiCheatFlag) {
  await updateDoc(userRef(uid), {
    flagReasons: arrayUnion(flag.reason),
    suspicionScore: increment(1),
  });
  const snap = await getDoc(userRef(uid));
  const score = (snap.data()?.suspicionScore as number) ?? 0;
  if (score >= ADMIN_AUTO_FLAG_THRESHOLD) {
    await updateDoc(userRef(uid), { suspicious: true });
  }
}

export async function addMatchHistoryEntry(uid: string, entry: Omit<MatchHistoryEntry, 'id'>) {
  const historyCol = collection(db, 'users', uid, 'matchHistory');
  await addDoc(historyCol, { ...entry, playedAt: serverTimestamp() });
}

export async function fetchMatchHistory(uid: string, max = 20): Promise<MatchHistoryEntry[]> {
  const historyCol = collection(db, 'users', uid, 'matchHistory');
  const snap = await getDocs(query(historyCol, orderBy('playedAt', 'desc'), limit(max)));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      opponentUid: data.opponentUid,
      opponentUsername: data.opponentUsername,
      opponentCountry: data.opponentCountry,
      yourTaps: data.yourTaps,
      opponentTaps: data.opponentTaps,
      result: data.result,
      tapDifference: data.tapDifference,
      isPractice: data.isPractice ?? false,
      playedAt: toMillis(data.playedAt),
    };
  });
}

export async function resetProgress(uid: string) {
  await updateDoc(userRef(uid), { totalTaps: 0 });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/**
 * Flagged accounts, sorted client-side to avoid requiring a composite
 * Firestore index just for the moderation queue.
 */
export async function fetchSuspiciousUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(usersCol, where('suspicious', '==', true), limit(ADMIN_SUSPICIOUS_LIST_LIMIT)));
  return snap.docs
    .map((d) => normalizeProfile(d.id, d.data()))
    .sort((a, b) => b.suspicionScore - a.suspicionScore);
}

export async function adminDismissFlags(uid: string) {
  await updateDoc(userRef(uid), { suspicious: false, suspicionScore: 0, flagReasons: [] });
}

export async function adminSetBanned(uid: string, banned: boolean) {
  await updateDoc(userRef(uid), { banned });
}

export async function adminResetTaps(uid: string) {
  await updateDoc(userRef(uid), { totalTaps: 0 });
}

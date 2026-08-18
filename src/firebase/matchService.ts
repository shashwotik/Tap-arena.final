import { ref, set, onValue, remove, update, push, runTransaction, onDisconnect, type Unsubscribe } from 'firebase/database';
import { rtdb } from './config';
import type { LiveMatchState, QueueEntry } from '../types';
import { MATCH_COUNTDOWN_MS, MATCH_DURATION_MS } from '../config/constants';

function queueRef(uid: string) {
  return ref(rtdb, `matchmakingQueue/${uid}`);
}
function matchRef(matchId: string) {
  return ref(rtdb, `matches/${matchId}`);
}
function assignmentRef(uid: string) {
  return ref(rtdb, `playerMatchAssignment/${uid}`);
}

export async function joinQueue(entry: QueueEntry) {
  const r = queueRef(entry.uid);
  await set(r, entry);
  onDisconnect(r).remove();
}

export async function leaveQueue(uid: string) {
  const r = queueRef(uid);
  onDisconnect(r).cancel();
  await remove(r);
}

export function listenToQueue(cb: (entries: QueueEntry[]) => void): Unsubscribe {
  return onValue(ref(rtdb, 'matchmakingQueue'), (snap) => {
    const val = snap.val() as Record<string, QueueEntry> | null;
    cb(val ? Object.values(val) : []);
  });
}

export function listenForAssignment(uid: string, cb: (matchId: string) => void): Unsubscribe {
  return onValue(assignmentRef(uid), (snap) => {
    const matchId = snap.val() as string | null;
    if (matchId) cb(matchId);
  });
}

export async function clearAssignment(uid: string) {
  await remove(assignmentRef(uid));
}

/**
 * Pairs two waiting players. Only ever invoked by the client whose uid
 * sorts first among current queue entries — a lightweight leader-election
 * trick that avoids two clients racing to create the same match without
 * needing a transaction: at any single queue snapshot there's exactly one
 * "smallest" uid, so exactly one client ever acts on it. Both players
 * (winner included) discover the match through their own
 * playerMatchAssignment listener.
 */
export async function attemptPairing(queueEntries: QueueEntry[], selfUid: string) {
  const sorted = [...queueEntries].sort((a, b) => a.uid.localeCompare(b.uid));
  if (sorted.length < 2) return;
  const [p1, p2] = sorted;
  if (p1.uid !== selfUid) return;

  const matchId = push(ref(rtdb, 'matches')).key;
  if (!matchId) return;
  const now = Date.now();

  const matchData: LiveMatchState = {
    matchId,
    player1: { uid: p1.uid, username: p1.username, countryCode: p1.countryCode },
    player2: { uid: p2.uid, username: p2.username, countryCode: p2.countryCode },
    countdownStart: now,
    startTime: now + MATCH_COUNTDOWN_MS,
    duration: MATCH_DURATION_MS,
    taps: { [p1.uid]: 0, [p2.uid]: 0 },
    finished: { [p1.uid]: false, [p2.uid]: false },
    winner: null,
    createdAt: now,
  };

  await update(ref(rtdb), {
    [`matches/${matchId}`]: matchData,
    [`matchmakingQueue/${p1.uid}`]: null,
    [`matchmakingQueue/${p2.uid}`]: null,
    [`playerMatchAssignment/${p1.uid}`]: matchId,
    [`playerMatchAssignment/${p2.uid}`]: matchId,
  });
}

export function listenToMatch(matchId: string, cb: (match: LiveMatchState | null) => void): Unsubscribe {
  return onValue(matchRef(matchId), (snap) => cb(snap.val() as LiveMatchState | null));
}

export async function submitLiveTaps(matchId: string, uid: string, taps: number) {
  await set(ref(rtdb, `matches/${matchId}/taps/${uid}`), taps);
}

export async function markFinished(matchId: string, uid: string, finalTaps: number) {
  await update(ref(rtdb), {
    [`matches/${matchId}/taps/${uid}`]: finalTaps,
    [`matches/${matchId}/finished/${uid}`]: true,
  });
}

/**
 * First client to observe both players finished wins the right to write
 * the result — an RTDB transaction guarantees only one write ever
 * "sticks" even if both clients attempt it at the same instant.
 */
export async function finalizeWinner(matchId: string, winner: string | 'draw') {
  await runTransaction(ref(rtdb, `matches/${matchId}/winner`), (current) => (current === null ? winner : undefined));
}

export async function cleanupMatch(matchId: string) {
  await remove(matchRef(matchId));
}

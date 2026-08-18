/**
 * OPTIONAL production hardening — not required to run Tap Legends.
 *
 * The client app works fully against Auth + Firestore + Realtime Database
 * alone (see /firestore.rules and /database.rules.json for the
 * client-trusted defenses: bounded increments, participant-only match
 * access). Deploying these two functions moves the highest-value checks
 * server-side instead:
 *
 *  - submitTapBatch: a sequence number makes replayed/duplicated batch
 *    requests a no-op, and implausible rates get flagged server-side
 *    even if a modified client skipped local anti-cheat entirely.
 *  - finalizeMatch: reads both players' final tap counts with the Admin
 *    SDK (which bypasses Realtime Database rules) so match rewards never
 *    depend on trusting either client's own report of the result.
 *
 * Deploy with `npm run deploy` from /functions, then point the client at
 * these by wiring VITE_USE_CLOUD_FUNCTIONS=true into userService /
 * matchService (see README → "Cloud Functions hardening").
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';

initializeApp();

const MAX_TAPS_PER_BATCH = 200;
const IMPLAUSIBLE_SERVER_TPS = 20;
const WIN_REWARD = 1000;
const LOSS_PENALTY = 2000;

interface TapBatchRequest {
  count: number;
  clientStart: number;
  clientEnd: number;
  seq: number;
}

export const submitTapBatch = onCall<TapBatchRequest>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const { count, clientStart, clientEnd, seq } = request.data;
  if (!Number.isFinite(count) || count <= 0 || count > MAX_TAPS_PER_BATCH) {
    throw new HttpsError('invalid-argument', 'Implausible batch size.');
  }
  if (!Number.isFinite(seq) || seq < 0) {
    throw new HttpsError('invalid-argument', 'Missing sequence number.');
  }

  const elapsedMs = Math.max(1, clientEnd - clientStart);
  const impliedTPS = count / (elapsedMs / 1000);

  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Profile not found.');
    const data = snap.data() ?? {};

    // A sequence number at or below the last accepted one means this
    // batch was already applied (or is a stale retry) — no-op instead
    // of erroring, so a retried network request can't double-count.
    const lastSeq = (data.lastTapSeq as number) ?? -1;
    if (seq <= lastSeq) return;

    const updates: Record<string, unknown> = {
      totalTaps: FieldValue.increment(count),
      lastTapSeq: seq,
      lastActive: FieldValue.serverTimestamp(),
    };

    if (impliedTPS > IMPLAUSIBLE_SERVER_TPS) {
      updates.suspicionScore = FieldValue.increment(1);
      updates.flagReasons = FieldValue.arrayUnion('SERVER_TPS_EXCEEDED');
    }

    tx.update(userRef, updates);
  });

  return { ok: true };
});

interface FinalizeMatchRequest {
  matchId: string;
}

async function applyMatchResult(db: Firestore, playerUid: string, result: 'win' | 'loss' | 'draw') {
  const reward = result === 'win' ? WIN_REWARD : result === 'loss' ? -LOSS_PENALTY : 0;
  const ref = db.collection('users').doc(playerUid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = (snap.data()?.totalTaps as number) ?? 0;
    tx.update(ref, {
      totalTaps: Math.max(0, current + reward),
      wins: FieldValue.increment(result === 'win' ? 1 : 0),
      losses: FieldValue.increment(result === 'loss' ? 1 : 0),
      matchesPlayed: FieldValue.increment(1),
    });
  });
}

export const finalizeMatch = onCall<FinalizeMatchRequest>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const { matchId } = request.data;
  if (!matchId) throw new HttpsError('invalid-argument', 'matchId is required.');

  const rtdb = getDatabase();
  const matchSnap = await rtdb.ref(`matches/${matchId}`).get();
  if (!matchSnap.exists()) throw new HttpsError('not-found', 'Match not found.');
  const match = matchSnap.val();

  const p1Uid: string = match.player1?.uid;
  const p2Uid: string = match.player2?.uid;
  if (uid !== p1Uid && uid !== p2Uid) {
    throw new HttpsError('permission-denied', 'Not a participant in this match.');
  }
  if (match.resolved) return { ok: true, alreadyResolved: true };

  const p1Taps: number = match.taps?.[p1Uid] ?? 0;
  const p2Taps: number = match.taps?.[p2Uid] ?? 0;
  const winnerUid = p1Taps === p2Taps ? null : p1Taps > p2Taps ? p1Uid : p2Uid;

  const db = getFirestore();
  await applyMatchResult(db, p1Uid, winnerUid === null ? 'draw' : winnerUid === p1Uid ? 'win' : 'loss');
  await applyMatchResult(db, p2Uid, winnerUid === null ? 'draw' : winnerUid === p2Uid ? 'win' : 'loss');
  await rtdb.ref(`matches/${matchId}/resolved`).set(true);

  return { ok: true, winnerUid };
});

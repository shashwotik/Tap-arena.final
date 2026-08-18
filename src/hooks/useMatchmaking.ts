import { useCallback, useEffect, useRef, useState } from 'react';
import {
  joinQueue as joinQueueService,
  leaveQueue as leaveQueueService,
  listenToQueue,
  listenForAssignment,
  clearAssignment,
  attemptPairing,
  listenToMatch,
  submitLiveTaps,
  markFinished,
  finalizeWinner,
} from '../firebase/matchService';
import { addTaps, recordMatchResult, addMatchHistoryEntry, updateHighestTPS } from '../firebase/userService';
import { useAntiCheat } from './useAntiCheat';
import { soundManager } from '../utils/soundManager';
import { vibrate, HAPTIC } from '../utils/haptics';
import {
  MATCH_TAP_FLUSH_MS,
  MATCH_WIN_REWARD,
  MATCH_LOSS_PENALTY,
  QUEUE_AI_FALLBACK_MS,
  MATCH_COUNTDOWN_MS,
  MATCH_DURATION_MS,
} from '../config/constants';
import type { AntiCheatFlag, LiveMatchState, MatchOutcome, MatchmakingState, QueueEntry } from '../types';

interface Identity {
  uid: string;
  username: string;
  countryCode: string;
}

interface OpponentInfo {
  uid: string;
  username: string;
  countryCode: string;
}

interface MatchMeta {
  matchId: string;
  startTime: number;
  duration: number;
  opponentUid: string;
  isPractice: boolean;
}

const CLOCK_TICK_MS = 100;
const ABANDON_GRACE_MS = 9_000;
const AI_COUNTRY_POOL = ['US', 'BR', 'JP', 'DE', 'IN', 'KR', 'GB', 'BD'];

export function useMatchmaking(me: Identity, onFlag: (flag: AntiCheatFlag) => void) {
  const [state, setState] = useState<MatchmakingState>('idle');
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [yourTaps, setYourTaps] = useState(0);
  const [opponentTaps, setOpponentTaps] = useState(0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState(MATCH_DURATION_MS);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [isPractice, setIsPractice] = useState(false);
  const [showAiOffer, setShowAiOffer] = useState(false);

  const antiCheat = useAntiCheat(onFlag);

  const meRef = useRef(me);
  const stateRef = useRef(state);
  const matchMetaRef = useRef<MatchMeta | null>(null);
  const opponentInfoRef = useRef<OpponentInfo | null>(null);
  const isPracticeRef = useRef(false);
  const localTapsRef = useRef(0);
  const opponentTapsRef = useRef(0);
  const resolvedRef = useRef(false);
  const finishedSelfRef = useRef(false);
  const lastFlushAtRef = useRef(0);
  const clockIntervalRef = useRef<number | null>(null);
  const aiTimeoutRef = useRef<number | null>(null);
  const aiFallbackTimerRef = useRef<number | null>(null);
  const abandonTimeoutRef = useRef<number | null>(null);
  const queueUnsubRef = useRef<(() => void) | null>(null);
  const assignmentUnsubRef = useRef<(() => void) | null>(null);
  const matchUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    meRef.current = me;
  }, [me]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearTimers = useCallback(() => {
    if (clockIntervalRef.current) window.clearInterval(clockIntervalRef.current);
    if (aiTimeoutRef.current) window.clearTimeout(aiTimeoutRef.current);
    if (aiFallbackTimerRef.current) window.clearTimeout(aiFallbackTimerRef.current);
    if (abandonTimeoutRef.current) window.clearTimeout(abandonTimeoutRef.current);
    clockIntervalRef.current = null;
    aiTimeoutRef.current = null;
    aiFallbackTimerRef.current = null;
    abandonTimeoutRef.current = null;
  }, []);

  const detachListeners = useCallback(() => {
    queueUnsubRef.current?.();
    assignmentUnsubRef.current?.();
    matchUnsubRef.current?.();
    queueUnsubRef.current = null;
    assignmentUnsubRef.current = null;
    matchUnsubRef.current = null;
  }, []);

  const resolveOutcome = useCallback((myFinal: number, oppFinal: number, winnerField?: string | 'draw') => {
    if (clockIntervalRef.current) {
      window.clearInterval(clockIntervalRef.current);
      clockIntervalRef.current = null;
    }
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    const result = winnerField
      ? winnerField === 'draw'
        ? 'draw'
        : winnerField === meRef.current.uid
          ? 'win'
          : 'loss'
      : myFinal === oppFinal
        ? 'draw'
        : myFinal > oppFinal
          ? 'win'
          : 'loss';

    const reward = result === 'win' ? MATCH_WIN_REWARD : result === 'loss' ? -MATCH_LOSS_PENALTY : 0;
    const opp = opponentInfoRef.current;
    const peak = antiCheat.getPeakTPS();
    const practice = isPracticeRef.current;

    if (!practice) {
      if (reward !== 0) void addTaps(meRef.current.uid, reward);
      void recordMatchResult(meRef.current.uid, result);
      void addMatchHistoryEntry(meRef.current.uid, {
        opponentUid: opp?.uid ?? 'unknown',
        opponentUsername: opp?.username ?? 'Opponent',
        opponentCountry: opp?.countryCode ?? 'US',
        yourTaps: myFinal,
        opponentTaps: oppFinal,
        result,
        tapDifference: Math.abs(myFinal - oppFinal),
        isPractice: false,
        playedAt: Date.now(),
      });
      if (peak > 0) void updateHighestTPS(meRef.current.uid, peak);
    }

    if (result === 'win') {
      soundManager.playWin();
      vibrate(HAPTIC.win);
    } else if (result === 'loss') {
      soundManager.playLose();
      vibrate(HAPTIC.lose);
    }

    setOutcome({
      result,
      yourTaps: myFinal,
      opponentTaps: oppFinal,
      opponentUsername: opp?.username ?? 'Opponent',
      opponentCountry: opp?.countryCode ?? 'US',
      tapDifference: Math.abs(myFinal - oppFinal),
      reward,
      isPractice: practice,
    });
    setState('finished');
  }, [antiCheat]);

  const finishSelf = useCallback(() => {
    if (finishedSelfRef.current) return;
    finishedSelfRef.current = true;
    const meta = matchMetaRef.current;
    const finalTaps = localTapsRef.current;

    if (!meta || isPracticeRef.current) {
      resolveOutcome(finalTaps, opponentTapsRef.current);
      return;
    }

    void markFinished(meta.matchId, meRef.current.uid, finalTaps).then(() => {
      abandonTimeoutRef.current = window.setTimeout(() => {
        if (!resolvedRef.current) void finalizeWinner(meta.matchId, meRef.current.uid);
      }, ABANDON_GRACE_MS);
    });
  }, [resolveOutcome]);

  const handleMatchUpdate = useCallback((match: LiveMatchState) => {
    const meta = matchMetaRef.current;
    const opp = opponentInfoRef.current;
    if (!meta || !opp) return;

    const oppTaps = match.taps?.[opp.uid] ?? 0;
    opponentTapsRef.current = oppTaps;
    setOpponentTaps(oppTaps);

    const bothFinished = Boolean(match.finished?.[meRef.current.uid] && match.finished?.[opp.uid]);
    if (bothFinished && !match.winner && !resolvedRef.current) {
      const myFinal = match.taps?.[meRef.current.uid] ?? localTapsRef.current;
      const winnerUid = myFinal === oppTaps ? 'draw' : myFinal > oppTaps ? meRef.current.uid : opp.uid;
      void finalizeWinner(meta.matchId, winnerUid);
    }

    if (match.winner && !resolvedRef.current) {
      resolvedRef.current = true;
      const myFinal = match.taps?.[meRef.current.uid] ?? localTapsRef.current;
      resolveOutcome(myFinal, oppTaps, match.winner);
    }
  }, [resolveOutcome]);

  const scheduleAiTap = useCallback(() => {
    const delay = 90 + Math.random() * 150;
    aiTimeoutRef.current = window.setTimeout(() => {
      opponentTapsRef.current += 1;
      setOpponentTaps(opponentTapsRef.current);
      scheduleAiTap();
    }, delay);
  }, []);

  const startClock = useCallback(() => {
    if (clockIntervalRef.current) window.clearInterval(clockIntervalRef.current);
    let shownCountdown = -1;
    let liveStarted = false;

    clockIntervalRef.current = window.setInterval(() => {
      const meta = matchMetaRef.current;
      if (!meta) return;
      const now = Date.now();

      if (now < meta.startTime) {
        const secondsLeft = Math.max(0, Math.ceil((meta.startTime - now) / 1000));
        if (secondsLeft !== shownCountdown) {
          shownCountdown = secondsLeft;
          setCountdownValue(secondsLeft);
          soundManager.playCountdownTick();
          vibrate(HAPTIC.countdownTick);
        }
        return;
      }

      if (!liveStarted) {
        liveStarted = true;
        setCountdownValue(0);
        soundManager.playGo();
        vibrate(HAPTIC.go);
        setState('live');
        if (isPracticeRef.current) scheduleAiTap();
      }

      const remaining = Math.max(0, meta.startTime + meta.duration - now);
      setTimeRemainingMs(remaining);

      if (!isPracticeRef.current && now - lastFlushAtRef.current >= MATCH_TAP_FLUSH_MS) {
        lastFlushAtRef.current = now;
        void submitLiveTaps(meta.matchId, meRef.current.uid, localTapsRef.current);
      }

      if (remaining <= 0) {
        if (clockIntervalRef.current) {
          window.clearInterval(clockIntervalRef.current);
          clockIntervalRef.current = null;
        }
        finishSelf();
      }
    }, CLOCK_TICK_MS);
  }, [finishSelf, scheduleAiTap]);

  const beginMatch = useCallback((meta: MatchMeta, opp: OpponentInfo) => {
    matchMetaRef.current = meta;
    opponentInfoRef.current = opp;
    isPracticeRef.current = meta.isPractice;
    resolvedRef.current = false;
    finishedSelfRef.current = false;
    localTapsRef.current = 0;
    opponentTapsRef.current = 0;
    lastFlushAtRef.current = 0;

    setIsPractice(meta.isPractice);
    setOpponent(opp);
    setYourTaps(0);
    setOpponentTaps(0);
    setOutcome(null);
    setShowAiOffer(false);
    setState('countdown');
    antiCheat.reset();
    startClock();
  }, [antiCheat, startClock]);

  const reset = useCallback(() => {
    clearTimers();
    detachListeners();
    matchMetaRef.current = null;
    opponentInfoRef.current = null;
    localTapsRef.current = 0;
    opponentTapsRef.current = 0;
    resolvedRef.current = false;
    finishedSelfRef.current = false;
    isPracticeRef.current = false;
    setState('idle');
    setOpponent(null);
    setYourTaps(0);
    setOpponentTaps(0);
    setCountdownValue(null);
    setTimeRemainingMs(MATCH_DURATION_MS);
    setOutcome(null);
    setIsPractice(false);
    setShowAiOffer(false);
    antiCheat.reset();
  }, [clearTimers, detachListeners, antiCheat]);

  const joinQueue = useCallback(() => {
    reset();
    setState('searching');

    const entry: QueueEntry = {
      uid: meRef.current.uid,
      username: meRef.current.username,
      countryCode: meRef.current.countryCode,
      joinedAt: Date.now(),
    };
    void joinQueueService(entry);

    queueUnsubRef.current = listenToQueue((entries) => {
      void attemptPairing(entries, meRef.current.uid);
    });

    assignmentUnsubRef.current = listenForAssignment(meRef.current.uid, (matchId) => {
      void clearAssignment(meRef.current.uid);
      queueUnsubRef.current?.();
      queueUnsubRef.current = null;
      if (aiFallbackTimerRef.current) {
        window.clearTimeout(aiFallbackTimerRef.current);
        aiFallbackTimerRef.current = null;
      }
      setShowAiOffer(false);

      matchUnsubRef.current = listenToMatch(matchId, (match) => {
        if (!match) return;
        if (!matchMetaRef.current) {
          const oppData = match.player1.uid === meRef.current.uid ? match.player2 : match.player1;
          beginMatch(
            { matchId, startTime: match.startTime, duration: match.duration, opponentUid: oppData.uid, isPractice: false },
            { uid: oppData.uid, username: oppData.username, countryCode: oppData.countryCode },
          );
        }
        handleMatchUpdate(match);
      });
    });

    aiFallbackTimerRef.current = window.setTimeout(() => {
      if (stateRef.current === 'searching') setShowAiOffer(true);
    }, QUEUE_AI_FALLBACK_MS);
  }, [reset, beginMatch, handleMatchUpdate]);

  const cancelSearch = useCallback(() => {
    void leaveQueueService(meRef.current.uid);
    reset();
  }, [reset]);

  const startPracticeMatch = useCallback(() => {
    clearTimers();
    detachListeners();
    void leaveQueueService(meRef.current.uid);

    const now = Date.now();
    const botCountry = AI_COUNTRY_POOL[Math.floor(Math.random() * AI_COUNTRY_POOL.length)];
    beginMatch(
      { matchId: 'practice', startTime: now + MATCH_COUNTDOWN_MS, duration: MATCH_DURATION_MS, opponentUid: 'ai-bot', isPractice: true },
      { uid: 'ai-bot', username: 'AI Bot', countryCode: botCountry },
    );
  }, [beginMatch, clearTimers, detachListeners]);

  const registerTap = useCallback((isTrusted: boolean) => {
    if (stateRef.current !== 'live') return;
    localTapsRef.current += 1;
    setYourTaps(localTapsRef.current);
    antiCheat.registerTap(isTrusted);
  }, [antiCheat]);

  const playAgain = useCallback(() => {
    reset();
  }, [reset]);

  // Leave the queue / detach everything if the component unmounts mid-flow.
  useEffect(() => {
    return () => {
      clearTimers();
      detachListeners();
      if (stateRef.current === 'searching') void leaveQueueService(meRef.current.uid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    opponent,
    yourTaps,
    opponentTaps,
    countdownValue,
    timeRemainingMs,
    outcome,
    isPractice,
    showAiOffer,
    currentTPS: antiCheat.currentTPS,
    joinQueue,
    cancelSearch,
    startPracticeMatch,
    registerTap,
    playAgain,
  };
}

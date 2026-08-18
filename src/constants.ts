export const MATCH_DURATION_MS = 60_000;
export const MATCH_COUNTDOWN_MS = 3_000;
export const MATCH_WIN_REWARD = 1_000;
export const MATCH_LOSS_PENALTY = 2_000;

export const FLEX_MONEY_DIVISOR = 1_000; // 1000 taps = $1

export const TAP_BATCH_FLUSH_MS = 1_500; // how often local taps are flushed to Firestore
export const MATCH_TAP_FLUSH_MS = 250; // how often live match taps sync to Realtime Database
export const QUEUE_AI_FALLBACK_MS = 12_000; // offer a practice match if no opponent is found

/**
 * Anti-cheat thresholds. Tuned around realistic human tapping limits —
 * elite single-finger clicking tops out well below these ceilings, so
 * exceeding them repeatedly is a strong automation signal, not a fluke.
 */
export const ANTI_CHEAT = {
  MAX_INSTANT_TPS: 15, // hard flag: taps counted in any rolling 1s window
  SUSTAINED_TPS_THRESHOLD: 11, // flag: average rate sustained over the window below
  SUSTAINED_WINDOW_MS: 4_000,
  MIN_SAMPLES_FOR_SUSTAINED: 6,
  MIN_INTERVAL_STDDEV_MS: 18, // below this, spacing between taps looks scripted
  MIN_SAMPLES_FOR_VARIANCE: 8,
  MAX_TAPS_PER_SERVER_WRITE: 200, // enforced again server-side via Firestore rules
};

export const ADMIN_AUTO_FLAG_THRESHOLD = 2; // suspicionScore at which a user surfaces in the admin queue
export const ADMIN_SUSPICIOUS_LIST_LIMIT = 100;

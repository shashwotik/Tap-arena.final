import { ANTI_CHEAT } from '../config/constants';
import type { AntiCheatFlag } from '../types';

export interface TapEventInput {
  timestamp: number;
  isTrusted: boolean;
  hidden: boolean;
}

export interface RegisterTapResult {
  tps: number;
  flags: AntiCheatFlag[];
}

/**
 * Detects auto-clickers and scripted taps from timing patterns alone —
 * no server round trip needed to react locally. This runs identically
 * whether taps come from the home screen or a live match, since a match
 * is exactly where a cheater is most motivated to automate.
 *
 * Signals used:
 *  - event.isTrusted: false means the event was dispatched by a script,
 *    not a real pointer — the strongest single signal available.
 *  - Page Visibility: taps while the tab is hidden can't be a real user.
 *  - Instantaneous TPS: taps counted in any rolling 1s window.
 *  - Sustained TPS: average rate held over several seconds — harder to
 *    fake by accident, catches jitter-clickers that stay under the
 *    instant ceiling.
 *  - Interval variance: real human taps have irregular spacing; a
 *    near-zero standard deviation between taps looks scripted.
 *
 * Flags are advisory, not punitive — they get reported for admin review
 * rather than silently blocking a possibly-legitimate fast tapper.
 */
export class AntiCheatEngine {
  private timestamps: number[] = [];
  private violations: AntiCheatFlag[] = [];
  private peakTPS = 0;

  registerTap(input: TapEventInput): RegisterTapResult {
    const flags: AntiCheatFlag[] = [];
    const now = input.timestamp;

    if (!input.isTrusted) {
      flags.push({ reason: 'SYNTHETIC_EVENT', detail: 'Tap was not user-generated', timestamp: now });
    }
    if (input.hidden) {
      flags.push({ reason: 'HIDDEN_TAB_TAP', detail: 'Tap registered while page was not visible', timestamp: now });
    }

    this.timestamps.push(now);
    const cutoff = now - 5_000;
    this.timestamps = this.timestamps.filter((t) => t >= cutoff);

    const lastSecond = this.timestamps.filter((t) => t >= now - 1_000).length;
    if (lastSecond > this.peakTPS) this.peakTPS = lastSecond;

    if (lastSecond > ANTI_CHEAT.MAX_INSTANT_TPS) {
      flags.push({ reason: 'TPS_EXCEEDED', detail: `${lastSecond} taps in 1s`, timestamp: now });
    }

    const sustainedWindow = this.timestamps.filter((t) => t >= now - ANTI_CHEAT.SUSTAINED_WINDOW_MS);
    if (sustainedWindow.length >= ANTI_CHEAT.MIN_SAMPLES_FOR_SUSTAINED) {
      const sustainedTPS = sustainedWindow.length / (ANTI_CHEAT.SUSTAINED_WINDOW_MS / 1000);
      if (sustainedTPS > ANTI_CHEAT.SUSTAINED_TPS_THRESHOLD) {
        flags.push({ reason: 'SUSTAINED_RATE', detail: `${sustainedTPS.toFixed(1)} TPS sustained`, timestamp: now });
      }
    }

    if (this.timestamps.length >= ANTI_CHEAT.MIN_SAMPLES_FOR_VARIANCE) {
      const recent = this.timestamps.slice(-ANTI_CHEAT.MIN_SAMPLES_FOR_VARIANCE);
      const intervals = recent.slice(1).map((t, i) => t - recent[i]);
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
      const stddev = Math.sqrt(variance);
      if (mean < 400 && stddev < ANTI_CHEAT.MIN_INTERVAL_STDDEV_MS) {
        flags.push({ reason: 'ROBOTIC_PATTERN', detail: `interval stddev ${stddev.toFixed(1)}ms`, timestamp: now });
      }
    }

    if (flags.length) this.violations.push(...flags);
    return { tps: lastSecond, flags };
  }

  getPeakTPS() {
    return this.peakTPS;
  }

  getViolations() {
    return this.violations;
  }

  reset() {
    this.timestamps = [];
    this.violations = [];
    this.peakTPS = 0;
  }
}

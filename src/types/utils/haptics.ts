let enabled = true;

export function setVibrationEnabled(value: boolean) {
  enabled = value;
}

/** No-ops silently on browsers/devices without the Vibration API (e.g. iOS Safari). */
export function vibrate(pattern: number | number[]) {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration API can throw in some embedded webviews — safe to ignore.
  }
}

export const HAPTIC = {
  tap: 8,
  levelUp: [40, 30, 60],
  countdownTick: 15,
  go: [20, 10, 40],
  win: [30, 20, 30, 20, 60],
  lose: [80],
  flag: [15, 60, 15],
};

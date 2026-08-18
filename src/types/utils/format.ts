import { FLEX_MONEY_DIVISOR } from '../config/constants';

/** 1234567 -> "1,234,567" */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/** 1234567 -> "1.2M", 8600 -> "8.6K" — used where space is tight. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`;
  return String(Math.round(value));
}

/** Total taps -> Flex Money display string, e.g. "$1,234.00" */
export function formatFlexMoney(totalTaps: number): string {
  const dollars = totalTaps / FLEX_MONEY_DIVISOR;
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(epochMs: number, locale = 'en-US'): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

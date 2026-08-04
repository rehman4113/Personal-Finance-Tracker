/** Money formatting/parsing helpers shared by every feature. */
export const DEFAULT_CURRENCY = 'PKR';

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: 'Rs',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  SAR: 'SAR',
};

export function currencySymbol(currency?: string | null): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  return CURRENCY_SYMBOLS[code] ?? code;
}

/** "Rs 12,500.00" — optional +/- sign. */
export function formatAmount(value: number | null | undefined, currency?: string | null, withSign = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = withSign && value > 0 ? '+' : '';
  const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${currencySymbol(currency)} ${formatted}`;
}

/** Compact form for charts/stat tiles: 12.5K / 1.2M. */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

/** Parses a raw string (possibly "12,500.50") to a number; NaN-safe. */
export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}
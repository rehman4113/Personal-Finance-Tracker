/**
 * Generic option shape for the searchable dropdown.
 * WHY: the dropdown must stay agnostic of feature models (master data, wallets,
 * country codes, filters…). Feature callers map their data to this shape.
 */
export interface SearchableOption<V extends string | number = number> {
  /** The value written to the form control (e.g. numeric id or country code). */
  value: V;
  /** Display label (also used for live filtering). */
  name: string;
  /** Optional secondary line (e.g. wallet balance) rendered muted. */
  subtitle?: string;
  /** When false/undefined the delete ✕ is hidden even if allowDelete is on. */
  deletable?: boolean;
}
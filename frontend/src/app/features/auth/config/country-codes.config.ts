import { CountryCodeOption } from '../interfaces/country-code-option.interface';

/**
 * Allowed country dialing codes — Section 11.4 / Section 19.
 */
export const COUNTRY_CODES: CountryCodeOption[] = [
  { country: 'Pakistan', dialingCode: '+92' },
  { country: 'Turkey', dialingCode: '+90' },
  { country: 'Saudi Arabia', dialingCode: '+966' },
  { country: 'Azerbaijan', dialingCode: '+994' },
  { country: 'India', dialingCode: '+91' },
  { country: 'Afghanistan', dialingCode: '+93' },
  { country: 'China', dialingCode: '+86' },
  { country: 'UAE', dialingCode: '+971' },
  { country: 'Qatar', dialingCode: '+974' },
  { country: 'Other', dialingCode: '' },
];

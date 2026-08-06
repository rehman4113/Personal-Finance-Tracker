import { CountryCodeOption } from '../interfaces/country-code-option.interface';

/**
 * Allowed country dialing codes — Section 11.4 / Section 19.
 */
export const COUNTRY_CODES: CountryCodeOption[] = [
  { country: 'Pakistan', dialingCode: '+92', flag: '🇵🇰' },
  { country: 'Turkey', dialingCode: '+90', flag: '🇹🇷' },
  { country: 'Saudi Arabia', dialingCode: '+966', flag: '🇸🇦' },
  { country: 'Azerbaijan', dialingCode: '+994', flag: '🇦🇿' },
  { country: 'India', dialingCode: '+91', flag: '🇮🇳' },
  { country: 'Afghanistan', dialingCode: '+93', flag: '🇦🇫' },
  { country: 'China', dialingCode: '+86', flag: '🇨🇳' },
  { country: 'UAE', dialingCode: '+971', flag: '🇦🇪' },
  { country: 'Qatar', dialingCode: '+974', flag: '🇶🇦' },
  { country: 'Other', dialingCode: '', flag: '🌐' },
];

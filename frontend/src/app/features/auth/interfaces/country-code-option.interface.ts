/** Country code option for dropdown — Section 9.2 / Section 11.4 */
export interface CountryCodeOption {
  country: string;
  dialingCode: string;
  /** Flag emoji shown next to the dialing code in the unified phone field. */
  flag: string;
}

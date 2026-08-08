export interface UpdateProfileRequest {
  firstName: string;
  lastName?: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  /** Curated avatar id (1..6) — null clears it. */
  profileIconId?: number | null;
}

/**
 * Frontend user identity model.
 * WHY: UI and guards consume a stable shape — not raw login DTOs.
 */
export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  status: string;
  emailVerified: boolean;
  /** True once the user has finished the onboarding demo tour. */
  demo: boolean;
  /** Curated avatar id (1..6) — null when the user has no curated avatar. */
  profileIconId?: number | null;
  /** Uploaded profile picture URL — null when the user has no photo. */
  profilePictureUrl?: string | null;
}

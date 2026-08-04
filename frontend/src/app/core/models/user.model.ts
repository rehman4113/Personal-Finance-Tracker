/**
 * Frontend user identity model.
 * WHY: UI and guards consume a stable shape — not raw login DTOs.
 */
export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  emailVerified: boolean;
}

/**
 * JWT token pair returned by login/refresh endpoints.
 */
export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  /** Computed client-side: Date when access token expires */
  expiresAt?: Date;
}

import { ApiResponse } from './api-response.dto';

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseData>;

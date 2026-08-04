import { ApiResponse } from './api-response.dto';

export interface LoginUserDto {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  emailVerified: boolean;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: LoginUserDto;
}

export type LoginResponse = ApiResponse<LoginResponseData>;

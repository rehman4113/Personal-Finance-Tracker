import { ApiResponse } from './api-response.dto';

export interface RegisterResponseData {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

export type RegisterResponse = ApiResponse<RegisterResponseData>;

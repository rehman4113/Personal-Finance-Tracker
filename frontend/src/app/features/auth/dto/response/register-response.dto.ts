import { ApiResponse } from './api-response.dto';

export interface RegisterResponseData {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  message: string;
}

export type RegisterResponse = ApiResponse<RegisterResponseData>;

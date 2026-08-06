import { ApiResponse } from './api-response.dto';

export interface ResetPasswordResponseData {
  message: string;
}

export type ResetPasswordResponse = ApiResponse<ResetPasswordResponseData>;

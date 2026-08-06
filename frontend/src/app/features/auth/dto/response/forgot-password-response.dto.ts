import { ApiResponse } from './api-response.dto';

export interface ForgotPasswordResponseData {
  message: string;
}

export type ForgotPasswordResponse = ApiResponse<ForgotPasswordResponseData>;

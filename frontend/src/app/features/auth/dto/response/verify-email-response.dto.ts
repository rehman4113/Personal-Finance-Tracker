import { ApiResponse } from './api-response.dto';

export interface VerifyEmailResponseData {
  message: string;
}

export type VerifyEmailResponse = ApiResponse<VerifyEmailResponseData>;

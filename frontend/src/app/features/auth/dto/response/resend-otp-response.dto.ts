import { ApiResponse } from './api-response.dto';

export interface ResendOtpResponseData {
  message: string;
}

export type ResendOtpResponse = ApiResponse<ResendOtpResponseData>;

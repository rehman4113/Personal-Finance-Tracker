import { ApiResponse } from './api-response.dto';

export interface LogoutResponseData {
  message: string;
}

export type LogoutResponse = ApiResponse<LogoutResponseData>;

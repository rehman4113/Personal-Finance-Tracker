import { TokenInfo } from './token-info.model';
import { User } from './user.model';

/**
 * Combined auth session state: user profile + tokens.
 */
export interface AuthenticatedUser {
  user: User;
  tokenInfo: TokenInfo;
}

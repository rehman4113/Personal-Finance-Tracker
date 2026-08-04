/** PasswordRequirement — Section 6.7 / Section 10 */
export interface PasswordRequirement {
  label: string;
  validator: (value: string) => boolean;
  met: boolean;
}

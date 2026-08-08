/**
 * Curated avatar options for the profile picker (Section 1).
 * WHY: exactly 6 curated avatars with a stable id (1..6) + asset reference,
 * mirroring the pf_profile_avatars seed so the backend and frontend render
 * the same set — this config doubles as the offline fallback.
 */
export interface ProfileAvatarOption {
  /** Stable id (1..6) — stored on the user as profileIconId. */
  id: number;
  code: string;
  name: string;
  /** Frontend asset path (e.g. /assets/avatars/avatar-1.svg). */
  assetPath: string;
}

export const PROFILE_AVATARS: ProfileAvatarOption[] = [
  { id: 1, code: 'boy', name: 'Boy', assetPath: '/assets/avatars/avatar-1.svg' },
  { id: 2, code: 'girl', name: 'Girl', assetPath: '/assets/avatars/avatar-2.svg' },
  { id: 3, code: 'man', name: 'Young Man', assetPath: '/assets/avatars/avatar-3.svg' },
  { id: 4, code: 'lady', name: 'Lady', assetPath: '/assets/avatars/avatar-4.svg' },
  { id: 5, code: 'teen', name: 'Teen Girl', assetPath: '/assets/avatars/avatar-5.svg' },
  { id: 6, code: 'grandpa', name: 'Grandfather', assetPath: '/assets/avatars/avatar-6.svg' },
];
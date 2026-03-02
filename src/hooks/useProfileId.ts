import { useAuth } from '../context/AuthContext';

/**
 * Returns the current user's profile ID.
 * Falls back to hardcoded ID when auth is not yet configured.
 */
export function useProfileId(): string {
  const { profileId } = useAuth();
  // Fallback to hardcoded single-user ID if auth hasn't set profileId yet
  return profileId || '00000000-0000-0000-0000-000000000001';
}

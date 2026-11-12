export function isVerifiedGoogleProfile(profile: Record<string, unknown> | null | undefined): boolean {
  return profile?.email_verified === true;
}

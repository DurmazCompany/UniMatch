export function calculateProfilePower(profile: {
  photos: string | null;
  bio: string | null;
  hobbies: string | null;
  selfieVerified: boolean;
}): number {
  let power = 0;

  // Photos: +20 for having 2+ photos
  const photos = profile.photos ? JSON.parse(profile.photos) : [];
  if (photos.length >= 2) power += 20;

  // Bio: +15 for having a bio
  if (profile.bio && profile.bio.trim().length > 0) power += 15;

  // Hobbies: +15 for having at least 1 hobby
  const hobbies = profile.hobbies ? JSON.parse(profile.hobbies) : [];
  if (hobbies.length > 0) power += 15;

  // Selfie verification: +30
  if (profile.selfieVerified) power += 30;

  // Additional points for completeness
  // +5 for 3+ photos
  if (photos.length >= 3) power += 5;
  // +5 for 3+ hobbies
  if (hobbies.length >= 3) power += 5;
  // +10 for bio > 50 chars
  if (profile.bio && profile.bio.trim().length > 50) power += 10;

  // Cap at 100
  return Math.min(power, 100);
}

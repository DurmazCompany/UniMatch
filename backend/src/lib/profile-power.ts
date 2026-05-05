export function calculateProfilePower(profile: {
  photos: string | null;
  bio: string | null;
  hobbies: string | null;
  streakCount?: number;
}): number {
  let power = 0;

  const photos = profile.photos ? JSON.parse(profile.photos) : [];
  const hobbies = profile.hobbies ? JSON.parse(profile.hobbies) : [];
  const bioLen = profile.bio?.trim().length ?? 0;

  // Photos
  if (photos.length >= 2) power += 20;
  if (photos.length >= 3) power += 5;
  if (photos.length >= 4) power += 10;

  // Bio
  if (bioLen > 0) power += 15;
  if (bioLen > 50) power += 10;
  if (bioLen >= 100) power += 5;

  // Hobbies
  if (hobbies.length > 0) power += 15;
  if (hobbies.length >= 3) power += 5;

  // Activity
  if ((profile.streakCount ?? 0) >= 7) power += 5;

  return Math.min(power, 100);
}

/**
 * Calculate compatibility score between two profiles.
 *
 * Algorithm:
 * - Base: 30 (same university)
 * - +10 per shared hobby (up to 30 max)
 * - +15 if active within 1 day, +10 if within 3 days
 * - +15% of their profilePower
 * - Max: 99
 */
export function calculateCompatibility(
  myProfile: { hobbies: string | null; university: string | null },
  theirProfile: { hobbies: string | null; university: string | null; profilePower: number; updatedAt: Date }
): number {
  let score = 0;

  // Same university base score
  if (myProfile.university && theirProfile.university && myProfile.university === theirProfile.university) {
    score += 30;
  }

  // Hobbies comparison
  const myHobbies: string[] = JSON.parse(myProfile.hobbies || "[]");
  const theirHobbies: string[] = JSON.parse(theirProfile.hobbies || "[]");
  const sharedHobbies = myHobbies.filter((h) => theirHobbies.includes(h));
  if (sharedHobbies.length > 0) {
    score += 10 * Math.min(sharedHobbies.length, 3);
  }

  // Activity score based on updatedAt
  const daysSinceActive = Math.floor((Date.now() - new Date(theirProfile.updatedAt).getTime()) / 86400000);
  if (daysSinceActive <= 1) {
    score += 15;
  } else if (daysSinceActive <= 3) {
    score += 10;
  }

  // Profile completeness (15% of profilePower)
  score += Math.floor(theirProfile.profilePower * 0.15);

  return Math.min(score, 99);
}

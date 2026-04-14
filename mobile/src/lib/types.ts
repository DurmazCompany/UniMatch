export interface University {
  id: string;
  name: string;
  emailDomain: string;
}

export interface Profile {
  id: string;
  userId: string;
  universityId: string;
  university: University;
  name: string;
  birthDate: string;
  gender: string;
  department: string;
  year: number;
  bio?: string;
  photos: string; // JSON string array
  hobbies?: string; // JSON string array
  lifestyle?: string; // JSON object
  courses?: string; // JSON string array
  selfieVerified: boolean;
  profilePower: number;
  streakCount: number;
  swipesToday: number;
  isOnCampusToday: boolean;
  compatibilityScore?: number;
  isPremium?: boolean;
  premiumUntil?: string;
}

// Who liked me response types
export interface LikerProfile {
  id: string;
  name?: string;
  photos: string[];
  department: string;
  year: number | null;
  profilePower?: number;
}

export interface WhoLikedMeResponse {
  isPremium: boolean;
  likers: LikerProfile[];
  count: number;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: string;
  expiresAt: string;
  iceBreakerQuestion: string;
  iceBreakerAccepted: boolean;
  compatibilityScore: number;
  isActive: boolean;
  user1: Profile;
  user2: Profile;
  messages: Message[];
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  messageType: "text" | "voice";
  voiceUrl?: string;
  voiceDuration?: number;
  createdAt: string;
  sender: Profile;
}

export interface SwipeResponse {
  match?: Match;
  swipesLeft: number;
}

export interface University {
  id: string;
  displayName: string;
  slug: string;
  emailDomain: string;
}

export interface Profile {
  id: string;
  userId: string;
  universityId?: string;
  universityRef?: University | null;
  university: string;
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
  role?: string;
  referralCode?: string;
  isOnCampusToday: boolean;
  compatibilityScore?: number;
  isPremium?: boolean;
  premiumUntil?: string;
  boostUntil?: string | null;
  premiumTier?: "flort" | "ask" | null;
  rewindsToday?: number;
  matchExtensionsThisWeek?: number;
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
  messageType: "text" | "voice" | "photo" | "ephemeral_photo";
  voiceUrl?: string;
  voiceDuration?: number;
  createdAt: string;
  readAt?: string | null;
  sender: Profile;
}

export interface SwipeResponse {
  match?: Match;
  swipesLeft: number;
}

export interface GiftCatalogItem {
  id: string;
  nameTr: string;
  emoji: string;
  coinCost: number;
  sortOrder: number;
  isActive: boolean;
}

export interface GiftSent {
  id: string;
  senderId: string;
  receiverId: string;
  giftId: string;
  matchId: string | null;
  coinCost: number;
  createdAt: string;
  gift?: GiftCatalogItem;
  sender?: { id: string; name?: string; photos?: string };
}

export interface CoinLedgerEntry {
  id: string;
  delta: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}
